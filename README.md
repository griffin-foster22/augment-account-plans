# augment-account-plans

Intent workspace for generating enterprise account plans and a static territory dashboard demo.

## Static dashboard overview

The dashboard is a frontend-only React app served directly from the repository's static files:

- `index.html`
- `app.js`
- `styles.css`
- `data/territory_accounts.json`
- `data/territory_schema.md`
- `outputs/*.md`

There is no npm install or build step today. React and ReactDOM are loaded from the public `unpkg` CDN, and the app fetches the territory JSON plus account-plan markdown files at runtime.

## Local review

Use an HTTP server from the repository root so browser `fetch()` calls can read the JSON and markdown files:

1. Start a static server from the repository root:
   `python3 -m http.server 5173`
2. Open `http://localhost:5173/`.
3. Confirm the dashboard loads summary metrics, the pipeline board, the account table, and account detail content.

Important local note:

- Do **not** open `index.html` with `file://`; the browser will block the dashboard's data fetches.

## Production static artifact expectations

For public hosting, publish the dashboard as one static artifact that preserves the repository-relative layout used by the app.

Required published content:

- `index.html`
- `app.js`
- `styles.css`
- `data/territory_accounts.json`
- `data/territory_schema.md`
- every markdown file referenced by `account_plan_file` in `data/territory_accounts.json` (currently `outputs/*.md`)

Why this matters:

- The dashboard fetches `data/territory_accounts.json` at runtime.
- The detail panel also fetches each referenced markdown plan from `outputs/`.
- If `data/` or `outputs/` is omitted from the published artifact, the dashboard will partially or fully fail in production.

## GitHub Pages deployment behavior

GitHub Pages is the preferred deployment target for this repo because the app is static and the repository is public.

This app is compatible with a GitHub Pages **project site** because all runtime asset paths are resolved relative to `index.html`. For example, if the site is published at:

`https://<owner>.github.io/augment-account-plans/`

then the dashboard will request:

- `https://<owner>.github.io/augment-account-plans/data/territory_accounts.json`
- `https://<owner>.github.io/augment-account-plans/data/territory_schema.md`
- `https://<owner>.github.io/augment-account-plans/outputs/cisco.md` (and the other plan files)

Recommended GitHub Pages setup when you are ready to publish:

1. Configure Pages to publish the repository root of the chosen branch, **or** upload an equivalent static artifact that keeps the same file layout.
2. Do not publish only `index.html`, `app.js`, and `styles.css`; include `data/` and `outputs/` too.
3. After publishing, smoke test the deployed root page, the JSON file URL, and at least one markdown plan URL.

## Blocking issues

No GitHub Pages/static-hosting blocker was identified in the current implementation.

The main deployment requirement is operational rather than code-related: the published static artifact must include both `data/` and `outputs/` alongside the app shell files, and the deployment environment must allow outbound access to the `unpkg` CDN for React and ReactDOM.
