import type { LoaderFunctionArgs } from "@remix-run/node";
import { shopify } from "../services/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return shopify.auth.begin({ request, isOnline: false });
};
