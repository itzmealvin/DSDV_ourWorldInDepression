import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveState, metricValue } from "../public/scripts/data.mjs";
test("missing values stay missing while real zero remains zero", () => {
  assert.equal(metricValue({ depression: null }, "depression"), null);
  assert.equal(metricValue({ depression: 0 }, "depression"), 0);
  assert.equal(metricValue({ depression: NaN }, "depression"), null);
});
test("invalid URL state falls back to available data", () => {
  assert.deepEqual(
    resolveState("?year=2099&metric=oops&country=XXX", [1990, 2017], ["VNM"]),
    { year: 2017, metric: "depression", country: "VNM" },
  );
  assert.deepEqual(
    resolveState(
      "?year=1990&metric=suicide&country=VNM",
      [1990, 2017],
      ["VNM"],
    ),
    { year: 1990, metric: "suicide", country: "VNM" },
  );
});

test("legend scales cover the supplied data so high estimates are not silently clamped", async () => {
  const { readFile } = await import("node:fs/promises");
  const { metrics } = await import("../public/scripts/data.mjs");
  const rows = JSON.parse(
    await readFile(
      new URL("../public/data/countries.json", import.meta.url),
      "utf8",
    ),
  );
  for (const [key, metric] of Object.entries(metrics)) {
    const maximum = Math.max(...rows.map((row) => metricValue(row, key) ?? 0));
    assert.ok(
      maximum <= metric.domain[1],
      `${key}: ${maximum} exceeds the legend maximum ${metric.domain[1]}`,
    );
  }
});
