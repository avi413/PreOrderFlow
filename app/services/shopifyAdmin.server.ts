import type { Session } from "@shopify/shopify-api";
import { shopify } from "./shopify.server";

export async function fetchShopInformation(session: Session) {
  const client = new shopify.api.clients.Graphql({ session });
  const response = await client.query({
    data: `#graphql
      query ShopInfo {
        shop {
          name
          myshopifyDomain
          primaryDomain {
            host
            url
          }
        }
      }
    `
  });

  return response.body?.data?.shop ?? null;
}

export async function fetchProductMetrics(session: Session) {
  const client = new shopify.api.clients.Graphql({ session });
  const response = await client.query({
    data: `#graphql
      query ProductMetrics {
        products(first: 5, sortKey: UPDATED_AT) {
          nodes {
            id
            title
            status
            totalInventory
            updatedAt
          }
        }
      }
    `
  });

  return response.body?.data?.products?.nodes ?? [];
}
