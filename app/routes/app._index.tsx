import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, Layout, Page, Text, BlockStack } from "@shopify/polaris";
import { shopify } from "../services/shopify.server";
import { fetchProductMetrics, fetchShopInformation } from "../services/shopifyAdmin.server";

type ShopInfo = {
  name?: string;
  myshopifyDomain?: string;
  primaryDomain?: { host?: string; url?: string } | null;
};

type ProductInfo = {
  id?: string;
  title?: string;
  status?: string;
  totalInventory?: number | null;
};

type DashboardLoader = {
  shop: ShopInfo | null;
  products: ProductInfo[];
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);

  let shop: ShopInfo | null = null;
  let products: ProductInfo[] = [];

  try {
    const [shopResponse, productResponse] = await Promise.all([
      fetchShopInformation(session),
      fetchProductMetrics(session)
    ]);
    shop = shopResponse as ShopInfo;
    products = productResponse as ProductInfo[];
  } catch (error) {
    console.warn("Unable to fetch Shopify data", error);
  }

  return json<DashboardLoader>({
    shop,
    products
  });
};

export default function DashboardRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="App dashboard">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="h2" variant="headingLg">
                Welcome {data.shop?.name ?? "to your new app"}
              </Text>
              <Text variant="bodyMd">
                Use this space to orchestrate installation health, onboarding steps, and billing status.
              </Text>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Recently updated products" sectioned>
            {data.products?.length ? (
              <BlockStack gap="200">
                {data.products.map((product) => (
                  <BlockStack key={product.id} gap="200">
                    <Text variant="headingMd" as="h3">
                      {product.title}
                    </Text>
                    <Text tone="subdued">
                      Status: {product.status} · Inventory: {product.totalInventory ?? "n/a"}
                    </Text>
                  </BlockStack>
                ))}
              </BlockStack>
            ) : (
              <Text tone="subdued">No products yet. They will appear after Shopify auth completes.</Text>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
