import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { Card, Layout, Page, Text, BlockStack, TextField, Checkbox, Button } from "@shopify/polaris";
import { shopify } from "../services/shopify.server";

type ProductSettings = {
  presets: {
    defaultTag: string;
    autoPublish: boolean;
  };
};

type ProductAction = {
  saved: boolean;
  payload: {
    defaultTag: string;
    autoPublish: boolean;
  };
};

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await shopify.authenticate.admin(request);
  return json<ProductSettings>({ presets: { defaultTag: "waitlist", autoPublish: true } });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await shopify.authenticate.admin(request);
  const formData = await request.formData();
  const payload = {
    defaultTag: formData.get("defaultTag")?.toString() ?? "",
    autoPublish: formData.get("autoPublish") === "on"
  };

  // TODO: Persist product preferences via Prisma.
  return json<ProductAction>({ saved: true, payload });
};

export default function ProductsRoute() {
  const data = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Page title="Product settings">
      <Layout>
        <Layout.Section>
          <Card sectioned>
            <BlockStack gap="400">
              <Text as="h2" variant="headingLg">
                Product tagging defaults
              </Text>
              <form method="post">
                <BlockStack gap="200">
                  <TextField
                    name="defaultTag"
                    label="Default waitlist tag"
                    defaultValue={actionData?.payload?.defaultTag ?? data.presets.defaultTag}
                    autoComplete="off"
                  />
                  <Checkbox
                    name="autoPublish"
                    label="Publish newly tagged products automatically"
                    defaultChecked={actionData?.payload?.autoPublish ?? data.presets.autoPublish}
                  />
                  <Button submit variant="primary">
                    Save settings
                  </Button>
                  {actionData?.saved && <Text tone="success">Saved!</Text>}
                </BlockStack>
              </form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
