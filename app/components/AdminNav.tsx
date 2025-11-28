import { Navigation } from "@shopify/polaris";
import { useLocation } from "@remix-run/react";

const navItems = [
  { url: "/app", label: "Dashboard" },
  { url: "/app/products", label: "Product Settings" },
  { url: "/app/backinstock", label: "Back in Stock" }
];

export function AdminNav() {
  const location = useLocation();

  return (
    <Navigation location={location.pathname}>
      <Navigation.Section items={navItems} />
    </Navigation>
  );
}
