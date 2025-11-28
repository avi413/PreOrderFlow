import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { shopify } from "../services/shopify.server";
import { savePreOrder } from "../services/preorder.server";

const METHOD_NOT_ALLOWED = json({ error: "Method not allowed" }, { status: 405 });

type PreOrderPayload = {
  id?: string;
  productId?: string | number | null;
  variantId?: string | number | null;
  enabled?: boolean | string | null;
  expectedDate?: string | null;
  limitQuantity?: number | string | null;
  customText?: string | null;
};

async function extractPayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const formData = await request.formData();
  const raw = formData.get("payload");

  if (typeof raw === "string") {
    return JSON.parse(raw) as unknown;
  }

  throw new Error("Unsupported payload");
}

function assertPayloadShape(value: unknown): PreOrderPayload[] {
  const payload = Array.isArray(value) ? value : [value];

  if (!payload.length) {
    throw new Error("No payload received");
  }

  return payload;
}

function normalizeBoolean(value: PreOrderPayload["enabled"]): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value === "true" || value === "1" || value === "on";
  }
  return false;
}

function normalizeQuantity(value: PreOrderPayload["limitQuantity"]): number | null {
  if (value === undefined || value === null || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid quantity limit");
  }
  if (parsed <= 0) {
    throw new Error("Quantity limit must be positive");
  }
  return Math.trunc(parsed);
}

function normalizeDate(value: PreOrderPayload["expectedDate"]): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    throw new Error("Invalid expected date");
  }
  return new Date(timestamp).toISOString();
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return METHOD_NOT_ALLOWED;
  }

  const { session } = await shopify.authenticate.admin(request);

  let rawPayload: unknown;

  try {
    rawPayload = await extractPayload(request);
  } catch (error) {
    console.error("Unable to parse pre-order payload", error);
    return json({ error: "Invalid payload" }, { status: 400 });
  }

  let payloadItems: PreOrderPayload[];

  try {
    payloadItems = assertPayloadShape(rawPayload);
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 });
  }

  let normalizedRecords;

  try {
    normalizedRecords = payloadItems.map((item) => {
      const productId = item.productId?.toString().trim();
      const variantId = item.variantId?.toString().trim();
      const rawCustomText =
        typeof item.customText === "string" ? item.customText.trim() : item.customText ?? null;

      if (!productId || !variantId) {
        throw new Error("productId and variantId are required");
      }

      return {
        id: item.id?.toString(),
        shopDomain: session.shop,
        productId,
        variantId,
        enabled: normalizeBoolean(item.enabled),
        expectedDate: normalizeDate(item.expectedDate ?? null),
        limitQuantity: normalizeQuantity(item.limitQuantity ?? null),
        customText: rawCustomText || null
      };
    });
  } catch (error) {
    return json({ error: (error as Error).message }, { status: 400 });
  }

  try {
    const saved = await savePreOrder(normalizedRecords);
    return json({ status: "ok", records: saved });
  } catch (error) {
    console.error("Failed to save pre-order settings", error);
    return json({ error: "Unable to save pre-order settings" }, { status: 500 });
  }
};
