import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Prisma } from "@prisma/client";
import { getPreOrders, deletePreOrder } from "../services/preorder.server";
import { shopify } from "../services/shopify.server";

const SHOP_DOMAIN_PATTERN = /^[a-z0-9.-]+$/i;

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const identifier = params.identifier;

  if (!identifier) {
    return json({ error: "Missing shop domain" }, { status: 400 });
  }

  const normalizedDomain = identifier.trim().toLowerCase();

  if (!SHOP_DOMAIN_PATTERN.test(normalizedDomain)) {
    return json({ error: "Invalid shop domain" }, { status: 400 });
  }

  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") ?? undefined;
  const variantId = url.searchParams.get("variantId") ?? undefined;
  const includeDisabled = url.searchParams.get("includeDisabled") === "true";

  const records = await getPreOrders(normalizedDomain);
  const filtered = records.filter((record) => {
    if (!includeDisabled && !record.enabled) return false;
    if (productId && record.productId !== productId) return false;
    if (variantId && record.variantId !== variantId) return false;
    return true;
  });

  return json(
    { shopDomain: normalizedDomain, records: filtered },
    {
      headers: {
        "Cache-Control": "public, max-age=60"
      }
    }
  );
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  if (request.method !== "DELETE") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  await shopify.authenticate.admin(request);

  const recordId = params.identifier;

  if (!recordId) {
    return json({ error: "Missing id" }, { status: 400 });
  }

  try {
    await deletePreOrder(recordId);
    return json({ status: "deleted", id: recordId });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return json({ error: "Pre-order setting not found" }, { status: 404 });
    }

    console.error("Failed to delete pre-order setting", error);
    return json({ error: "Unable to delete pre-order setting" }, { status: 500 });
  }
};
