import { loadPublicContent, normalizeMarket } from "./content-client.js";
import {
  renderAnswerGains,
  renderClaims,
  renderContradictions,
  renderHero,
  renderProduct,
  renderSources,
  renderVerdict,
} from "./renderers.js";

const roots = {
  page: document.querySelector("#page"),
  title: document.querySelector("#page-title"),
  summary: document.querySelector("#page-summary"),
  verdict: document.querySelector("#verdict-root"),
  product: document.querySelector("#product-root"),
  claims: document.querySelector("#claims-root"),
  gains: document.querySelector("#gains-root"),
  contradictions: document.querySelector("#contradictions-root"),
  sources: document.querySelector("#sources-root"),
  error: document.querySelector("#error-state"),
  errorMessage: document.querySelector("#error-message"),
};

const marketButtons = [...document.querySelectorAll("[data-market]")];
let requestNumber = 0;

function setActiveMarket(market) {
  marketButtons.forEach((button) => {
    const active = button.dataset.market === market;
    button.setAttribute("aria-pressed", String(active));
    button.disabled = active;
  });
}

function updateLocation(market) {
  const url = new URL(window.location.href);
  if (market === "global") url.searchParams.delete("market");
  else url.searchParams.set("market", market);
  window.history.replaceState({}, "", url);
}

async function showMarket(requestedMarket) {
  const market = normalizeMarket(requestedMarket);
  const currentRequest = ++requestNumber;
  roots.page.classList.add("is-loading");
  roots.error.hidden = true;
  setActiveMarket(market);

  try {
    const { route, product } = await loadPublicContent(market);
    if (currentRequest !== requestNumber) return;
    renderHero(route, roots.title, roots.summary);
    renderVerdict(route, roots.verdict);
    renderProduct(product, market, roots.product);
    renderClaims(route.claims, roots.claims);
    renderAnswerGains(route.answer_gains, roots.gains);
    renderContradictions(route.contradictions, roots.contradictions);
    renderSources(route, roots.sources);
    updateLocation(market);
  } catch (error) {
    if (currentRequest !== requestNumber) return;
    roots.errorMessage.textContent = error instanceof Error ? error.message : "Unknown error";
    roots.error.hidden = false;
  } finally {
    if (currentRequest === requestNumber) roots.page.classList.remove("is-loading");
  }
}

marketButtons.forEach((button) => {
  button.addEventListener("click", () => showMarket(button.dataset.market));
});

const initialMarket = new URL(window.location.href).searchParams.get("market");
showMarket(initialMarket);
