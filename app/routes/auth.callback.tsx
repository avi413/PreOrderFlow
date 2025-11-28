import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { shopify } from "../services/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.auth.callback({ request });
  const url = new URL(request.url);
  const host = url.searchParams.get("host") ?? "";
  return redirect(`/app?shop=${encodeURIComponent(session.shop)}&host=${encodeURIComponent(host)}`);
};
