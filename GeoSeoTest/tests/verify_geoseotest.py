#!/usr/bin/env python3
"""Behavioral acceptance checks for the isolated GeoSeoTest subtree."""

from __future__ import annotations

import hashlib
import json
import re
import subprocess
import sys
import xml.etree.ElementTree as ET
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qs, urlparse


HERE = Path(__file__).resolve()
PROJECT = HERE.parents[1]
REPO = PROJECT.parent
BASE_SHA = "80ffdd01c72cfcac00a398a5333d5bbad05030d2"
EXPECTED_TREATMENTS = {"control", "seo", "geo", "seo_geo"}
EXPECTED_INTENTS = {"commercial", "problem", "compatibility"}
OFFICIAL_HOSTS = {"www.elgato.com", "help.elgato.com", "support.microsoft.com", "support.apple.com"}
CTA_TEXT = "View the full product analysis"
DESTINATION = "https://zeror.ca/research/ai-voice-foot-pedal/"
PROTECTED_OBJECTS = {
    "index.html": "bad2b0c86b81f16a52a15220167ad9f327667545",
    "sitemap.xml": "c2e801a526f7a76513bb06aac1b561b16123142c",
    "robots.txt": "f2198d513bf7aab23276bded1b90026c1797316b",
    "llms.txt": "0a101eab9a18ba75225631323106f7c6317d0252",
    "008test": "131f6f11b2f352492eea66c67b4b93d5d51da162",
    "research": "108e140a91eaa15c9b9f5311238d78bb5a52db86",
    "us": "213a48834f52fd8a83d0c515adf086b4ea52ec61",
    "ca": "a285cbdd23ee3f28104f94e0111ae620fb70147d",
}


class PageParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.lang = ""
        self.title_parts: list[str] = []
        self.in_title = False
        self.text_parts: list[str] = []
        self.anchors: list[dict[str, str]] = []
        self.head_links: list[dict[str, str]] = []
        self.metas: list[dict[str, str]] = []
        self.scripts: list[tuple[dict[str, str], str]] = []
        self._script_attrs: dict[str, str] | None = None
        self._script_text: list[str] = []
        self._active_anchor: dict[str, str] | None = None
        self._in_head = False
        self._in_body = False
        self._hidden_stack: list[bool] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = {key: value or "" for key, value in attrs}
        if tag == "html":
            self.lang = data.get("lang", "")
        elif tag == "head":
            self._in_head = True
        elif tag == "body":
            self._in_body = True
        elif tag == "title":
            self.in_title = True
        elif tag == "meta" and self._in_head:
            self.metas.append(data)
        elif tag == "link" and self._in_head:
            self.head_links.append(data)
        elif tag == "a":
            self._active_anchor = {**data, "_text": ""}
            self.anchors.append(self._active_anchor)
        elif tag == "script":
            self._script_attrs = data
            self._script_text = []
        if self._in_body and tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            parent_hidden = self._hidden_stack[-1] if self._hidden_stack else False
            hidden = parent_hidden or tag in {"script", "style", "template"} or "hidden" in data or data.get("aria-hidden", "").lower() == "true"
            self._hidden_stack.append(hidden)

    def handle_endtag(self, tag: str) -> None:
        if tag == "title":
            self.in_title = False
        elif tag == "head":
            self._in_head = False
        elif tag == "body":
            self._in_body = False
        elif tag == "a":
            self._active_anchor = None
        elif tag == "script" and self._script_attrs is not None:
            self.scripts.append((self._script_attrs, "".join(self._script_text)))
            self._script_attrs = None
            self._script_text = []
        if self._hidden_stack and tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
            self._hidden_stack.pop()

    def handle_data(self, data: str) -> None:
        if self.in_title:
            self.title_parts.append(data)
        if self._script_attrs is not None:
            self._script_text.append(data)
        elif self._in_body and not (self._hidden_stack and self._hidden_stack[-1]):
            clean = " ".join(data.split())
            if clean:
                self.text_parts.append(clean)
                if self._active_anchor is not None:
                    self._active_anchor["_text"] += (" " + clean)

    @property
    def title(self) -> str:
        return " ".join("".join(self.title_parts).split())

    @property
    def text(self) -> str:
        return " ".join(self.text_parts)

    def canonical(self) -> str:
        for link in self.head_links:
            rel_tokens = {token.lower() for token in link.get("rel", "").split()}
            if "canonical" in rel_tokens:
                return link.get("href", "")
        return ""

    def robots(self) -> set[str]:
        for meta in self.metas:
            if meta.get("name", "").lower() == "robots":
                return {token for token in re.split(r"[\s,]+", meta.get("content", "").lower()) if token}
        return set()


