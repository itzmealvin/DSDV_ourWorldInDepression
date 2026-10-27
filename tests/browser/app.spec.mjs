import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("filters update the map, country panel, URL and browser history", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "A world of data. A human story." }),
  ).toBeVisible();
  await expect(page.locator(".country")).toHaveCount(176);
  await page.getByLabel("Year", { exact: true }).selectOption("1990");
  await expect(page).toHaveURL(/year=1990/);
  await page.getByLabel("Measure", { exact: true }).selectOption("suicide");
  await expect(
    page.getByRole("heading", { name: "Deaths by suicide per 100,000 people" }),
  ).toBeVisible();
  await page.getByLabel("Country or territory").selectOption("JPN");
  await expect(
    page.getByRole("heading", { name: "Japan", exact: true }),
  ).toBeVisible();
  await page.goBack();
  await expect(page.getByLabel("Country or territory")).toHaveValue("VNM");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download this view" }).click();
  const download = await downloadEvent;
  const { readFile } = await import("node:fs/promises");
  const csv = await readFile(await download.path(), "utf8");
  expect(csv).toContain("Suicide rate (per 100,000)");
  expect(csv).toMatch(/Japan,JPN,1990,/);
  expect(csv).not.toContain("OWID_WRL");
  expect(errors).toEqual([]);
});
test("all topic routes render charts, tables and a single page heading", async ({
  page,
}) => {
  for (const route of [
    "vietnam",
    "intro",
    "depress",
    "education",
    "family",
    "love",
    "self",
    "work",
  ]) {
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(`/${route}.html`);
    await expect(page.locator("#status")).toHaveText("");
    await expect(page.locator("svg.chart").first()).toBeVisible();
    await expect(page.locator("main h1")).toHaveCount(1);
    expect(errors).toEqual([]);
  }
  await page.goto("/education.html");
  await expect(
    page.getByText("291 responses in this group", { exact: true }),
  ).toBeVisible();
});
test("mobile layout fits at 375px and failed data requests can be retried", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await expect(page.locator(".country").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.route("**/data/countries.json", (r) => r.abort());
  await page.reload();
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
  await page.unroute("**/data/countries.json");
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.locator(".country").first()).toBeVisible();
});
test("atlas and survey have no automated accessibility violations", async ({
  page,
}) => {
  for (const route of ["/", "/education.html", "/intro.html"]) {
    await page.goto(route);
    await expect(page.locator("#status")).toHaveText("");
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  }
});

test("all measures render without overflow at phone, tablet and desktop widths", async ({
  page,
}) => {
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?country=CHN");
    await expect(page.locator(".country").first()).toBeVisible();
    const measures = await page
      .locator("#measure option")
      .evaluateAll((options) => options.map((o) => o.value));
    for (const measure of measures) {
      await page.getByLabel("Measure", { exact: true }).selectOption(measure);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(page.locator("#trend path").last()).toBeVisible();
    }
  }
});

test("hosting root exposes only public assets and content works under security headers", async ({
  page,
  request,
}) => {
  for (const path of [
    "/assets/education/education.csv",
    "/data/world_data.csv",
    "/tooling/prepare_data.py",
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  await page.route("**/*.html", async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        "content-security-policy":
          "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; connect-src 'self'; img-src 'self' data:",
      },
    });
  });
  await page.goto("/index.html");
  await expect(page.locator(".country").first()).toBeVisible();
  await page.getByLabel("Year", { exact: true }).selectOption("2000");
  await expect(
    page.getByRole("heading", { name: "Vietnam", exact: true }),
  ).toBeVisible();
});
