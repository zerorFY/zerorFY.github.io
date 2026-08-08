const ROUTE_PATHS = Object.freeze({
  global: "../../content/public-content/v1/routes/research/ai-workstation.json",
  us: "../../content/public-content/v1/routes/us/ai-workstation.json",
  ca: "../../content/public-content/v1/routes/ca/ai-workstation.json",
});

const PRODUCT_ROOT = "../../content/public-content/v1/products/";
const PRODUCT_ID = /^[a-z0-9][a-z0-9._-]{2,127}$/;

export function normalizeMarket(value) {
  return Object.hasOwn(ROUTE_PATHS, value) ? value : "global";
}

async function readJson(relativePath) {
  const url = new URL(relativePath, import.meta.url);
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) {
    throw new Error(`Content request failed (${response.status})`);
  }
  return response.json();
}

function assertPublicDocument(document, type) {
  if (document?.schema_version !== "v1" || document?.document_type !== type) {
    throw new Error(`Unexpected ${type} contract`);
  }
  return document;
}

export async function loadPublicContent(requestedMarket) {
  const market = normalizeMarket(requestedMarket);
  const route = assertPublicDocument(await readJson(ROUTE_PATHS[market]), "route-document");
  const productId = route.product_ids?.[0];
  if (!PRODUCT_ID.test(productId)) {
    throw new Error("Route has no safe product reference");
  }
  const product = assertPublicDocument(
    await readJson(`${PRODUCT_ROOT}${productId}.json`),
    "product-document",
  );
  if (product.product_id !== productId) {
    throw new Error("Product identity does not match route reference");
  }
  return { market, product, route };
}
