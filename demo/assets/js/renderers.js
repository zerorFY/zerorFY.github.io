function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function replace(root, ...children) {
  root.replaceChildren(...children);
}

function titleCase(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function renderHero(route, titleRoot, summaryRoot) {
  titleRoot.textContent = route.title;
  summaryRoot.textContent = route.summary;
  document.title = `${route.title} — Zeror Research preview`;
  document.documentElement.lang = route.locale;
}

export function renderVerdict(route, root) {
  const decision = route.answer_gains.find((gain) => gain.gain_type === "decision_rule");
  const label = element("span", "rail-card__label", "Decision shortcut");
  const heading = element("h3", "", "Add local AI for control, not for every task.");
  const copy = element("p", "", decision?.text ?? route.summary);
  replace(root, label, heading, copy);
}

export function renderProduct(product, market, root) {
  const offer = product.offers.find((candidate) => candidate.market === market);
  const marketName = market === "global" ? "Global research" : market.toUpperCase();
  const commercialState = offer ? "Not connected" : "No market overlay";
  const meta = element("dl", "product-meta");

  for (const [label, value] of [
    ["Brand", product.brand],
    ["Model", product.model],
    ["Market", marketName],
    ["Price & availability", commercialState],
  ]) {
    const row = element("div");
    row.append(element("dt", "", label), element("dd", "", value));
    meta.append(row);
  }

  replace(
    root,
    element("span", "rail-card__label", "Product fixture"),
    element("h3", "", product.title),
    element("p", "", product.summary),
    meta,
    element("span", "status-pill", "Synthetic · no commerce"),
  );
}

export function renderClaims(claims, root) {
  const rows = claims.map((claim, index) => {
    const row = element("article", "claim-row");
    const badge = element(
      "span",
      `confidence confidence--${claim.confidence}`,
      claim.confidence,
    );
    row.append(
      element("span", "claim-row__number", String(index + 1).padStart(2, "0")),
      element("p", "", claim.text),
      badge,
    );
    return row;
  });
  replace(root, ...rows);
}

export function renderAnswerGains(gains, root) {
  const cards = gains.map((gain) => {
    const card = element("article", "gain-card");
    card.append(
      element("span", "gain-card__type", titleCase(gain.gain_type)),
      element("p", "", gain.text),
    );
    return card;
  });
  replace(root, ...cards);
}

export function renderContradictions(contradictions, root) {
  const rows = contradictions.map((contradiction) => {
    const row = element("article", "contradiction-row");
    row.append(
      element("span", "contradiction-row__type", contradiction.contradiction_type),
      element("p", "", contradiction.explanation),
    );
    return row;
  });
  replace(root, ...rows);
}

export function renderSources(route, root) {
  const list = element("ol", "source-list");
  route.citations.forEach((citation, index) => {
    const item = element("li");
    const link = element("a", "source-link");
    link.href = citation.url;
    link.target = "_blank";
    link.rel = "noreferrer noopener";
    const copy = element("span");
    copy.append(
      element("strong", "", citation.title),
      element("span", "", `${citation.source_name} · observed ${citation.observed_at.slice(0, 10)}`),
    );
    link.append(
      element("span", "source-link__index", String(index + 1).padStart(2, "0")),
      copy,
      element("span", "source-link__arrow", "↗"),
    );
    item.append(link);
    list.append(item);
  });
  replace(root, list, element("p", "disclosure", route.disclosure));
}
