# Our World in Depression

A plain HTML/CSS/JavaScript atlas of historical mental-health estimates and anonymous student survey summaries. Originally created for the Data Science and Data Visualization course at International University – VNUHCM, by Tramcam Team.

The active website lives in **public/**. It needs no framework, bundler, npm install, Cloudflare CLI or build step. D3 7.9.0 and Source Sans 3 are included locally, with their licenses.

## Run locally

From this repository:

```sh
python3 -m http.server 8080 --directory public
```

Open [localhost:8080](http://localhost:8080). VS Code Live Server also works: open public/index.html. Use HTTP rather than opening the HTML as file://, because the charts fetch local JSON.

## Explore

- **Global atlas**: 195 countries/territories across 1990–2017, with a choropleth map, country trends, tables, URL-backed filters and CSV download. The World aggregate is excluded from country comparisons.
- **Vietnam**: historical measures focused on Vietnam.
- **Survey overview**: 1,000 categorized responses, primary pressure groups and recorded demographic summaries.
- **Survey topics**: academic pressure, family, relationships, self-image and work; score categories and reported frequency of thoughts of suicide, with counts and percentages.

Historical estimates and survey labels are educational data, not current statistics or clinical diagnoses. Sampling methods and complete historical source provenance are not documented. The website explains these limitations next to the charts.

## Structure

```text
public/                 Website: deploy only this directory
  *.html                Nine content pages and a custom 404
  scripts/app.js        Shared UI and D3 chart rendering
  scripts/data.mjs      Measures, missing-value handling and URL state
  styles/style.css      Responsive design and local font declarations
  data/                 Historical country JSON, map, anonymous survey counts
  vendor/               Local D3 and license
  fonts/                Source Sans 3 and license
  _headers              Security headers for compatible static hosts

tooling/prepare_data.py Optional data-maintenance tool (Python standard library)
tests/                  Data and browser regression checks
docs/                   Audit, design direction and deployment guide
```

The superseded root-level HTML, JavaScript, CSS and logo assets have been removed. Research CSV/XLSX files and the cleaning notebook remain outside public/ for provenance and data maintenance; do not include them in hosting uploads. The existing wrangler.jsonc points deployments at public/.

## Update the datasets (optional)

Only run this if research inputs change:

```sh
python3 tooling/prepare_data.py
```

It joins country files by code and year, removes the World aggregate from country comparisons, and regenerates the checked-in public/data/ files. Survey outputs contain category counts only; participant names, dates of birth and individual answers are excluded. Condition.csv is excluded because its 1,064 rows conflict with the 1,000 categorized responses.

## Verification (optional, for maintainers)

The website does not need these development tools.

```sh
node --test tests/data.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

For browser and accessibility checks, install the test tools locally without a manifest or lockfile:

```sh
npm install --no-save --package-lock=false @playwright/test@1.64.1 @axe-core/playwright@4.11.0
npx playwright install chromium
npx playwright test -c tests/browser/playwright.config.mjs
```

Alternatively, use installed Google Chrome with `PLAYWRIGHT_CHANNEL=chrome` before the final command. The browser suite starts a Python static server automatically.

## Deploy

Upload **public/** to a static host. See [the deployment guide](docs/DEPLOY.md) for Git-push Workers Builds settings with an empty build command and an assets-only dashboard deployment. The existing wrangler.jsonc configures the hosting upload; the website itself still runs as static files without npm dependencies.

See [the audit](docs/AUDIT.md) and [design direction](docs/DESIGN.md) for implementation decisions and verification scope.

## Team

| Name                | Student ID  | GitHub                                          |
| ------------------- | ----------- | ----------------------------------------------- |
| Nguyen Quang Dieu   | ITDSIU20031 | [itzmealvin](https://github.com/itzmealvin)     |
| Nguyen Hoang Anh Tu | ITDSIU20090 | [nghganhtu](https://github.com/nghganhtu)       |
| Bui Thi Cam Van     | ITITIU20111 | [BUITHICAMVAN](https://github.com/BUITHICAMVAN) |
| Tran Dinh An        | ITDSIU20113 | [trndnhan](https://github.com/trndnhan)         |
| Dang Nhat Huy       | ITITIU20043 | [Nhathuy1305](https://github.com/Nhathuy1305)   |

[MIT license](LICENSE).
