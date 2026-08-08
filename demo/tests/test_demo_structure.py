import json
import re
import subprocess
import unittest
from pathlib import Path

DEMO_ROOT = Path(__file__).resolve().parents[1]
REPOSITORY_ROOT = DEMO_ROOT.parent
REQUIRED_FILES = {
    "README.md",
    "index.html",
    "assets/css/tokens.css",
    "assets/css/base.css",
    "assets/css/components.css",
    "assets/js/content-client.js",
    "assets/js/renderers.js",
    "assets/js/app.js",
    "content/public-content/v1/products/northstar.local-ai-station.json",
    "content/public-content/v1/routes/research/ai-workstation.json",
    "content/public-content/v1/routes/us/ai-workstation.json",
    "content/public-content/v1/routes/ca/ai-workstation.json",
    "tests/test_demo_structure.py",
}
PRIVATE_FIELDS = {
    "private_path",
    "drive_file_id",
    "prompt_text",
    "raw_quote",
    "reviewer_identity",
    "evidence_id",
    "job_id",
}
MARKETS = {
    "global": ("en", "/research/ai-workstation/"),
    "us": ("en-US", "/us/ai-workstation/"),
    "ca": ("en-CA", "/ca/ai-workstation/"),
}


def load_json(relative: str) -> object:
    path = DEMO_ROOT / relative
    if not path.is_file():
        raise AssertionError(f"missing JSON fixture: {relative}")
    return json.loads(path.read_text(encoding="utf-8"))


def all_keys(value: object):
    if isinstance(value, dict):
        for key, nested in value.items():
            yield key
            yield from all_keys(nested)
    elif isinstance(value, list):
        for nested in value:
            yield from all_keys(nested)


class DemoStructureTests(unittest.TestCase):
    def test_required_modules_are_present(self) -> None:
        present = {
            path.relative_to(DEMO_ROOT).as_posix()
            for path in DEMO_ROOT.rglob("*")
            if path.is_file()
        }
        self.assertTrue(REQUIRED_FILES <= present, REQUIRED_FILES - present)

    def test_worktree_changes_are_isolated_to_demo(self) -> None:
        output = subprocess.check_output(
            ["git", "status", "--porcelain"], cwd=REPOSITORY_ROOT, text=True
        )
        changed = [line[3:].replace("\\", "/") for line in output.splitlines()]
        self.assertTrue(all(path == "demo/" or path.startswith("demo/") for path in changed))

    def test_html_is_noindex_and_uses_one_external_module(self) -> None:
        path = DEMO_ROOT / "index.html"
        self.assertTrue(path.is_file(), "missing index.html")
        html = path.read_text(encoding="utf-8")
        self.assertIn('name="robots" content="noindex,nofollow"', html)
        self.assertEqual(html.count('type="module"'), 1)
        self.assertIn('src="./assets/js/app.js"', html)
        self.assertNotIn('type="application/json"', html)

    def test_local_styles_and_scripts_resolve(self) -> None:
        html = (DEMO_ROOT / "index.html").read_text(encoding="utf-8")
        references = re.findall(r'(?:href|src)="(\./[^"]+)"', html)
        self.assertGreaterEqual(len(references), 4)
        for reference in references:
            path = DEMO_ROOT / reference.removeprefix("./")
            self.assertTrue(path.is_file(), f"missing local asset: {reference}")

    def test_javascript_has_no_private_or_vendor_dependency(self) -> None:
        for relative in (
            "assets/js/content-client.js",
            "assets/js/renderers.js",
            "assets/js/app.js",
        ):
            path = DEMO_ROOT / relative
            self.assertTrue(path.is_file(), f"missing {relative}")
            source = path.read_text(encoding="utf-8").casefold()
            for forbidden in ("backend/", "drive", "openai", "affiliate", "g:\\", "api_key"):
                self.assertNotIn(forbidden, source, f"{relative}: {forbidden}")

    def test_market_routes_are_isolated_and_reference_one_product(self) -> None:
        for market, (locale, route_path) in MARKETS.items():
            folder = "research" if market == "global" else market
            document = load_json(
                f"content/public-content/v1/routes/{folder}/ai-workstation.json"
            )
            self.assertEqual(document["market"], market)
            self.assertEqual(document["locale"], locale)
            self.assertEqual(document["path"], route_path)
            self.assertEqual(document["route_key"], f"{market}:best.local-ai-workstation")
            self.assertEqual(document["product_ids"], ["northstar.local-ai-station"])

    def test_public_json_contains_no_private_fields(self) -> None:
        for path in (DEMO_ROOT / "content").rglob("*.json"):
            document = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(PRIVATE_FIELDS & set(all_keys(document)), set(), path)


if __name__ == "__main__":
    unittest.main()
