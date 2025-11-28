import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const host = url.searchParams.get("host");

  if (!shop || !host) {
    return redirect("/auth" + (shop ? `?shop=${shop}` : ""));
  }

  const target = `/app?shop=${encodeURIComponent(shop)}&host=${encodeURIComponent(host)}`;
  const body = `<!DOCTYPE html><html><body><script>window.top.location.href = '${target}';</script></body></html>`;

  return new Response(body, { headers: { "Content-Type": "text/html" } });
};
