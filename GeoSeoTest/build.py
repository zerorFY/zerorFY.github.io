#!/usr/bin/env python3
"""Build the deterministic, manifest-driven GeoSeoTest Batch01 pages."""

from __future__ import annotations

import json
import re
from html import escape
from pathlib import Path
from typing import Any, Iterable
from urllib.parse import urlencode
from xml.etree import ElementTree as ET


PROJECT = Path(__file__).resolve().parent
MANIFEST = PROJECT / "experiment.json"
SITE_ROOT = "https://zeror.ca/GeoSeoTest/"
ASSET_ROOT = "/GeoSeoTest/assets"
WORD_PATTERN = re.compile(r"[A-Za-z]+(?:['-][A-Za-z]+)*")
BOUNDARY = (
    "The pedal only triggers configured keyboard shortcuts or text actions; "
    "the receiving app and operating system must support a compatible command, "
    "and dictation software—not the pedal—performs speech-to-text."
)
EXPECTED_FLAGS = {
    "control": (False, False),
    "seo": (True, False),
    "geo": (False, True),
    "seo_geo": (True, True),
}
EXPECTED_INTENTS = {"commercial", "problem", "compatibility"}


def e(value: object, *, quote: bool = True) -> str:
    """Escape a value for an HTML text or attribute context."""
    return escape(str(value), quote=quote)


def json_ld(data: dict[str, Any]) -> str:
    """Serialize JSON-LD deterministically and neutralize an HTML script close."""
    return json.dumps(
        data,
        ensure_ascii=True,
        sort_keys=True,
        separators=(",", ":"),
    ).replace("</", "<\\/")


def render_head(
    *,
    title: str,
    description: str,
    canonical: str,
    robots: str,
    schema: dict[str, Any],
) -> str:
    return f"""<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="{e(robots)}">
  <meta name="description" content="{e(description)}">
  <link rel="canonical" href="{e(canonical)}">
  <link rel="stylesheet" href="{ASSET_ROOT}/styles.css">
  <title>{e(title)}</title>
  <script type="application/ld+json">{json_ld(schema)}</script>
  <script src="{ASSET_ROOT}/analytics-config.js"></script>
  <script src="{ASSET_ROOT}/analytics.js" defer></script>
</head>"""


def article_schema(page: dict[str, Any], canonical: str, source_map: dict[str, dict[str, str]]) -> dict[str, Any]:
    schema: dict[str, Any] = {
        "@context": "https://schema.org",
        "@type": "Article",
        "description": page["description"],
        "headline": page["title"],
        "inLanguage": "en",
        "isPartOf": {"@id": SITE_ROOT, "@type": "WebSite", "name": "GeoSeoTest"},
        "mainEntityOfPage": {"@id": canonical, "@type": "WebPage"},
        "url": canonical,
    }
    if page["citation_optimized"]:
        schema["citation"] = [
            {
                "@type": "CreativeWork",
                "name": source_map[source_id]["title"],
                "url": source_map[source_id]["url"],
            }
            for source_id in page["source_ids"]
        ]
        schema["hasPart"] = [
            {
                "@type": "Question",
                "name": faq["question"],
                "acceptedAnswer": {"@type": "Answer", "text": faq["answer"]},
            }
            for faq in page["faqs"]
        ]
    return schema


def render_sources(page: dict[str, Any], source_map: dict[str, dict[str, str]]) -> str:
    links = "\n".join(
        "      <li>"
        f'<a href="{e(source_map[source_id]["url"])}" rel="noopener noreferrer">'
        f'{e(source_map[source_id]["title"])}</a></li>'
        for source_id in page["source_ids"]
    )
    return f"""<section class="sources" aria-labelledby="official-sources">
    <h2 id="official-sources">Official sources used</h2>
    <ul>
{links}
    </ul>
    <p>Sources document product features and platform commands. They do not endorse this independent experiment or guarantee a particular workflow result.</p>
  </section>"""


def render_narrative(page: dict[str, Any]) -> str:
    rendered: list[str] = []
    for section in page["sections"]:
        paragraphs = "\n".join(f"    <p>{e(paragraph)}</p>" for paragraph in section["paragraphs"])
        rendered.append(
            f"""<section>
    <h2>{e(section['heading'])}</h2>
{paragraphs}
  </section>"""
        )
    return "\n".join(rendered)


def render_claims(page: dict[str, Any]) -> str:
    cards = []
    for item in page["claims"]:
        cards.append(
            f"""<article class="claim-card">
      <h3>{e(item['claim'])}</h3>
      <p><strong>Evidence:</strong> {e(item['evidence'])}</p>
      <p><strong>Limit:</strong> {e(item['limit'])}</p>
    </article>"""
        )
    return "\n".join(cards)


