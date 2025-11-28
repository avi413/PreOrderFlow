import type { WebhookHandlersParam } from "@shopify/shopify-app-remix/server";
import { DeliveryMethod } from "@shopify/shopify-api";
import { prisma } from "../services/prisma.server";

export const webhookHandlers: WebhookHandlersParam = {
  APP_UNINSTALLED: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (_topic, shopDomain) => {
      await prisma.shopInstallation.updateMany({
        where: { shopDomain },
        data: { isActive: false }
      });
    }
  }
};
