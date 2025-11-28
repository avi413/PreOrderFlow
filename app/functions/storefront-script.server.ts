import type { AdminApiContext } from "@shopify/shopify-app-remix/server";

const STOREFRONT_SCRIPT_PATH = "/storefront-script.js";

export async function ensureStorefrontScript(shopDomain: string, admin: AdminApiContext) {
  if (!admin) return;

  const appUrl = process.env.SHOPIFY_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    console.warn(
      "[preorder] SHOPIFY_APP_URL is not configured. Storefront script cannot be registered."
    );
    return;
  }

  const scriptUrl = `${appUrl}${STOREFRONT_SCRIPT_PATH}`;

  try {
    const response = await admin.graphql(
      `#graphql
        mutation UpsertPreOrderScript($input: ScriptTagInput!) {
          scriptTagUpsert(scriptTag: $input) {
            scriptTag {
              id
              src
              displayScope
            }
            userErrors {
              field
              message
            }
          }
        }
      `,
      {
        variables: {
          input: {
            src: scriptUrl,
            displayScope: "ONLINE_STORE"
          }
        }
      }
    );

    const userErrors = response?.body?.data?.scriptTagUpsert?.userErrors ?? [];

    if (userErrors.length) {
      console.warn("[preorder] Unable to register storefront script", {
        shopDomain,
        userErrors
      });
    } else {
      console.info("[preorder] Storefront script ensured", {
        shopDomain,
        scriptUrl
      });
    }
  } catch (error) {
    console.error("[preorder] Failed to ensure storefront script", {
      shopDomain,
      error
    });
  }
}
