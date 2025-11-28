import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Badge,
  BlockStack,
  Button,
  Card,
  Checkbox,
  Divider,
  InlineStack,
  Layout,
  Page,
  Text,
  TextField
} from "@shopify/polaris";
import type { PreOrderSetting } from "@prisma/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { shopify } from "../services/shopify.server";
import { fetchProductVariants } from "../services/shopifyAdmin.server";
import { getPreOrders } from "../services/preorder.server";

type NormalizedVariant = {
  gid: string;
  id: string;
  title: string;
  sku?: string | null;
  availableForSale?: boolean;
  inventoryQuantity?: number | null;
};

type NormalizedProduct = {
  gid: string;
  id: string;
  title: string;
  handle?: string | null;
  variants: NormalizedVariant[];
};

type ProductsLoaderData = {
  shopDomain: string;
  products: NormalizedProduct[];
  preOrders: Record<string, PreOrderSetting>;
};

function extractLegacyId(gid?: string | null) {
  if (!gid) return null;
  const parts = gid.split("/");
  return parts.at(-1) ?? null;
}

function normalizeProducts(rawProducts: any[]): NormalizedProduct[] {
  return rawProducts
    .map((product) => {
      const normalizedVariants =
        product?.variants?.nodes
          ?.map((variant: any) => {
            const variantId = extractLegacyId(variant?.id);
            if (!variantId) return null;
            return {
              gid: variant.id,
              id: variantId,
              title: variant.title ?? "Untitled variant",
              sku: variant.sku ?? null,
              availableForSale: Boolean(variant.availableForSale),
              inventoryQuantity:
                typeof variant.inventoryQuantity === "number" ? variant.inventoryQuantity : null
            } satisfies NormalizedVariant;
          })
          .filter(Boolean) ?? [];

      if (!normalizedVariants.length) return null;

      const productId = extractLegacyId(product?.id);

      if (!productId) return null;

      return {
        gid: product?.id ?? productId,
        id: productId,
        title: product?.title ?? "Untitled product",
        handle: product?.handle ?? null,
        variants: normalizedVariants as NormalizedVariant[]
      };
    })
    .filter((product): product is NormalizedProduct => Boolean(product?.variants?.length));
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);

  try {
    const [productResponse, storedPreOrders] = await Promise.all([
      fetchProductVariants(session),
      getPreOrders(session.shop)
    ]);

    const products = normalizeProducts(Array.isArray(productResponse) ? productResponse : []);
    const preOrders = storedPreOrders.reduce<Record<string, PreOrderSetting>>((acc, setting) => {
      acc[setting.variantId] = setting;
      return acc;
    }, {});

    return json<ProductsLoaderData>({
      shopDomain: session.shop,
      products,
      preOrders
    });
  } catch (error) {
    console.error("Unable to load pre-order settings", error);
    return json<ProductsLoaderData>({
      shopDomain: session.shop,
      products: [],
      preOrders: {}
    });
  }
};

type VariantFormProps = {
  product: NormalizedProduct;
  variant: NormalizedVariant;
  savedSetting?: PreOrderSetting;
};

type SaveResponse = {
  status: string;
  records?: PreOrderSetting[];
  error?: string;
};

type DeleteResponse = {
  status?: string;
  id?: string;
  error?: string;
};

