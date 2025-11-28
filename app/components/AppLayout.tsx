import type { PropsWithChildren } from "react";
import { Frame, TopBar } from "@shopify/polaris";
import { AdminNav } from "./AdminNav";

export type AppLayoutProps = PropsWithChildren<object>;

export function AppLayout({ children }: AppLayoutProps) {
  const topBarMarkup = <TopBar showNavigationToggle />;

  return (
    <Frame topBar={topBarMarkup} navigation={<AdminNav />}>
      {children}
    </Frame>
  );
}
