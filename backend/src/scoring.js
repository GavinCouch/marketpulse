export function computeOpportunityScore({ retailPriceCents, recentResaleCents, volatilityPct }) {
  if (!retailPriceCents || retailPriceCents <= 0 || !recentResaleCents) return 0;

  const marginPct = ((recentResaleCents - retailPriceCents) / retailPriceCents) * 100;

  // Cap and normalize
  const marginScore = clamp(mapRange(marginPct, -20, 80, 0, 70), 0, 70);
  const stabilityScore = clamp(mapRange(100 - volatilityPct, 0, 100, 0, 30), 0, 30);

  return Math.round(clamp(marginScore + stabilityScore, 0, 100));
}

export function computeVolatilityPct(pricesCents) {
  // volatility = (stddev / mean) * 100
  if (!pricesCents || pricesCents.length < 2) return 0;
  const mean = pricesCents.reduce((a, b) => a + b, 0) / pricesCents.length;
  if (mean <= 0) return 0;

  const variance =
    pricesCents.reduce((sum, x) => sum + (x - mean) ** 2, 0) / pricesCents.length;

  const stddev = Math.sqrt(variance);
  return (stddev / mean) * 100;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mapRange(value, inMin, inMax, outMin, outMax) {
  if (inMax === inMin) return outMin;
  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}
