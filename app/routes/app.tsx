import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { ShopifyProviders } from "../components/ShopifyProviders";
import { AppLayout } from "../components/AppLayout";
import { shopify } from "../services/shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await shopify.authenticate.admin(request);
  const url = new URL(request.url);
  const hostParam = url.searchParams.get("host") ?? "";

  return json({
    shop: session.shop,
    host: hostParam,
    apiKey: process.env.SHOPIFY_API_KEY ?? ""
  });
};

export default function AppRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <ShopifyProviders apiKey={data.apiKey} host={data.host}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ShopifyProviders>
  );
}
