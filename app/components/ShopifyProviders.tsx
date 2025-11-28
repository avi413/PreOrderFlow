import enTranslations from "@shopify/polaris/locales/en.json";
import { AppProvider as PolarisAppProvider } from "@shopify/polaris";
import type { PropsWithChildren } from "react";
import { AppBridgeProvider } from "./AppBridgeProvider";

type ShopifyProvidersProps = PropsWithChildren<{
  apiKey: string;
  host: string;
}>;

export function ShopifyProviders({ apiKey, host, children }: ShopifyProvidersProps) {
  return (
    <PolarisAppProvider i18n={enTranslations}>
      <AppBridgeProvider apiKey={apiKey} host={host}>
        {children}
      </AppBridgeProvider>
    </PolarisAppProvider>
  );
}
