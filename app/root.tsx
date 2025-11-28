import type { LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData
} from "@remix-run/react";
import polarisStyles from "@shopify/polaris/build/esm/styles.css";
import appStyles from "./styles/app.css";

type RootLoaderData = {
  ENV: {
    SHOPIFY_API_KEY?: string;
    SHOPIFY_APP_URL?: string;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json<RootLoaderData>({
    ENV: {
      SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY,
      SHOPIFY_APP_URL: process.env.SHOPIFY_APP_URL
    }
  });
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: polarisStyles },
  { rel: "stylesheet", href: appStyles }
];

export const meta: MetaFunction = () => [
  { title: "Shopify Remix Prisma App" },
  { name: "viewport", content: "width=device-width,initial-scale=1" }
];

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en" data-color-mode="light">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        {process.env.NODE_ENV === "development" && <LiveReload />}
        {data?.ENV ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `window.ENV = ${JSON.stringify(data.ENV)};`
            }}
          />
        ) : null}
      </body>
    </html>
  );
}
