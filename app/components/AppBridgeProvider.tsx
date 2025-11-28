import type { PropsWithChildren } from "react";
import { Provider } from "@shopify/app-bridge-react";

type AppBridgeProviderProps = PropsWithChildren<{
  apiKey: string;
  host: string;
}>;

export function AppBridgeProvider({ apiKey, host, children }: AppBridgeProviderProps) {
  if (!apiKey || !host) {
    return <>{children}</>;
  }

  const config = {
    apiKey,
    host,
    forceRedirect: true
  } as const;

  return <Provider config={config}>{children}</Provider>;
}
