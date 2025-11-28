import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { Card, DataTable, Layout, Page, Text } from "@shopify/polaris";
import { shopify } from "../services/shopify.server";

type WaitlistLoader = {
  waitlist: string[][];
  message: string;
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  return json<WaitlistLoader>({
    waitlist: [],
    message: "Back in stock workflows will be wired once product logic lands."
  });
};

export default function BackInStockRoute() {
  const data = useLoaderData<typeof loader>();

  return (
    <Page title="Back in stock waitlist">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <Text variant="bodyMd" tone="subdued" as="p">
              {data.message}
            </Text>
          </Card>
        </Layout.Section>
        <Layout.Section>
          <Card title="Preview" sectioned>
            <DataTable
              columnContentTypes={["text", "text", "numeric"]}
              headings={["Customer", "Variant", "Requests"]}
              rows={data.waitlist.length ? data.waitlist : [["—", "No variants yet", "0"]]}
            />
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
