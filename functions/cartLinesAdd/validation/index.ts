type CartLine = {
  merchandiseId: string;
  quantity: number;
};

export type CartLinesAddValidationInput = {
  shopDomain: string;
  cartLines: CartLine[];
};

export type CartLinesAddValidationResult = {
  allowed: boolean;
  messages: string[];
};

/**
 * Placeholder for a Shopify Function that will validate cart line additions
 * against Pre-Order constraints. This is not yet wired to the Shopify CLI.
 */
export function runPreOrderCartLinesValidation(
  _input: CartLinesAddValidationInput
): CartLinesAddValidationResult {
  return {
    allowed: true,
    messages: []
  };
}
