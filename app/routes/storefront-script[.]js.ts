import type { LoaderFunctionArgs } from "@remix-run/node";

const STOREFRONT_SCRIPT = String.raw`
(() => {
  const scriptEl = document.currentScript;
  const scriptSrc = scriptEl?.src ?? "";
  const baseMatch = scriptSrc.match(/^(.*)\/storefront-script(?:\.js)?/);
  const resolvedBase =
    window.__PREORDER_APP_URL__ ||
    window.__SHOP_APP_URL__ ||
    (baseMatch ? baseMatch[1] : "");

  const deriveOrigin = () => {
    if (resolvedBase) return resolvedBase;
    if (!scriptSrc) {
      return window.location.origin;
    }
    try {
      const url = new URL(scriptSrc);
      url.pathname = "";
      url.search = "";
      url.hash = "";
      return url.origin;
    } catch (_) {
      return window.location.origin;
    }
  };

  const appBase = deriveOrigin().replace(/\/$/, "");
  const shopDomain =
    (window.Shopify && window.Shopify.shop) ||
    window.__SHOP_DOMAIN__ ||
    document.documentElement.getAttribute("data-shop-domain") ||
    "";

  if (!shopDomain || !appBase) {
    console.warn("[preorder] Missing shop domain or app origin; skipping pre-order script");
    return;
  }

  const state = {
    settings: {},
    currentVariant: null,
    buttonNode: null,
    quantityInput: null,
    infoNode: null,
    originalLabel: ""
  };

  const normalizeVariantId = (value) => {
    if (value === undefined || value === null) return null;
    return value.toString();
  };

  const ensureInfoNode = () => {
    if (state.infoNode && document.body.contains(state.infoNode)) {
      return state.infoNode;
    }
    if (!state.buttonNode) return null;
    const note = document.createElement("p");
    note.dataset.preorderMessage = "true";
    note.style.marginTop = "0.5rem";
    note.style.fontWeight = "600";
    state.buttonNode.insertAdjacentElement("afterend", note);
    state.infoNode = note;
    return note;
  };

  const applyQuantityLimit = (setting) => {
    if (!state.quantityInput) return;
    if (setting?.limitQuantity) {
      state.quantityInput.max = String(setting.limitQuantity);
      const currentValue = Number(state.quantityInput.value || setting.limitQuantity);
      if (currentValue > setting.limitQuantity) {
        state.quantityInput.value = String(setting.limitQuantity);
      }
    } else {
      state.quantityInput.removeAttribute("max");
    }
  };

  const renderVariantState = (variantId) => {
    if (!state.buttonNode || !variantId) return;
    if (!state.originalLabel) {
      state.originalLabel = state.buttonNode.textContent?.trim() || "Add to cart";
      state.buttonNode.dataset.preorderOriginal = state.originalLabel;
    }

    const setting = state.settings[variantId];
    const infoNode = ensureInfoNode();

    if (setting && setting.enabled) {
      state.buttonNode.textContent = setting.customText || "Pre-Order Now";
      state.buttonNode.dataset.preorderActive = "true";
      if (infoNode) {
        if (setting.expectedDate) {
          const dateValue = new Date(setting.expectedDate);
          if (!Number.isNaN(dateValue.getTime())) {
            const dateLabel = dateValue.toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric"
            });
            infoNode.textContent = `Expected ship date: \${dateLabel}`;
            infoNode.style.display = "block";
          } else {
            infoNode.textContent = "";
            infoNode.style.display = "none";
          }
        } else {
          infoNode.textContent = "";
          infoNode.style.display = "none";
        }
      }
      applyQuantityLimit(setting);
    } else {
      state.buttonNode.textContent =
        state.buttonNode.dataset.preorderOriginal || state.originalLabel;
      state.buttonNode.dataset.preorderActive = "false";
      if (infoNode) {
        infoNode.textContent = "";
        infoNode.style.display = "none";
      }
      if (state.quantityInput) {
        state.quantityInput.removeAttribute("max");
      }
    }
  };

  const handleVariantChange = (variantId) => {
    if (!variantId || variantId === state.currentVariant) return;
    state.currentVariant = variantId;
    renderVariantState(variantId);
  };

  const resolveForm = () => {
    const form = document.querySelector('form[action*="/cart/add"]');
    if (!form) return null;
    state.buttonNode =
      form.querySelector('button[type="submit"]') || form.querySelector('[type="submit"]');
    state.quantityInput = form.querySelector('input[name="quantity"]');
    return form.querySelector('input[name="id"]');
  };

  const watchVariantInput = (input) => {
    if (!(input instanceof HTMLInputElement)) return;
    const dispatchChange = () => handleVariantChange(normalizeVariantId(input.value));
    input.addEventListener("change", dispatchChange);
    const observer = new MutationObserver(dispatchChange);
    observer.observe(input, { attributes: true, attributeFilter: ["value"] });
    dispatchChange();
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(
        \`\${appBase}/api/preorder/\${encodeURIComponent(shopDomain)}\`,
        {
          credentials: "omit"
        }
      );
      if (!response.ok) {
        return [];
      }
      const payload = await response.json();
      return Array.isArray(payload.records) ? payload.records : [];
    } catch (error) {
      console.warn("[preorder] Failed to load settings", error);
      return [];
    }
  };

  const bootstrap = async () => {
    const records = await fetchSettings();
    state.settings = records.reduce((acc, record) => {
      const variantId = normalizeVariantId(record?.variantId);
      if (variantId && record?.enabled) {
        acc[variantId] = record;
      }
      return acc;
    }, {});

    let attempts = 0;
    const attemptResolve = () => {
      const variantInput = resolveForm();
      if (variantInput) {
        watchVariantInput(variantInput);
        return;
      }
      attempts += 1;
      if (attempts < 300) {
        window.requestAnimationFrame(attemptResolve);
      }
    };

    attemptResolve();
  };

  bootstrap();
})();
`;

export const loader = async (_args: LoaderFunctionArgs) => {
  return new Response(STOREFRONT_SCRIPT, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=300"
    }
  });
};