def render_table(table: dict[str, Any]) -> str:
    headers = "".join(f"<th scope=\"col\">{e(value)}</th>" for value in table["headers"])
    rows = "\n".join(
        "      <tr>" + "".join(f"<td>{e(value)}</td>" for value in row) + "</tr>"
        for row in table["rows"]
    )
    return f"""<section aria-labelledby="decision-guide">
    <h2 id="decision-guide">Decision guide</h2>
    <div class="table-wrap">
      <table>
        <caption>{e(table['caption'])}</caption>
        <thead><tr>{headers}</tr></thead>
        <tbody>
{rows}
        </tbody>
      </table>
    </div>
  </section>"""


def render_faqs(page: dict[str, Any]) -> str:
    entries = "\n".join(
        f"""<details>
      <summary>{e(item['question'])}</summary>
      <p>{e(item['answer'])}</p>
    </details>"""
        for item in page["faqs"]
    )
    return f"""<section aria-labelledby="frequent-questions">
    <h2 id="frequent-questions">Frequently asked questions</h2>
{entries}
  </section>"""


def render_answer_first(page: dict[str, Any]) -> str:
    return f"""<section class="direct-answer" aria-labelledby="direct-answer-heading">
    <h2 id="direct-answer-heading">Direct answer</h2>
    <p>{e(page['direct_answer'])}</p>
  </section>
  <section aria-labelledby="evidence-and-limits">
    <h2 id="evidence-and-limits">Claims, evidence, and limits</h2>
{render_claims(page)}
  </section>
  {render_table(page['decision_table'])}
  {render_faqs(page)}"""


def render_page(page: dict[str, Any], manifest: dict[str, Any], source_map: dict[str, dict[str, str]]) -> str:
    page_id = page["id"]
    treatment = page["treatment"]
    canonical = f"{SITE_ROOT}{page_id}/"
    cta_url = manifest["destination_url"] + "?" + urlencode(
        (
            ("gst_batch", manifest["batch_id"]),
            ("gst_treatment", treatment),
            ("gst_page", page_id),
        )
    )
    body = render_answer_first(page) if page["citation_optimized"] else render_narrative(page)
    treatment_label = treatment.replace("_", " + ")
    schema = article_schema(page, canonical, source_map)
    head = render_head(
        title=page["title"],
        description=page["description"],
        canonical=canonical,
        robots="index, follow",
        schema=schema,
    )
    return f"""<!doctype html>
<html lang="en">
{head}
<body data-experiment-id="{e(manifest['experiment_id'])}" data-batch-id="{e(manifest['batch_id'])}" data-treatment="{e(treatment)}" data-page-id="{e(page_id)}">
<header class="site-header">
  <nav aria-label="Primary"><a href="/GeoSeoTest/">GeoSeoTest</a><a href="/GeoSeoTest/privacy/">Privacy</a></nav>
</header>
<main>
<article class="experiment-page treatment-{e(treatment)}">
  <header class="article-header">
    <p class="eyebrow">Batch01 exploratory page</p>
    <h1>{e(page['title'])}</h1>
    <p class="lede">{e(page.get('lede', page.get('direct_answer', '')))}</p>
    <dl class="audit-labels">
      <div><dt>Page ID</dt><dd>{e(page_id)}</dd></div>
      <div><dt>Treatment</dt><dd>{e(treatment)}</dd></div>
      <div><dt>Intent</dt><dd>{e(page['intent'])}</dd></div>
    </dl>
    <p class="research-question"><strong>Long-tail question:</strong> {e(page['query'])}</p>
  </header>
  {body}
  <aside class="compatibility-boundary" aria-label="Compatibility boundary">
    <p><strong>Compatibility boundary:</strong> {e(BOUNDARY)}</p>
  </aside>
  {render_sources(page, source_map)}
  <section class="next-step" aria-labelledby="next-step-heading">
    <h2 id="next-step-heading">Continue the independent review</h2>
    <p>This experimental page is informational and is not a store listing, an affiliate claim, or a guarantee of compatibility.</p>
    <a class="primary-cta" href="{e(cta_url)}" data-analytics-event="recommendation_click" data-experiment-id="{e(manifest['experiment_id'])}" data-batch-id="{e(manifest['batch_id'])}" data-treatment="{e(treatment)}" data-page-id="{e(page_id)}" data-destination-path="/research/ai-voice-foot-pedal/">{e(manifest['cta_label'])}</a>
  </section>
</article>
</main>
<footer><p>GeoSeoTest · Page {e(page_id)} · Treatment {e(treatment_label)}</p></footer>
</body>
</html>"""


