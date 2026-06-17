export const USER_ROLES = ['user', 'admin'] as const;
export const PRODUCT_CATEGORIES = ['tea', 'syrups', 'additions', 'drink_kits'] as const;
export const PRODUCT_TASTES = ['травяной', 'цитрусовый', 'ягодный', 'экзотический', 'слайдий'] as const;
export const ORDER_ITEM_PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;
export const PROCESSOR_TYPES = ['intel', 'amd', 'arm', 'apple'] as const;
export const GRAPHICS_TYPES = ['integrated', 'discrete'] as const;
export const CATALOG_SORT_VALUES = ['popular', 'rating', 'price_asc', 'price_desc'] as const;
export const ORDER_STATUSES = ['pending', 'shipped'] as const;
export const POPULAR_PRODUCT_CATEGORIES = PRODUCT_CATEGORIES;

export type UserRole = (typeof USER_ROLES)[number];
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];
export type OrderItemProductCategory = (typeof ORDER_ITEM_PRODUCT_CATEGORIES)[number];
export type ProductTaste = (typeof PRODUCT_TASTES)[number];
export type ProcessorType = (typeof PROCESSOR_TYPES)[number];
export type GraphicsType = (typeof GRAPHICS_TYPES)[number];
export type CatalogSortValue = (typeof CATALOG_SORT_VALUES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PopularProductCategory = (typeof POPULAR_PRODUCT_CATEGORIES)[number];

export const SESSION_COOKIE_NAME = 'tech_market_session';
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;
export const POPULAR_PRODUCTS_TTL_MS = 1000 * 60 * 60 * 24;