function VariantPreOrderCard({ product, variant, savedSetting }: VariantFormProps) {
  const saveFetcher = useFetcher<SaveResponse>();
  const deleteFetcher = useFetcher<DeleteResponse>();
  const [settingId, setSettingId] = useState<string | undefined>(savedSetting?.id);
  const [enabled, setEnabled] = useState<boolean>(savedSetting?.enabled ?? false);
  const [expectedDate, setExpectedDate] = useState<string>(
    savedSetting?.expectedDate ? savedSetting.expectedDate.slice(0, 10) : ""
  );
  const [limitQuantity, setLimitQuantity] = useState<string>(
    savedSetting?.limitQuantity ? String(savedSetting.limitQuantity) : ""
  );
  const [customText, setCustomText] = useState<string>(savedSetting?.customText ?? "");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const syncFromSetting = useCallback((setting?: PreOrderSetting) => {
    setSettingId(setting?.id);
    setEnabled(setting?.enabled ?? false);
    setExpectedDate(setting?.expectedDate ? setting.expectedDate.slice(0, 10) : "");
    setLimitQuantity(setting?.limitQuantity ? String(setting.limitQuantity) : "");
    setCustomText(setting?.customText ?? "");
  }, []);

  useEffect(() => {
    syncFromSetting(savedSetting);
  }, [savedSetting, syncFromSetting]);

  useEffect(() => {
    if (saveFetcher.state === "submitting") {
      setFeedback(null);
      setError(null);
    }

    if (saveFetcher.state === "idle" && saveFetcher.data) {
      if (saveFetcher.data.error) {
        setError(saveFetcher.data.error);
        return;
      }

      const updated = saveFetcher.data.records?.find((record) => record.variantId === variant.id);
      if (updated) {
        syncFromSetting(updated);
        setFeedback("Pre-order settings saved");
      }
    }
  }, [saveFetcher.state, saveFetcher.data, variant.id, syncFromSetting]);

  useEffect(() => {
    if (deleteFetcher.state === "submitting") {
      setFeedback(null);
      setError(null);
    }

    if (deleteFetcher.state === "idle" && deleteFetcher.data) {
      if (deleteFetcher.data.error) {
        setError(deleteFetcher.data.error);
        return;
      }

      if (deleteFetcher.data.status === "deleted" && deleteFetcher.data.id === settingId) {
        syncFromSetting(undefined);
        setEnabled(false);
        setFeedback("Pre-order override removed");
      }
    }
  }, [deleteFetcher.state, deleteFetcher.data, settingId, syncFromSetting]);

  const handleSave = () => {
    setError(null);
    const payload = {
      id: settingId,
      productId: product.id,
      variantId: variant.id,
      enabled,
      expectedDate: expectedDate || null,
      limitQuantity: limitQuantity || null,
      customText: customText || null
    };

    const formData = new FormData();
    formData.append("payload", JSON.stringify(payload));
    saveFetcher.submit(formData, { method: "post", action: "/api/preorder/save" });
  };

  const handleDelete = () => {
    if (!settingId) return;
    deleteFetcher.submit(null, { method: "delete", action: `/api/preorder/${settingId}` });
  };

  const isSaving = saveFetcher.state !== "idle";
  const isDeleting = deleteFetcher.state !== "idle";

  return (
    <BlockStack gap="200">
      <Divider />
      <InlineStack align="space-between" wrap={false}>
        <BlockStack gap="100">
          <Text variant="headingMd" as="h3">
            {variant.title}
          </Text>
          <Text tone="subdued">
            Variant #{variant.id}
            {variant.sku ? ` · SKU ${variant.sku}` : ""}
          </Text>
        </BlockStack>
        <Badge tone={variant.availableForSale ? "success" : "critical"}>
          {variant.availableForSale ? "Available" : "Unavailable"}
        </Badge>
      </InlineStack>
      <Text tone="subdued">
        Current inventory:{" "}
        {typeof variant.inventoryQuantity === "number" ? variant.inventoryQuantity : "Unknown"}
      </Text>
      <Checkbox label="Enable Pre-Order" checked={enabled} onChange={(value) => setEnabled(value)} />
      <InlineStack gap="200" wrap>
        <TextField
          label="Expected ship date"
          type="date"
          value={expectedDate}
          onChange={(value) => setExpectedDate(value)}
          autoComplete="off"
          disabled={!enabled}
        />
        <TextField
          label="Limit quantity"
          type="number"
          min={1}
          value={limitQuantity}
          onChange={(value) => setLimitQuantity(value)}
          autoComplete="off"
          disabled={!enabled}
          placeholder="Unlimited"
        />
      </InlineStack>
      <TextField
        label="Button text override"
        helpText="Shown in place of “Add to cart”."
        value={customText}
        onChange={(value) => setCustomText(value)}
        autoComplete="off"
        disabled={!enabled}
        placeholder="Pre-Order Now"
      />
      <InlineStack align="end" gap="200">
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={!enabled && !settingId}
        >
          Save Pre-Order
        </Button>
        <Button
          tone="critical"
          onClick={handleDelete}
          loading={isDeleting}
          disabled={!settingId}
        >
          Remove override
        </Button>
      </InlineStack>
      {feedback && <Text tone="success">{feedback}</Text>}
      {error && <Text tone="critical">{error}</Text>}
    </BlockStack>
  );
}

export default function ProductsRoute() {
  const data = useLoaderData<typeof loader>();
  const preOrders = useMemo(() => data.preOrders, [data.preOrders]);

  return (
    <Page title="Pre-Order control center">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="200">
              <Text variant="headingLg" as="h2">
                Variant level controls
              </Text>
              <Text tone="subdued">
                Toggle Pre-Order mode per variant, set expectations, and limit how many units shoppers
                can reserve before launch.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        {data.products.length ? (
          data.products.map((product) => (
            <Layout.Section key={product.gid}>
              <Card sectioned>
                <BlockStack gap="400">
                  <BlockStack gap="100">
                    <Text variant="headingLg" as="h3">
                      {product.title}
                    </Text>
                    {product.handle && <Text tone="subdued">/{product.handle}</Text>}
                  </BlockStack>
                  {product.variants.map((variant) => (
                    <VariantPreOrderCard
                      key={variant.gid}
                      product={product}
                      variant={variant}
                      savedSetting={preOrders[variant.id]}
                    />
                  ))}
                </BlockStack>
              </Card>
            </Layout.Section>
          ))
        ) : (
          <Layout.Section>
            <Card sectioned>
              <Text>No products found yet. Create a product in Shopify to begin.</Text>
            </Card>
          </Layout.Section>
        )}
      </Layout>
    </Page>
  );
}