def render_hub(manifest: dict[str, Any]) -> str:
    canonical = SITE_ROOT
    cards = "\n".join(
        f"""<li>
      <a href="/GeoSeoTest/{e(page['id'])}/">{e(page['title'])}</a>
      <span>Page {e(page['id'])} · Treatment {e(page['treatment'])} · Intent {e(page['intent'])}</span>
      <p>{e(page['query'])}</p>
    </li>"""
        for page in manifest["pages"]
    )
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "description": "An exploratory 2x2 comparison of query and citation optimization across twelve English pages.",
        "headline": "GeoSeoTest Batch01",
        "inLanguage": "en",
        "url": canonical,
    }
    head = render_head(
        title="GeoSeoTest Batch01: Exploratory 2x2 Content Study",
        description="Explore twelve pages in a 2x2 study of query optimization and citation optimization.",
        canonical=canonical,
        robots="index, follow",
        schema=schema,
    )
    return f"""<!doctype html>
<html lang="en">
{head}
<body>
<header class="site-header"><nav aria-label="Primary"><a href="/GeoSeoTest/">GeoSeoTest</a><a href="/GeoSeoTest/privacy/">Privacy</a></nav></header>
<main>
<article class="hub-page">
  <header>
    <p class="eyebrow">Batch01</p>
    <h1>Exploratory SEO × GEO content study</h1>
    <p>This is a non-sales research hub for an exploratory 2x2 content study. It compares query optimization off or on with citation optimization off or on across twelve English pages. The four treatments are control, SEO, GEO, and SEO + GEO; each treatment covers commercial, problem, and compatibility intent.</p>
    <p>No page in this batch claims to sell a product, receive a commission, provide universal compatibility, or add built-in AI to a foot controller. Page labels and treatment assignments are visible so the comparison can be audited.</p>
  </header>
  <section aria-labelledby="experiment-matrix">
    <h2 id="experiment-matrix">The 2x2 experiment</h2>
    <div class="table-wrap">
    <table>
      <caption>Query optimization and citation optimization cells</caption>
      <thead><tr><th scope="col">Treatment</th><th scope="col">Query optimized</th><th scope="col">Citation optimized</th><th scope="col">Pages</th></tr></thead>
      <tbody>
        <tr><td>control</td><td>No</td><td>No</td><td>3</td></tr>
        <tr><td>seo</td><td>Yes</td><td>No</td><td>3</td></tr>
        <tr><td>geo</td><td>No</td><td>Yes</td><td>3</td></tr>
        <tr><td>seo_geo</td><td>Yes</td><td>Yes</td><td>3</td></tr>
      </tbody>
    </table>
    </div>
  </section>
  <section aria-labelledby="batch-pages">
    <h2 id="batch-pages">All twelve Batch01 pages</h2>
    <ol class="page-grid">
{cards}
    </ol>
  </section>
</article>
</main>
<footer><p>GeoSeoTest Batch01 · Independent exploratory content study</p></footer>
</body>
</html>"""


def render_privacy(manifest: dict[str, Any]) -> str:
    canonical = f"{SITE_ROOT}privacy/"
    schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        "description": "Privacy and consent behavior for the GeoSeoTest exploratory study.",
        "headline": "GeoSeoTest Privacy and Measurement",
        "inLanguage": "en",
        "url": canonical,
    }
    head = render_head(
        title="Privacy and Measurement | GeoSeoTest",
        description="How optional, consent-based recommendation click measurement works in GeoSeoTest.",
        canonical=canonical,
        robots="noindex, follow",
        schema=schema,
    )
    return f"""<!doctype html>
<html lang="en">
{head}
<body>
<header class="site-header"><nav aria-label="Primary"><a href="/GeoSeoTest/">GeoSeoTest</a><a href="/GeoSeoTest/privacy/" aria-current="page">Privacy</a></nav></header>
<main>
<article class="privacy-page">
  <header><p class="eyebrow">GeoSeoTest</p><h1>Privacy and measurement</h1></header>
  <section>
    <h2>Analysis is off by default</h2>
    <p>Analytics storage is denied by default. Measurement remains disabled unless a visitor makes an explicit consent choice. Declining consent leaves analysis off, and an absent or invalid measurement identifier must fail closed without loading the remote analytics library.</p>
  </section>
  <section>
    <h2>Standard measurement and one custom experiment event</h2>
    <p>If consent is granted and measurement is validly configured, Google Analytics may collect its standard page and device measurements under Google's policies. Advertising storage, ad user data, and ad personalization remain denied by this site.</p>
    <p>GeoSeoTest adds one custom experiment event: <code>recommendation_click</code>. Its custom payload is limited to these five fields: <code>experiment_id</code>, <code>batch_id</code>, <code>treatment</code>, <code>page_id</code>, and <code>destination_path</code>.</p>
    <p>The custom experiment event does not add prompt text, dictated text, names, email addresses, form contents, or the destination query string. The native link still works when analysis is off.</p>
  </section>
  <section>
    <h2>Consent choice</h2>
    <p>An explicit allow or decline choice may be stored locally in the browser so the site can honor that choice on later pages. Clearing site data removes the locally stored choice. This Batch01 hub is an exploratory content study, not a sales page.</p>
  </section>
  <p><a href="/GeoSeoTest/">Return to the GeoSeoTest Batch01 hub</a></p>
</article>
</main>
<footer><p>GeoSeoTest privacy notice · Batch {e(manifest['batch_id'])}</p></footer>
</body>
</html>"""


