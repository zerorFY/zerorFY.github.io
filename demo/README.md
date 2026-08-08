# Zeror Research isolated demo

This directory is a disposable, synthetic preview of the evidence-first page architecture. The live URL is `https://zeror.ca/demo/` after GitHub Pages publishes `main`.

## Boundaries

- The existing site root and routes do not import anything from `demo/`.
- The demo imports no private backend, workspace, Google Drive object, prompt, account or raw evidence.
- All content is fictional and loaded from `content/public-content/v1` JSON.
- Product commerce fields are intentionally disabled: prices and purchase URLs are `null`.
- The page is `noindex,nofollow` and is not a formal SEO route.

## Module ownership

- `index.html`: accessible page shell and mount roots only.
- `assets/css/tokens.css`: replaceable design tokens.
- `assets/css/base.css`: reset, page grid and responsive primitives.
- `assets/css/components.css`: independent visual components.
- `assets/js/content-client.js`: fixed, URL-safe public JSON reads.
- `assets/js/renderers.js`: focused DOM rendering functions.
- `assets/js/app.js`: market state and module composition.
- `content/public-content/v1`: synthetic contract fixtures only.
- `tests/test_demo_structure.py`: isolation, privacy and market checks.

## Local preview

From the public repository root:

```powershell
python -m http.server 4175 --bind 127.0.0.1
```

Open `http://127.0.0.1:4175/demo/`. Market views use `?market=us` and `?market=ca`.

## Validation

```powershell
python -m unittest discover -s demo/tests -p "test_*.py" -v
```

The four JSON fixtures must also pass the private repository's canonical `public-content/v1` JSON Schemas before publication.

## Removal

Delete or revert the `demo/` directory. No formal frontend or backend module depends on it. Do not copy these presentation modules into the production frontend; Plans 15–19 should implement the formal application independently against the same public contract.
