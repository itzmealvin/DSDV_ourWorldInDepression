import { metrics, metricValue, resolveState } from "./data.mjs";
const d3 = window.d3;
const app = document.querySelector("#app");
const status = document.querySelector("#status");
const route =
  location.pathname
    .split("/")
    .pop()
    .replace(/\.html$/, "") || "index";
const topics = {
  education: "Academic pressure",
  family: "Family",
  love: "Relationships",
  self: "Self-image",
  work: "Work",
};
const isSurvey =
  route === "intro" || route === "depress" || Object.hasOwn(topics, route);
const isVietnam = route === "vietnam";
const fmt = (value, digits = 2) =>
  value == null
    ? "No data"
    : new Intl.NumberFormat("en", {
        maximumFractionDigits: digits,
        minimumFractionDigits: digits,
      }).format(value);
const count = (value) => new Intl.NumberFormat("en").format(value);
const escape = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const options = (entries) =>
  entries
    .map(
      ([value, label]) =>
        `<option value="${escape(value)}">${escape(label)}</option>`,
    )
    .join("");
const unitValue = (row, key) =>
  fmt(metricValue(row, key), key === "population" ? 0 : 2);
let rows, geography, survey, demographics, state, years, countries;
let loading = false;

function sources() {
  return `<section class="sources" id="sources" aria-labelledby="sources-heading"><div><span class="section-mark" aria-hidden="true">i</span><h2 id="sources-heading">Read the data with context.</h2><p>Every chart is a starting point for a question. Historical country estimates and a local student survey describe different populations.</p></div><div><h3>Country estimates · 1990–2017</h3><p>These charts use the CSV files supplied with the original course project. Depression uses the age-standardized prevalence field. Age and sex measures use their own series. Suicide rates are deaths per 100,000 people; population is a count.</p><p>Complete source versions, uncertainty intervals and methodology were not retained in the repository. Treat these as an educational historical dataset, rather than current national statistics. Geographic boundaries are illustrative. Missing values remain missing.</p><h3>Student survey · 1,000 categorized responses</h3><p>The five category files total 1,000 responses. Sampling dates, recruitment methods and diagnostic validation are not documented. The results describe this sample, cannot establish causes, and do not represent Vietnam. Score categories retain the original survey labels and are not diagnoses.</p><p>The separate Condition.csv has 1,064 rows and is excluded to avoid mixing incompatible totals. Only anonymous group counts are served by this website. <a href="https://github.com/itzmealvin/DSDV_ourWorldInDepression">Inspect the project and source history</a>.</p></div></section>`;
}
function chartTable(headers, data, caption) {
  return `<div class="table-scroll" tabindex="0" role="region" aria-label="${escape(caption)}"><table><caption>${escape(caption)}</caption><thead><tr>${headers.map((h) => `<th scope="col">${escape(h)}</th>`).join("")}</tr></thead><tbody>${data.map((row) => `<tr>${row.map((cell, i) => (i === 0 ? `<th scope="row">${escape(cell)}</th>` : `<td>${escape(cell)}</td>`)).join("")}</tr>`).join("")}</tbody></table></div>`;
}
function hero(title, text, meta) {
  return `<section class="hero"><div><h1>${title}</h1><p>${text}</p></div><div class="period"><span class="period-dot" aria-hidden="true"></span>${meta}</div></section>`;
}
function selectState(key, value, focusId) {
  const openPanels = [...document.querySelectorAll("details[open]")].map(
    (panel) => panel.id,
  );
  state[key] = key === "year" ? Number(value) : value;
  const url = new URL(location.href);
  for (const [name, val] of Object.entries(state))
    url.searchParams.set(name, val);
  if (url.href !== location.href) history.pushState(null, "", url);
  renderAtlas();
  for (const id of openPanels) document.getElementById(id).open = true;
  document.getElementById(focusId).focus({ preventScroll: true });
  status.textContent = `${metrics[state.metric].label}, ${state.year}, ${countries.find((c) => c.code === state.country)?.name}.`;
}
function renderAtlas() {
  const metric = metrics[state.metric];
  const currentRows = rows.filter((row) => row.year === state.year);
  const selected = currentRows.find((row) => row.code === state.country);
  const series = rows.filter((row) => row.code === state.country);
  const name = selected?.name || state.country;
  const valid = currentRows.filter(
    (row) => metricValue(row, state.metric) !== null,
  );
  app.innerHTML =
    hero(
      isVietnam
        ? "A closer look at Vietnam."
        : "A world of data.<br>A human story.",
      isVietnam
        ? "Follow Vietnam’s historical mental-health estimates, one year and one measure at a time."
        : "Explore how mental-health estimates vary across countries and over time. Look closer, compare carefully, and see the people behind the patterns.",
      "<strong>1990–2017</strong><br>Historical country estimates",
    ) +
    `
  <section class="atlas" aria-labelledby="atlas-heading">
    <div class="atlas-heading"><div><span class="atlas-mark" aria-hidden="true"></span><h2 id="atlas-heading">${isVietnam ? "Vietnam over time" : "The global picture"}</h2></div><span>${count(valid.length)} countries & territories with data</span></div>
    <div class="toolbar"><div class="field measure-field"><label for="measure">Measure</label><select id="measure" name="measure">${options(Object.entries(metrics).map(([id, m]) => [id, m.label]))}</select></div><div class="field country-field"><label for="country">Country or territory</label><select id="country" name="country" ${isVietnam ? "disabled" : ""}>${options(countries.map((c) => [c.code, c.name]))}</select></div><div class="field year-field"><label for="year">Year</label><select id="year" name="year">${options(years.map((year) => [year, year]))}</select></div></div>
    <div class="atlas-grid"><div class="map-panel"><div class="plot-title"><h3>${escape(metric.description)}</h3><span>${state.year} · ${escape(metric.unit)}</span></div><div id="map"></div><div class="legend"><span id="legend-min"></span><span class="legend-scale" aria-hidden="true"></span><span id="legend-max"></span><span class="no-data-key"><i aria-hidden="true"></i>No data</span></div><p class="chart-hint">Choose a country above or select it on the map. Exact values are in the table below.</p></div>
    <section class="country-panel" aria-labelledby="country-heading"><div class="country-meta"><span>Country focus</span><span>${state.year}</span></div><h2 id="country-heading">${escape(name)}</h2><div class="country-value">${unitValue(selected, state.metric)}<span>${metricValue(selected, state.metric) === null ? "" : escape(metric.unit)}</span></div><p class="value-description">${escape(metric.description)}</p><div class="trend-heading"><h3>The longer view</h3><span>1990–2017</span></div><div id="trend"></div><div class="country-facts"><div><span>Population</span><strong>${selected?.population == null ? "No data" : count(selected.population)}</strong></div><div><span>Depression among men</span><strong>${fmt(selected?.male)}${selected?.male == null ? "" : "%"}</strong></div><div><span>Depression among women</span><strong>${fmt(selected?.female)}${selected?.female == null ? "" : "%"}</strong></div></div><a class="text-link" href="${isVietnam ? "index.html" : "vietnam.html"}">${isVietnam ? "Compare with the world" : "Explore Vietnam"} <span aria-hidden="true">↗</span></a></section></div>
    <div class="atlas-bottom"><p>Same color scale across all years. Country estimates are not a global average.</p><a class="download" download="mental-health-${state.year}-${state.metric}.csv" id="download">Download this view <span aria-hidden="true">↓</span></a></div>
  </section>
  <details class="data-details" id="country-data"><summary>Explore the numbers <span>${count(currentRows.length)} country records · ${state.year}</span></summary>${chartTable(
    ["Country or territory", metric.label + " (" + metric.unit + ")"],
    currentRows.map((row) => [row.name, unitValue(row, state.metric)]),
    `${metric.description} in ${state.year}`,
  )}</details>
  <details class="data-details" id="annual-data"><summary>${escape(name)}: annual data <span>1990–2017</span></summary>${chartTable(
    ["Year", metric.label + " (" + metric.unit + ")"],
    series.map((row) => [row.year, unitValue(row, state.metric)]),
    `${name}: ${metric.description}, 1990–2017`,
  )}</details>
  <section class="survey-invitation"><div><h2>From the world to everyday life.</h2><p>Explore how 1,000 survey respondents described pressures around school, work, relationships, family and self-image.</p></div><a class="button" href="intro.html">Explore the student survey <span aria-hidden="true">↗</span></a></section>${sources()}`;
  for (const [key, id] of [
    ["metric", "measure"],
    ["country", "country"],
    ["year", "year"],
  ]) {
    const control = document.getElementById(id);
    control.value = state[key];
    control.addEventListener("change", (event) =>
      selectState(key, event.target.value, id),
    );
  }
  drawMap(currentRows);
  drawTrend(series, metric);
  const csv = d3.csvFormat(
    currentRows.map((row) => ({
      Country: row.name,
      Code: row.code,
      Year: row.year,
      [metric.label + " (" + metric.unit + ")"]: metricValue(row, state.metric),
    })),
  );
  document.querySelector("#download").href =
    "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
}
function drawMap(currentRows) {
  const width = 850,
    height = 435;
  const features = geography.features.filter(
    (f) => f.properties.name !== "Antarctica",
  );
  const projection = d3.geoNaturalEarth1().fitExtent(
    [
      [12, 12],
      [width - 12, height - 12],
    ],
    { type: "FeatureCollection", features },
  );
  const path = d3.geoPath(projection),
    metric = metrics[state.metric];
  const normalizer = metric.logarithmic
    ? d3.scaleSymlog().constant(1000000).domain(metric.domain).range([0, 1])
    : d3.scaleLinear().domain(metric.domain).range([0, 1]);
  const scale = d3
    .scaleSequential(d3.interpolateRgb("#dbeeea", "#087578"))
    .domain([0, 1])
    .clamp(true);
  const byCode = new Map(currentRows.map((row) => [row.code, row]));
  const byName = new Map(currentRows.map((row) => [row.name, row]));
  const aliases = {
    "United States of America": "United States",
    "Dem. Rep. Congo": "Democratic Republic of Congo",
    "Democratic Republic of the Congo": "Democratic Republic of Congo",
    "Republic of the Congo": "Congo",
    "Dominican Rep.": "Dominican Republic",
    "Central African Rep.": "Central African Republic",
    "Eq. Guinea": "Equatorial Guinea",
    eSwatini: "Swaziland",
    "Bosnia and Herz.": "Bosnia and Herzegovina",
    "S. Sudan": "South Sudan",
    Czechia: "Czech Republic",
  };
  const match = (f) =>
    byCode.get(f.id) ||
    byName.get(aliases[f.properties.name] || f.properties.name);
  const svg = d3
    .select("#map")
    .append("svg")
    .attr("class", "chart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "group")
    .attr(
      "aria-label",
      `World map of ${metric.description} in ${state.year}. The country selector and table provide the same values.`,
    );
  svg
    .append("path")
    .datum(d3.geoGraticule10())
    .attr("d", path)
    .attr("class", "graticule")
    .attr("aria-hidden", "true");
  svg
    .selectAll(".country")
    .data(features)
    .join("path")
    .attr(
      "class",
      (f) => `country${match(f)?.code === state.country ? " selected" : ""}`,
    )
    .attr("d", path)
    .attr("fill", (f) => {
      const value = metricValue(match(f), state.metric);
      return value === null ? "#e1e7ed" : scale(normalizer(value));
    })
    .each(function (feature) {
      const row = match(feature),
        value = metricValue(row, state.metric);
      const label = `${feature.properties.name}: ${unitValue(row, state.metric)}${value === null ? "" : " " + metric.unit}`;
      d3.select(this).append("title").text(label);
      if (row && !isVietnam)
        d3.select(this)
          .attr("role", "button")
          .attr("tabindex", -1)
          .attr("aria-label", `Focus ${label}`)
          .on("click", () => selectState("country", row.code, "country"))
          .on("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectState("country", row.code, "country");
            }
          });
    });
  const compact = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  });
  document.querySelector("#legend-min").textContent =
    state.metric === "population" ? "0" : metric.domain[0] + " " + metric.unit;
  document.querySelector("#legend-max").textContent =
    (state.metric === "population"
      ? compact.format(metric.domain[1])
      : metric.domain[1]) +
    " " +
    metric.unit;
}
function drawTrend(series, metric) {
  const w = 290,
    h = 118,
    pad = { top: 12, right: 14, bottom: 25, left: 35 };
  const svg = d3
    .select("#trend")
    .append("svg")
    .attr("class", "chart")
    .attr("viewBox", `0 0 ${w} ${h}`)
    .attr("role", "img")
    .attr(
      "aria-label",
      `${metric.description} from 1990 to 2017. Exact annual values are in the annual data table.`,
    );
  const x = d3
    .scaleLinear()
    .domain(d3.extent(years))
    .range([pad.left, w - pad.right]);
  const y = d3
    .scaleLinear()
    .domain([
      0,
      Math.max(
        1,
        d3.max(series, (row) => metricValue(row, state.metric)) || 1,
      ) * 1.2,
    ])
    .nice()
    .range([h - pad.bottom, pad.top]);
  svg
    .append("g")
    .attr("transform", `translate(0,${h - pad.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .tickValues([1990, 2017])
        .tickFormat(d3.format("d"))
        .tickSize(0)
        .tickPadding(8),
    );
  svg
    .append("g")
    .attr("transform", `translate(${pad.left},0)`)
    .call(
      d3
        .axisLeft(y)
        .ticks(3)
        .tickSize(-(w - pad.left - pad.right))
        .tickFormat(
          state.metric === "population" ? d3.format(".2s") : d3.format(".1f"),
        ),
    )
    .call((g) => g.select(".domain").remove());
  svg
    .append("path")
    .datum(series)
    .attr(
      "d",
      d3
        .line()
        .defined((row) => metricValue(row, state.metric) !== null)
        .x((row) => x(row.year))
        .y((row) => y(row[state.metric])),
    )
    .attr("fill", "none")
    .attr("stroke", "#087f82")
    .attr("stroke-width", 2.5);
  const selected = series.find((row) => row.year === state.year);
  if (metricValue(selected, state.metric) !== null)
    svg
      .append("circle")
      .attr("cx", x(state.year))
      .attr("cy", y(selected[state.metric]))
      .attr("r", 4)
      .attr("fill", "#087f82")
      .attr("stroke", "white")
      .attr("stroke-width", 2);
}
function bars(id, data, label) {
  const width = 680,
    rowHeight = 60;
  const svg = d3
    .select(id)
    .append("svg")
    .attr("class", "chart")
    .attr("viewBox", `0 0 ${width} ${data.length * rowHeight + 20}`)
    .attr("role", "img")
    .attr("aria-label", label + ". Exact values follow in the table.");
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(data, (d) => d.count) || 1])
    .range([0, 365]);
  const groups = svg
    .selectAll("g")
    .data(data)
    .join("g")
    .attr("transform", (_, i) => `translate(0,${i * rowHeight + 12})`);
  groups
    .append("text")
    .attr("x", 0)
    .attr("y", 20)
    .text((d) => d.label);
  groups
    .append("rect")
    .attr("x", 220)
    .attr("width", (d) => x(d.count))
    .attr("height", 30)
    .attr("rx", 3)
    .attr("fill", "#087f82");
  groups
    .append("text")
    .attr("x", (d) => 232 + x(d.count))
    .attr("y", 20)
    .attr("class", "bar-value")
    .text((d) => count(d.count));
}
function renderSurvey() {
  const queryTopic = new URLSearchParams(location.search).get("topic");
  const selectedTopic = Object.hasOwn(topics, route)
    ? route
    : Object.hasOwn(topics, queryTopic)
      ? queryTopic
      : null;
  const total = Object.values(survey).reduce(
      (sum, item) => sum + item.total,
      0,
    ),
    sample = selectedTopic ? survey[selectedTopic] : null;
  const data = sample
    ? sample.levels
    : Object.entries(survey)
        .map(([key, item]) => ({ label: topics[key], count: item.total }))
        .sort((a, b) => b.count - a.count);
  const table = (records, size, caption) =>
    chartTable(
      ["Category", "Responses", "Share"],
      records.map((item) => [
        item.label,
        count(item.count),
        fmt((item.count / size) * 100, 1) + "%",
      ]),
      caption,
    );
  app.innerHTML =
    hero(
      selectedTopic
        ? `${topics[selectedTopic]}.<br>A part of the picture.`
        : "Everyday pressures.<br>Shared experiences.",
      "A closer look at a student-led survey on mental health. These responses describe a local sample; they do not represent a population or establish a diagnosis.",
      `<strong>${count(total)} responses</strong><br>Five categories of pressure`,
    ) +
    `
  <nav class="topic-nav" aria-label="Survey categories"><a href="intro.html" ${!selectedTopic ? 'aria-current="page"' : ""}>Overview</a>${Object.entries(
    topics,
  )
    .map(
      ([key, label]) =>
        `<a href="${key}.html" ${key === selectedTopic ? 'aria-current="page"' : ""}>${label}</a>`,
    )
    .join("")}</nav>
  <section class="survey-grid"><div class="survey-chart"><div class="plot-title"><div><h2>${sample ? "Survey score categories" : "Where respondents felt the most pressure"}</h2><p>${sample ? `${count(sample.total)} responses in this group` : "Each respondent is counted in one primary category."}</p></div></div><div id="survey-bars"></div>${table(data, sample?.total ?? total, sample ? "Score categories within this survey group" : "Primary pressure category in the survey")}</div><div class="survey-context"><span class="quote-mark" aria-hidden="true">“</span><h2>Look for patterns.<br>Leave room for people.</h2><p>A survey response captures one moment in someone’s life. A category summarizes data; it cannot describe a whole person.</p><dl><dt>Responses in this view</dt><dd>${count(sample?.total ?? total)}</dd><dt>How to read the chart</dt><dd>Bars show counts. Percentages use this view’s sample size.</dd><dt>What it cannot tell us</dt><dd>Whether pressure caused a condition, or how common it is outside this sample.</dd></dl><a href="#sources">Read the survey limitations</a></div></section>
  ${
    sample
      ? `<section class="survey-chart frequency-panel"><h2>Reported thoughts of suicide</h2><p class="chart-description">This section summarizes a sensitive survey question. Counts describe respondents’ own answers, rather than a clinical risk assessment.</p><div id="frequency-bars"></div>${table(sample.frequency, sample.total, "Reported frequency of thoughts of suicide")}</section>`
      : Object.entries(demographics)
          .map(
            ([key, values]) =>
              `<details class="data-details"><summary>${key === "Sex" ? "Recorded sex" : key === "Academic Level" ? "Education level" : "LGBT identification"} <span>${count(values.reduce((sum, item) => sum + item.count, 0))} responses</span></summary>${table(
                values,
                values.reduce((sum, item) => sum + item.count, 0),
                key + " recorded in the original survey",
              )}</details>`,
          )
          .join("")
  }
  <div class="context-note"><strong>About the score labels</strong><p>The English labels translate the original recorded categories: Bình thường (Normal), Tối thiểu (Minimal), Nhẹ (Minor), Trung bình (Moderate), Nặng (Severe). Collection methods and clinical validation are not documented.</p></div>${sources()}`;
  bars(
    "#survey-bars",
    data,
    sample
      ? "Survey score category counts"
      : "Primary pressure category counts",
  );
  if (sample)
    bars(
      "#frequency-bars",
      sample.frequency,
      "Reported frequency of thoughts of suicide",
    );
}
async function load() {
  if (loading) return;
  loading = true;
  status.textContent = "Loading the atlas…";
  try {
    if (!d3) throw new Error("Chart library unavailable");
    const paths = isSurvey
      ? ["data/survey.json"]
      : ["data/countries.json", "data/world.geojson"];
    const results = await Promise.all(
      paths.map(async (path) => {
        const response = await fetch(path);
        if (!response.ok) throw new Error("Data request failed");
        return response.json();
      }),
    );
    if (isSurvey) {
      const payload = results[0];
      survey = payload.topics;
      demographics = payload.demographics;
      if (!survey || Object.keys(survey).length !== 5)
        throw new Error("Invalid survey data");
      renderSurvey();
    } else {
      [rows, geography] = results;
      if (
        !Array.isArray(rows) ||
        !rows.length ||
        !Array.isArray(geography?.features)
      )
        throw new Error("Invalid country data");
      years = [...new Set(rows.map((row) => row.year))].sort((a, b) => a - b);
      countries = [
        ...new Map(
          rows.map((row) => [row.code, { code: row.code, name: row.name }]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name));
      state = resolveState(
        location.search,
        years,
        countries.map((c) => c.code),
      );
      if (isVietnam) state.country = "VNM";
      renderAtlas();
    }
    status.textContent = "";
  } catch {
    app.innerHTML = hero(
      "The data could not load.",
      "Check your connection, then try loading the charts again.",
      "Historical data atlas",
    );
    status.innerHTML =
      '<p>The dataset is unavailable. Try again, or refresh this page.</p><button class="button" id="retry">Try again</button>';
    document.querySelector("#retry").addEventListener("click", load);
  } finally {
    loading = false;
  }
}
window.addEventListener("popstate", () => {
  if (rows) {
    state = resolveState(
      location.search,
      years,
      countries.map((c) => c.code),
    );
    if (isVietnam) state.country = "VNM";
    renderAtlas();
  } else if (survey) renderSurvey();
});
document
  .querySelector(
    `[data-nav="${isSurvey ? "survey" : isVietnam ? "vietnam" : "global"}"]`,
  )
  ?.setAttribute("aria-current", "page");
load();
