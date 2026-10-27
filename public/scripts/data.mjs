const prevalence = (label, description, max = 8) => ({
  label,
  description,
  unit: "%",
  domain: [0, max],
});
export const metrics = {
  depression: prevalence(
    "Depression",
    "Age-standardized prevalence of depression",
  ),
  population: {
    label: "Population",
    description: "Total population",
    unit: "people",
    domain: [0, 1.5e9],
    logarithmic: true,
  },
  male: prevalence("Depression among men", "Depression prevalence among men"),
  female: prevalence(
    "Depression among women",
    "Depression prevalence among women",
    10,
  ),
  age: prevalence(
    "Depression at ages 70+",
    "Depression prevalence among people aged 70+",
    12,
  ),
  age15: prevalence(
    "Depression at ages 15–19",
    "Depression prevalence at ages 15–19",
    10,
  ),
  age20: prevalence(
    "Depression at ages 20–24",
    "Depression prevalence at ages 20–24",
    12,
  ),
  age30: prevalence(
    "Depression at ages 30–34",
    "Depression prevalence at ages 30–34",
    12,
  ),
  anxiety: prevalence(
    "Anxiety disorders",
    "Prevalence of anxiety disorders",
    12,
  ),
  bipolar: prevalence("Bipolar disorder", "Prevalence of bipolar disorder", 2),
  schizophrenia: prevalence("Schizophrenia", "Prevalence of schizophrenia", 1),
  eating: prevalence("Eating disorders", "Prevalence of eating disorders", 2),
  drug: prevalence("Drug use disorders", "Prevalence of drug use disorders", 5),
  alcohol: prevalence(
    "Alcohol use disorders",
    "Prevalence of alcohol use disorders",
    8,
  ),
  suicide: {
    label: "Suicide rate",
    description: "Deaths by suicide per 100,000 people",
    unit: "per 100,000",
    domain: [0, 100],
  },
};
export function metricValue(row, key) {
  return Number.isFinite(row?.[key]) ? row[key] : null;
}
export function resolveState(search, years, codes) {
  const query = new URLSearchParams(search);
  return {
    year: years.includes(Number(query.get("year")))
      ? Number(query.get("year"))
      : Math.max(...years),
    metric: Object.hasOwn(metrics, query.get("metric"))
      ? query.get("metric")
      : "depression",
    country: codes.includes(query.get("country"))
      ? query.get("country")
      : codes.includes("VNM")
        ? "VNM"
        : codes[0],
  };
}
