# Audit and fixes

The audit covers the active static website in public/. The superseded root-level HTML, scripts, styles and logo assets were removed during cleanup. Original research inputs remain for provenance and data maintenance. Serve and deploy public/ only.

Rules retrieved 2026-10-27: https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.

## Findings in the previous implementation

Locations below refer to the previous implementation before cleanup; those removed files remain available in Git history.

- index.html:112 — navigation uses onclick buttons. Replaced with normal links so opening in another tab, history and keyboard navigation work naturally.
- page.js:72 — navigation uses an unnecessary timeout and opacity change without reduced-motion support. New navigation uses standard links.
- styles/style.css:174 — transition: all. New styles list specific properties and respect prefers-reduced-motion.
- scripts/PieChart/EduPieChart.js:131 — chart click references undefined info; legend also references undefined centroid at line 304. Replaced pie/legend interaction with correctly derived labeled bars and accessible numeric tables for every survey category.
- scripts/map/population.js:1 — each year duplicates loading and rendering code. A shared renderer now handles every year and measure; switching filters never accumulates SVGs or handlers.
- education.html:26 — browser fetches raw participant CSV data. Only anonymous aggregates are present in public/.
- education.html:40 — fixed 550px SVG is unsuitable for narrow screens. Charts now use responsive viewBox dimensions, with mobile typography and table equivalents.
- assets/Condition.csv:1 — 1,064 rows conflicts with the 1,000 categorized responses. Survey summaries are derived from the five category files; the discrepancy is disclosed.
- data/world_data.csv:1 — the dataset includes an OWID_WRL aggregate. The country atlas excludes it so the coverage count is 195 countries/territories, not 196.
- README.md:1 — previous documentation referenced missing Vite/cf files. Documentation now describes the actual static implementation and optional maintenance checks.

## Replacement behavior

- One labeled native control each for year, country and measure. Filter state is stored in the URL and browser back/forward restores it.
- Fifteen measures include population, sex, selected age groups, seven mental-health categories and suicide rates. Stable legend bounds include every supplied value. The malformed original “14-Oct” age column is deliberately not interpreted as a valid age group.
- World map, selected-country time series, annual table, country table and downloadable CSV use the same selected data.
- Survey topic routes retain all five pressure groups, score summaries and reported contemplation-frequency counts. Overview tables retain demographic summaries. Frequency variants in the original Vietnamese data are normalized without dropping answers.
- Clear loading/failure/retry behavior, visible focus, skip navigation, semantic headings, local fonts and local D3. No third-party network request is needed.
- Hosting root public/ contains no raw participant CSV/XLSX, notebooks, source configuration or credentials. Excluding raw files from hosting does not remove earlier public copies or Git history.

## Verification

Final run: 3 Node tests, 4 Python tests and 6 browser tests passed. Axe reported no violations on the three checked views. Every measure was exercised at 375px, 768px and 1440px.

- Node native tests: missing/zero values, URL defaults, legend coverage against real data.
- Python standard-library tests: country/year joins, anonymous aggregation, source frequency translations, exclusion of the world aggregate.
- Playwright: all content routes, filter/history behavior, downloadable view, mobile bounds and retry after failed fetch.
- Axe: atlas, survey overview and topic views. Link contrast and nested-landmark findings were corrected; no rules were disabled.
- Desktop and mobile screenshots were inspected. Manual review covers layout, reading order and chart labeling; automated accessibility checks are not a full screen-reader audit.
