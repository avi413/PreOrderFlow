import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { shopify } from "../services/shopify.server";

export const loader = async (_args: LoaderFunctionArgs) => {
  return new Response("ok", { status: 200 });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  return shopify.webhooks.process({ request });
};