class Checks:
    def __init__(self) -> None:
        self.count = 0

    def that(self, condition: bool, message: str) -> None:
        if not condition:
            raise AssertionError(message)
        self.count += 1
        print(f"PASS {self.count:03d}: {message}")


def parse_page(path: Path) -> PageParser:
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8"))
    return parser


def git(*args: str) -> str:
    result = subprocess.run(
        ["git", "-C", str(REPO), *args],
        check=True,
        capture_output=True,
        text=True,
        encoding="utf-8",
    )
    return result.stdout.strip()


def js_tokens(source: str) -> list[str]:
    """Tokenize the small analytics module while excluding comments and string bodies."""
    tokens: list[str] = []
    index = 0
    while index < len(source):
        char = source[index]
        if char.isspace():
            index += 1
            continue
        if source.startswith("//", index):
            newline = source.find("\n", index + 2)
            index = len(source) if newline < 0 else newline + 1
            continue
        if source.startswith("/*", index):
            end = source.find("*/", index + 2)
            if end < 0:
                raise AssertionError("analytics contains an unterminated block comment")
            index = end + 2
            continue
        if char in {'"', "'", "`"}:
            quote = char
            index += 1
            value: list[str] = []
            while index < len(source) and source[index] != quote:
                if source[index] == "\\" and index + 1 < len(source):
                    index += 1
                value.append(source[index])
                index += 1
            if index >= len(source):
                raise AssertionError("analytics contains an unterminated string")
            tokens.append("str:" + "".join(value))
            index += 1
            continue
        identifier = re.match(r"[A-Za-z_$][A-Za-z0-9_$]*", source[index:])
        if identifier:
            value = identifier.group(0)
            tokens.append("id:" + value)
            index += len(value)
            continue
        tokens.append(char)
        index += 1
    return tokens


def token_sequence(tokens: list[str], *expected: str) -> int:
    width = len(expected)
    for index in range(len(tokens) - width + 1):
        if tokens[index : index + width] == list(expected):
            return index
    return -1


def matching_token(tokens: list[str], start: int, opening: str = "{", closing: str = "}") -> int:
    if start < 0 or start >= len(tokens) or tokens[start] != opening:
        raise AssertionError(f"expected {opening} token at index {start}")
    depth = 0
    for index in range(start, len(tokens)):
        if tokens[index] == opening:
            depth += 1
        elif tokens[index] == closing:
            depth -= 1
            if depth == 0:
                return index
    raise AssertionError(f"unmatched {opening} token in analytics")


def top_level_object_keys(tokens: list[str], start: int, end: int) -> set[str]:
    keys: set[str] = set()
    depth = 0
    for index in range(start + 1, end):
        token = tokens[index]
        if token in {"{", "[", "("}:
            depth += 1
        elif token in {"}", "]", ")"}:
            depth -= 1
        elif depth == 0 and token.startswith("id:") and index + 1 < end and tokens[index + 1] == ":":
            keys.add(token[3:])
    return keys


def top_level_scalar_fields(tokens: list[str], start: int, end: int) -> dict[str, str]:
    fields: dict[str, str] = {}
    depth = 0
    for index in range(start + 1, end - 1):
        token = tokens[index]
        if token in {"{", "[", "("}:
            depth += 1
        elif token in {"}", "]", ")"}:
            depth -= 1
        elif depth == 0 and token.startswith("id:") and tokens[index + 1] == ":":
            fields[token[3:]] = tokens[index + 2]
    return fields


