import type { BillingConfig } from "@shopify/shopify-app-remix/server";

// Billing boilerplate placeholder. Add plan definitions to `plans` when ready.
export const billingConfig: BillingConfig | undefined = undefined;

export async function ensureBilling() {
  // TODO: Implement billing checks when pricing plans become available.
  return { hasActivePayment: false } as const;
}
