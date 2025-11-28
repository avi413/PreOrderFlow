import { shopifyApp } from "@shopify/shopify-app-remix/server";
import { restResources } from "@shopify/shopify-api/rest/admin/2024-07";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import { prisma } from "./prisma.server";
import { billingConfig } from "./billing.server";
import { webhookHandlers } from "../webhooks/handlers.server";
import { ensureStorefrontScript } from "../functions/storefront-script.server";

const sessionStorage = new PrismaSessionStorage(prisma);

const appUrl = process.env.SHOPIFY_APP_URL ?? "https://example.ngrok.app";
const apiKey = process.env.SHOPIFY_API_KEY ?? "dev-key";
const apiSecretKey = process.env.SHOPIFY_API_SECRET ?? "dev-secret";
const scopes = process.env.SCOPES?.split(",").map((scope) => scope.trim()).filter(Boolean) ?? [
  "read_products"
];
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2024-07";

export const shopify = shopifyApp({
  apiKey,
  apiSecretKey,
  apiVersion,
  scopes,
  appUrl,
  authPathPrefix: "/auth",
  sessionStorage,
  restResources,
  useOnlineTokens: true,
  billing: billingConfig,
  webhooks: webhookHandlers,
  hooks: {
    afterAuth: async ({ session, admin }) => {
      await prisma.shopInstallation.upsert({
        where: { shopDomain: session.shop },
        update: { accessToken: session.accessToken ?? undefined },
        create: {
          shopDomain: session.shop,
          accessToken: session.accessToken ?? null
        }
      });

      await ensureStorefrontScript(session.shop, admin);
    }
  }
});