def verify() -> int:
    checks = Checks()
    manifest_path = PROJECT / "experiment.json"
    if not manifest_path.is_file():
        raise AssertionError("GeoSeoTest/experiment.json is missing")
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    pages = data.get("pages", [])
    raw_sources = data.get("sources", [])
    checks.that(isinstance(raw_sources, list) and bool(raw_sources), "manifest declares expected official sources")
    source_urls: set[str] = set()
    for source in raw_sources:
        source_url = source if isinstance(source, str) else source.get("url") if isinstance(source, dict) else None
        checks.that(isinstance(source_url, str) and bool(source_url), "every manifest source has a URL")
        parsed_source = urlparse(source_url)
        checks.that(parsed_source.scheme == "https" and parsed_source.hostname in OFFICIAL_HOSTS, "every manifest source URL is HTTPS on an approved official host")
        source_urls.add(source_url)
    checks.that(len(source_urls) == len(raw_sources), "manifest source URLs are unique")
    checks.that(data.get("experiment_id") == "geoseotest", "experiment id is fixed")
    checks.that(data.get("batch_id") == "batch01", "batch id is fixed")
    checks.that(data.get("cta_label") == CTA_TEXT, "CTA label is truthful and fixed")
    checks.that(data.get("destination_url") == DESTINATION, "CTA destination is fixed V1 research")
    checks.that(len(pages) == 12, "manifest has exactly 12 experiment pages")

    ids = [page.get("id") for page in pages]
    slugs = [page.get("slug") for page in pages]
    checks.that(len(set(ids)) == 12 and all(re.fullmatch(r"b01-\d{2}", x or "") for x in ids), "page ids are unique b01-NN values")
    checks.that(ids == slugs, "page slugs equal their auditable page ids")
    treatment_counts = Counter(page.get("treatment") for page in pages)
    intent_counts = Counter(page.get("intent") for page in pages)
    checks.that(set(treatment_counts) == EXPECTED_TREATMENTS and set(treatment_counts.values()) == {3}, "four treatments each contain three pages")
    checks.that(set(intent_counts) == EXPECTED_INTENTS and set(intent_counts.values()) == {4}, "three intents each occur four times")
    for treatment in sorted(EXPECTED_TREATMENTS):
        intents = {page.get("intent") for page in pages if page.get("treatment") == treatment}
        checks.that(intents == EXPECTED_INTENTS, f"{treatment} has one page for every intent")
    expected_flags = {
        "control": (False, False),
        "seo": (True, False),
        "geo": (False, True),
        "seo_geo": (True, True),
    }
    for page in pages:
        actual_flags = (page.get("query_optimized"), page.get("citation_optimized"))
        checks.that(actual_flags == expected_flags[page["treatment"]], f"{page['id']} treatment flags match its assigned cell")

    hub_path = PROJECT / "index.html"
    privacy_path = PROJECT / "privacy" / "index.html"
    checks.that(hub_path.is_file(), "hub page exists")
    checks.that(privacy_path.is_file(), "privacy page exists")
    expected_indexable = {"https://zeror.ca/GeoSeoTest/"}
    titles: set[str] = set()
    fingerprints: set[str] = set()

    for page in pages:
        page_id = page["id"]
        path = PROJECT / page_id / "index.html"
        checks.that(path.is_file(), f"{page_id} page exists")
        raw_html = path.read_text(encoding="utf-8")
        parsed = parse_page(path)
        canonical = f"https://zeror.ca/GeoSeoTest/{page_id}/"
        expected_indexable.add(canonical)
        checks.that(parsed.lang.lower().startswith("en"), f"{page_id} declares English language")
        checks.that(parsed.canonical() == canonical, f"{page_id} canonical is self-referential")
        checks.that({"index", "follow"} <= parsed.robots() and not ({"noindex", "nofollow"} & parsed.robots()), f"{page_id} is indexable")
        checks.that(parsed.title and parsed.title not in titles, f"{page_id} title is unique")
        titles.add(parsed.title)
        normalized = re.sub(r"\W+", " ", parsed.text.lower()).strip()
        fingerprint = hashlib.sha256(normalized.encode()).hexdigest()
        checks.that(len(normalized.split()) >= 180 and fingerprint not in fingerprints, f"{page_id} has substantial unique visible copy")
        fingerprints.add(fingerprint)
        checks.that(page_id in parsed.text and page["treatment"] in parsed.text, f"{page_id} exposes page and treatment labels")
        checks.that("receiving app" in parsed.text.lower() and "dictation" in parsed.text.lower(), f"{page_id} states the compatibility boundary")
        official = [link for link in parsed.anchors if link.get("href", "") in source_urls and urlparse(link.get("href", "")).scheme == "https"]
        checks.that(len({link.get("href") for link in official}) >= 2, f"{page_id} cites at least two official sources")
        ctas = [link for link in parsed.anchors if link.get("data-analytics-event") == "recommendation_click"]
        checks.that(len(ctas) == 1, f"{page_id} has one measured recommendation CTA")
        cta = ctas[0]
        checks.that(" ".join(cta.get("_text", "").split()) == CTA_TEXT, f"{page_id} CTA copy is accurate")
        url = urlparse(cta.get("href", ""))
        checks.that(f"{url.scheme}://{url.netloc}{url.path}" == DESTINATION, f"{page_id} CTA points only to V1 research")
        query = parse_qs(url.query)
        checks.that(set(query) == {"gst_batch", "gst_treatment", "gst_page"} and query["gst_batch"] == ["batch01"] and query["gst_treatment"] == [page["treatment"]] and query["gst_page"] == [page_id], f"{page_id} CTA uses only correct gst markers")
        internal_links = [link.get("href", "") for link in parsed.anchors if (not urlparse(link.get("href", "")).netloc or urlparse(link.get("href", "")).netloc == "zeror.ca")]
        checks.that(all("utm_" not in href.lower() for href in internal_links), f"{page_id} internal links contain no UTM parameters")
        json_ld = [body for attrs, body in parsed.scripts if attrs.get("type") == "application/ld+json"]
        checks.that(len(json_ld) == 1, f"{page_id} has one JSON-LD block")
        schema = json.loads(json_ld[0])
        checks.that(schema.get("@context") == "https://schema.org" and schema.get("@type") == "Article", f"{page_id} JSON-LD is a schema.org Article")
        checks.that(schema.get("url") == canonical and schema.get("headline") == page["title"], f"{page_id} JSON-LD matches page identity")
        checks.that(any(link.get("href") == "/GeoSeoTest/assets/styles.css" and "stylesheet" in {token.lower() for token in link.get("rel", "").split()} for link in parsed.head_links), f"{page_id} references shared CSS")
        checks.that(any(attrs.get("src") == "/GeoSeoTest/assets/analytics.js" for attrs, _ in parsed.scripts), f"{page_id} references shared analytics")
        checks.that(raw_html.count("<table") == len(re.findall(r'<div class="table-wrap">\s*<table', raw_html)), f"{page_id} wraps every table in a scroll container")

    hub = parse_page(hub_path)
    checks.that(hub.canonical() == "https://zeror.ca/GeoSeoTest/", "hub canonical is self-referential")
    checks.that({"index", "follow"} <= hub.robots() and not ({"noindex", "nofollow"} & hub.robots()), "hub is indexable")
    hub_html = hub_path.read_text(encoding="utf-8")
    checks.that(hub_html.count("<table") == len(re.findall(r'<div class="table-wrap">\s*<table', hub_html)), "hub wraps every table in a scroll container")
    privacy = parse_page(privacy_path)
    checks.that("noindex" in privacy.robots(), "privacy page is noindex")
    privacy_text = privacy.text.lower()
    checks.that("standard page and device measurements" in privacy_text and "advertising storage" in privacy_text, "privacy notice distinguishes GA4 standard measurement from advertising storage")
    checks.that("recommendation_click" in privacy_text and "custom payload" in privacy_text, "privacy notice limits only the custom experiment event payload")

    sitemap_path = PROJECT / "sitemap.xml"
    checks.that(sitemap_path.is_file(), "child sitemap exists")
    root = ET.parse(sitemap_path).getroot()
    locations = {node.text for node in root.findall("{http://www.sitemaps.org/schemas/sitemap/0.9}url/{http://www.sitemaps.org/schemas/sitemap/0.9}loc")}
    checks.that(locations == expected_indexable, "child sitemap contains exactly hub plus 12 experiment pages")
    checks.that("https://zeror.ca/GeoSeoTest/privacy/" not in locations, "privacy page is excluded from sitemap")

    css = PROJECT / "assets" / "styles.css"
    analytics = PROJECT / "assets" / "analytics.js"
    config = PROJECT / "assets" / "analytics-config.js"
    checks.that(css.is_file() and analytics.is_file() and config.is_file(), "shared CSS and analytics assets exist")
    js = analytics.read_text(encoding="utf-8")
    config_js = config.read_text(encoding="utf-8")
    tokens = js_tokens(js)
    config_tokens = js_tokens(config_js)
    expected_config = ["id:window", ".", "id:GeoSeoAnalyticsConfig", "=", "id:Object", ".", "id:freeze", "(", "{", "id:measurementId", ":", "str:", "}", ")"]
    checks.that(config_tokens in (expected_config, expected_config + [";"]), "production analytics config is exactly one frozen empty measurementId object")
    checks.that("anonymous analytics" not in js.lower() and "anonymous analytics" not in privacy_text, "consent copy does not describe GA4 as anonymous")
    checks.that(re.search(r"measurementIdPattern\s*=\s*/\^G-\[A-Z0-9\]\{10\}\$/", js) is not None, "analytics accepts only a G- prefix plus ten alphanumeric characters")
    consent_position = token_sequence(tokens, "id:gtag", "(", "str:consent", ",", "str:default", ",", "{")
    create_position = token_sequence(tokens, "id:document", ".", "id:createElement", "(", "str:script", ")")
    guard_position = token_sequence(tokens, "id:if", "(", "!", "id:measurementIdPattern", ".", "id:test", "(", "id:measurementId", ")", ")")
    consent_open = consent_position + 6
    consent_close = matching_token(tokens, consent_open) if consent_position >= 0 else -1
    consent_fields = top_level_scalar_fields(tokens, consent_open, consent_close) if consent_position >= 0 else {}
    checks.that(consent_fields.get("analytics_storage") == "str:denied", "analytics explicitly defaults analytics_storage consent to denied")
    checks.that(create_position >= 0, "analytics creates the gtag script explicitly")
    checks.that(guard_position >= 0, "analytics has an explicit invalid measurement-id fail-closed guard")
    checks.that(consent_position < create_position, "default-denied consent code is defined before gtag loading")
    checks.that(guard_position < create_position, "measurement-id validation occurs before script creation")
    event_position = token_sequence(tokens, "id:gtag", "(", "str:event", ",", "str:recommendation_click", ",", "{")
    checks.that(event_position >= 0, "analytics makes an explicit recommendation_click event call")
    event_open = event_position + 6
    event_end = matching_token(tokens, event_open)
    event_keys = top_level_object_keys(tokens, event_open, event_end)
    for field in ("experiment_id", "batch_id", "treatment", "page_id", "destination_path"):
        checks.that(field in event_keys, f"recommendation_click includes exact top-level {field} field")
    checks.that(token_sequence(tokens, ".", "id:preventDefault", "(") < 0, "analytics never blocks native CTA navigation")
    export_position = token_sequence(tokens, "id:window", ".", "id:GeoSeoAnalyticsTest", "=", "id:Object", ".", "id:freeze", "(", "{")
    checks.that(export_position >= 0, "analytics exposes its pure-function test contract")
    export_open = export_position + 8
    export_end = matching_token(tokens, export_open)
    export_body = tokens[export_open:export_end]
    checks.that(all(f"id:{name}" in export_body for name in ("isValidMeasurementId", "buildRecommendationClickParams", "resolveAnalyticsPlan")), "analytics exports all pure contract functions")
    checks.that("id:localStorage" in tokens and any(token.startswith("str:") and "consent" in token.lower() for token in tokens), "analytics persists an explicit consent choice")

    for path, expected in PROTECTED_OBJECTS.items():
        actual = git("rev-parse", f"HEAD:{path}")
        checks.that(actual == expected, f"protected Git object {path} is unchanged")
    changed = [line for line in git("diff", "--name-only", BASE_SHA).splitlines() if line]
    checks.that(all(line.startswith("GeoSeoTest/") for line in changed), "all tracked changes are isolated under GeoSeoTest/")
    status = subprocess.run(
        ["git", "-C", str(REPO), "status", "--porcelain=v1", "-z", "--untracked-files=all"],
        check=True,
        capture_output=True,
    ).stdout.decode("utf-8", errors="surrogateescape").split("\0")
    status_paths: list[str] = []
    index = 0
    while index < len(status):
        record = status[index]
        index += 1
        if not record:
            continue
        code, changed_path = record[:2], record[3:]
        status_paths.append(changed_path)
        if "R" in code or "C" in code:
            status_paths.append(status[index])
            index += 1
    checks.that(all(path.replace("\\", "/").startswith("GeoSeoTest/") for path in status_paths), "all tracked and untracked changes are isolated under GeoSeoTest/")

    print(f"PASS: GeoSeoTest acceptance suite completed ({checks.count} checks).")
    return 0


def main() -> int:
    try:
        return verify()
    except (AssertionError, json.JSONDecodeError, ET.ParseError, subprocess.CalledProcessError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
