import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { ensureStorefrontScript } from "../functions/storefront-script.server";
import { shopify } from "../services/shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await shopify.authenticate.admin(request);
  await ensureStorefrontScript(session.shop, admin);
  return json({ status: "queued", shop: session.shop });
};
