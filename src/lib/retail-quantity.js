export const BAG_WEIGHTS = {
  SMALL: 0.2,
  MEDIUM: 0.5,
  LARGE: 1.0,
};

/**
 * Convert bag counts to retail kilograms.
 */
export function calculateRetailKgFromBags({
  smallBagsEspresso = 0,
  smallBagsFilter = 0,
  mediumBagsEspresso = 0,
  mediumBagsFilter = 0,
  largeBags = 0,
} = {}) {
  const smallEspresso = Number(smallBagsEspresso) || 0;
  const smallFilter = Number(smallBagsFilter) || 0;
  const mediumEspresso = Number(mediumBagsEspresso) || 0;
  const mediumFilter = Number(mediumBagsFilter) || 0;
  const large = Number(largeBags) || 0;

  return (
    (smallEspresso + smallFilter) * BAG_WEIGHTS.SMALL +
    (mediumEspresso + mediumFilter) * BAG_WEIGHTS.MEDIUM +
    large * BAG_WEIGHTS.LARGE
  );
}

/**
 * Retail kg available to order from current green stock after processing loss.
 * Example: 100kg green with 15% loss => 85kg retail available.
 */
export function calculateAvailableRetailKg(greenStockKg, haircutPercentage) {
  const greenStock = Number(greenStockKg) || 0;
  if (greenStock <= 0) return 0;

  const pct = clampHaircutPercentage(haircutPercentage);
  return roundKg(greenStock * (1 - pct / 100));
}

/**
 * Green coffee consumed when fulfilling a retail order.
 * Example: 85kg retail with 15% loss => 100kg green consumed.
 */
export function calculateGreenConsumption(retailKg, haircutPercentage) {
  const retail = Number(retailKg) || 0;
  if (retail <= 0) return 0;

  const pct = clampHaircutPercentage(haircutPercentage);
  if (pct >= 100) return retail;

  return roundKg(retail / (1 - pct / 100));
}

/**
 * Processing loss amount in kg for a retail order.
 */
export function calculateHaircutAmount(retailKg, haircutPercentage) {
  const retail = Number(retailKg) || 0;
  if (retail <= 0) return 0;

  return roundKg(calculateGreenConsumption(retail, haircutPercentage) - retail);
}

/**
 * Shop inventory kg from bag counts (informational only).
 */
export function calculateShopInventoryKg({
  smallBags = 0,
  smallBagsEspresso = 0,
  smallBagsFilter = 0,
  mediumBagsEspresso = 0,
  mediumBagsFilter = 0,
  largeBags = 0,
} = {}) {
  const legacySmall = Number(smallBags) || 0;
  const espresso = Number(smallBagsEspresso) || 0;
  const filter = Number(smallBagsFilter) || 0;
  const mediumEspresso = Number(mediumBagsEspresso) || 0;
  const mediumFilter = Number(mediumBagsFilter) || 0;
  const large = Number(largeBags) || 0;

  const smallTotal =
    espresso + filter + (legacySmall > 0 && espresso === 0 && filter === 0 ? legacySmall : 0);

  return roundKg(
    smallTotal * BAG_WEIGHTS.SMALL +
      (mediumEspresso + mediumFilter) * BAG_WEIGHTS.MEDIUM +
      large * BAG_WEIGHTS.LARGE
  );
}

/**
 * Count total bags for label tracking without double-counting legacy fields.
 */
export function countTotalBags(item = {}) {
  const smallBags = Number(item.smallBags) || 0;
  const smallBagsEspresso = Number(item.smallBagsEspresso) || 0;
  const smallBagsFilter = Number(item.smallBagsFilter) || 0;
  const mediumBagsEspresso = Number(item.mediumBagsEspresso) || 0;
  const mediumBagsFilter = Number(item.mediumBagsFilter) || 0;
  const largeBags = Number(item.largeBags) || 0;

  const legacySmall =
    smallBags > 0 && smallBagsEspresso === 0 && smallBagsFilter === 0 ? smallBags : 0;

  return (
    smallBagsEspresso +
    smallBagsFilter +
    legacySmall +
    mediumBagsEspresso +
    mediumBagsFilter +
    largeBags
  );
}

export const MAX_BAG_COUNT = 99;

/**
 * Sanitize bag quantity input: whole numbers only, 0-99.
 * Returns empty string while clearing, otherwise integer string.
 */
export function sanitizeBagQuantityInput(raw) {
  if (raw === '' || raw === null || raw === undefined) return '';

  const digits = String(raw).replace(/[^\d]/g, '');
  if (digits === '') return '';

  const value = Math.min(MAX_BAG_COUNT, parseInt(digits, 10));
  return String(value);
}

/**
 * Parse a sanitized bag count for calculations (0 if empty/invalid).
 */
export function parseBagCount(raw) {
  const sanitized = sanitizeBagQuantityInput(raw);
  return sanitized === '' ? 0 : parseInt(sanitized, 10);
}

/**
 * Format kg values with one decimal and dot separator.
 */
export function formatKgOneDecimal(kg) {
  return Number(kg || 0).toFixed(1);
}

function clampHaircutPercentage(haircutPercentage) {
  const pct = Number(haircutPercentage);
  if (Number.isNaN(pct)) return 15;
  return Math.min(100, Math.max(0, pct));
}

function roundKg(value) {
  return parseFloat(Number(value).toFixed(4));
}