def iter_strings(value: Any) -> Iterable[str]:
    if isinstance(value, str):
        yield value
    elif isinstance(value, dict):
        for child in value.values():
            yield from iter_strings(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_strings(child)


def validate_manifest(manifest: dict[str, Any]) -> dict[str, dict[str, str]]:
    if manifest.get("experiment_id") != "geoseotest" or manifest.get("batch_id") != "batch01":
        raise ValueError("Manifest must identify geoseotest Batch01")
    pages = manifest.get("pages")
    if not isinstance(pages, list) or len(pages) != 12:
        raise ValueError("Manifest must contain exactly 12 pages")
    sources = manifest.get("sources")
    if not isinstance(sources, list) or not sources:
        raise ValueError("Manifest must declare official sources")
    source_map = {source["id"]: source for source in sources}
    if len(source_map) != len(sources):
        raise ValueError("Manifest source ids must be unique")

    ids: set[str] = set()
    titles: set[str] = set()
    queries: set[str] = set()
    cells: dict[str, set[str]] = {treatment: set() for treatment in EXPECTED_FLAGS}
    for page in pages:
        page_id = page.get("id", "")
        if not re.fullmatch(r"b01-\d{2}", page_id) or page.get("slug") != page_id or page_id in ids:
            raise ValueError(f"Invalid or duplicate page identity: {page_id!r}")
        ids.add(page_id)
        treatment = page.get("treatment")
        if treatment not in EXPECTED_FLAGS:
            raise ValueError(f"Unknown treatment on {page_id}")
        flags = (page.get("query_optimized"), page.get("citation_optimized"))
        if flags != EXPECTED_FLAGS[treatment]:
            raise ValueError(f"Treatment flags do not match {page_id}")
        intent = page.get("intent")
        if intent not in EXPECTED_INTENTS or intent in cells[treatment]:
            raise ValueError(f"Intent cell is invalid or duplicated on {page_id}")
        cells[treatment].add(intent)
        if page.get("title") in titles or page.get("query") in queries:
            raise ValueError(f"Title and long-tail question must be unique on {page_id}")
        titles.add(page["title"])
        queries.add(page["query"])
        if len(WORD_PATTERN.findall(" ".join(iter_strings(page)))) < 230:
            raise ValueError(f"{page_id} needs at least 230 English content words")
        if len(set(page.get("source_ids", []))) < 2:
            raise ValueError(f"{page_id} needs at least two distinct official sources")
        if any(source_id not in source_map for source_id in page["source_ids"]):
            raise ValueError(f"{page_id} references an unknown source")
        if page["citation_optimized"]:
            for key in ("direct_answer", "claims", "decision_table", "faqs"):
                if not page.get(key):
                    raise ValueError(f"{page_id} citation treatment is missing {key}")
        elif "faqs" in page or "decision_table" in page:
            raise ValueError(f"{page_id} narrative treatment must not contain FAQ or decision-table content")
    if any(intents != EXPECTED_INTENTS for intents in cells.values()):
        raise ValueError("Each treatment must include every intent exactly once")
    return source_map


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8", newline="\n")


def write_sitemap(pages: list[dict[str, Any]]) -> None:
    namespace = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", namespace)
    root = ET.Element(f"{{{namespace}}}urlset")
    locations = [SITE_ROOT, *(f"{SITE_ROOT}{page['id']}/" for page in pages)]
    for location in locations:
        url = ET.SubElement(root, f"{{{namespace}}}url")
        ET.SubElement(url, f"{{{namespace}}}loc").text = location
    tree = ET.ElementTree(root)
    ET.indent(tree, space="  ")
    tree.write(PROJECT / "sitemap.xml", encoding="utf-8", xml_declaration=True)


def main() -> int:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_map = validate_manifest(manifest)
    write_text(PROJECT / "index.html", render_hub(manifest))
    for page in manifest["pages"]:
        write_text(PROJECT / page["id"] / "index.html", render_page(page, manifest, source_map))
    write_text(PROJECT / "privacy" / "index.html", render_privacy(manifest))
    write_sitemap(manifest["pages"])
    print("Built GeoSeoTest Batch01: 1 hub, 12 experiment pages, 1 privacy page, and 1 sitemap.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
