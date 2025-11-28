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

export async function fetchProductVariants(
  session: Session,
  productLimit = 20,
  variantLimit = 50
) {
  const client = new shopify.api.clients.Graphql({ session });
  const response = await client.query({
    data: `#graphql
      query PreOrderProducts($productLimit: Int!, $variantLimit: Int!) {
        products(first: $productLimit, sortKey: UPDATED_AT) {
          nodes {
            id
            title
            handle
            featuredImage {
              url
            }
            variants(first: $variantLimit) {
              nodes {
                id
                title
                sku
                availableForSale
                inventoryQuantity
              }
            }
          }
        }
      }
    `,
    variables: {
      productLimit,
      variantLimit
    }
  });

  return response.body?.data?.products?.nodes ?? [];
}
