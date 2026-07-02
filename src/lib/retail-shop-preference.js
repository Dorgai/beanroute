const DEFAULT_SHOP_KEY = 'defaultRetailShopId';
const SELECTED_SHOP_KEY = 'selectedShopId';

export function getStoredDefaultShopId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(DEFAULT_SHOP_KEY);
}

export function setStoredDefaultShopId(shopId) {
  if (typeof window === 'undefined') return;
  if (shopId) {
    localStorage.setItem(DEFAULT_SHOP_KEY, shopId);
  } else {
    localStorage.removeItem(DEFAULT_SHOP_KEY);
  }
}

export function getStoredSelectedShopId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SELECTED_SHOP_KEY);
}

export function setStoredSelectedShopId(shopId) {
  if (typeof window === 'undefined') return;
  if (shopId) {
    localStorage.setItem(SELECTED_SHOP_KEY, shopId);
  }
}

/**
 * Pick the best initial shop: default preference, then last selected, then first in list.
 */
export function resolveInitialShopId(shops, { defaultShopId, selectedShopId } = {}) {
  if (!Array.isArray(shops) || shops.length === 0) return '';

  const shopIds = new Set(shops.map((shop) => shop.id));
  const preferred = [defaultShopId, selectedShopId].find((id) => id && shopIds.has(id));
  return preferred || shops[0].id;
}
