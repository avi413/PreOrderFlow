import type { PreOrderSetting } from "@prisma/client";
import { prisma } from "./prisma.server";

export type PreOrderUpsertInput = {
  id?: string;
  shopDomain: string;
  productId: string;
  variantId: string;
  enabled: boolean;
  expectedDate?: string | null;
  limitQuantity?: number | null;
  customText?: string | null;
};

function coerceDate(value?: string | null) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function coerceQuantity(value?: number | null) {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
}

export async function getPreOrders(shopDomain: string) {
  const normalizedDomain = shopDomain.trim().toLowerCase();
  return prisma.preOrderSetting.findMany({
    where: { shopDomain: normalizedDomain },
    orderBy: { createdAt: "desc" }
  });
}

function coerceId(value: string) {
  return value?.toString().trim();
}

export async function savePreOrder(input: PreOrderUpsertInput | PreOrderUpsertInput[]) {
  const records = Array.isArray(input) ? input : [input];

  const normalized = records.map((record) => {
    const shopDomain = record.shopDomain.trim().toLowerCase();
    const productId = coerceId(record.productId);
    const variantId = coerceId(record.variantId);

    if (!productId || !variantId) {
      throw new Error("Missing productId or variantId");
    }

    return {
      ...record,
      shopDomain,
      productId,
      variantId,
      expectedDate: coerceDate(record.expectedDate ?? null),
      limitQuantity: coerceQuantity(record.limitQuantity ?? null),
      customText: record.customText?.trim() || null
    } satisfies Omit<PreOrderUpsertInput, "expectedDate" | "limitQuantity"> & {
      expectedDate: Date | null;
      limitQuantity: number | null;
    };
  });

  const mutations = normalized.map(async (record) => {
    const { id, shopDomain, variantId, productId, ...rest } = record;
    const where = id
      ? { id }
      : {
          shopDomain_variantId: {
            shopDomain,
            variantId
          }
        };

    const createData: Parameters<typeof prisma.preOrderSetting.upsert>[0]["create"] = {
      shopDomain,
      productId,
      variantId,
      ...rest
    };

    if (id) {
      createData.id = id;
    }

    return prisma.preOrderSetting.upsert({
      where,
      update: { shopDomain, productId, variantId, ...rest },
      create: createData
    });
  });

  return Promise.all(mutations);
}

export async function deletePreOrder(id: string): Promise<PreOrderSetting> {
  return prisma.preOrderSetting.delete({ where: { id } });
}
