import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import {
  GRAPHICS_TYPES,
  ORDER_ITEM_PRODUCT_CATEGORIES,
  ORDER_STATUSES,
  POPULAR_PRODUCT_CATEGORIES,
  PROCESSOR_TYPES,
  PRODUCT_CATEGORIES,
  USER_ROLES,
} from '@/server/constants';

export const users = sqliteTable(
  'users',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    login: text('login').notNull(),
    loginNormalized: text('login_normalized').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role', { enum: USER_ROLES }).notNull().default('user'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    loginNormalizedUnique: uniqueIndex('users_login_normalized_unique').on(table.loginNormalized),
  }),
);

export const sessions = sqliteTable(
  'sessions',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    expiresAt: integer('expires_at').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    tokenHashUnique: uniqueIndex('sessions_token_hash_unique').on(table.tokenHash),
    userIndex: index('sessions_user_index').on(table.userId),
  }),
);

export const news = sqliteTable(
  'news',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    description: text('description').notNull(),
    activeUntil: integer('active_until'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    createdAtIndex: index('news_created_at_index').on(table.createdAt),
  }),
);

export const brands = sqliteTable(
  'brands',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    nameNormalized: text('name_normalized').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    nameNormalizedUnique: uniqueIndex('brands_name_normalized_unique').on(table.nameNormalized),
  }),
);

export const products = sqliteTable(
  'products',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    nameSearch: text('name_search').notNull(),
    category: text('category', { enum: PRODUCT_CATEGORIES }).notNull(),
    price: integer('price').notNull(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id, { onDelete: 'restrict' }),
    screenInches: real('screen_inches'),
    processor: text('processor', { enum: PROCESSOR_TYPES }),
    ramGb: integer('ram_gb'),
    storageGb: integer('storage_gb'),
    graphicsType: text('graphics_type', { enum: GRAPHICS_TYPES }).notNull(),
    graphicsModel: text('graphics_model'),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    categoryIndex: index('products_category_index').on(table.category),
    brandIndex: index('products_brand_index').on(table.brandId),
    processorIndex: index('products_processor_index').on(table.processor),
    graphicsIndex: index('products_graphics_index').on(table.graphicsType),
    searchIndex: index('products_search_index').on(table.nameSearch),
  }),
);

export const productImages = sqliteTable(
  'product_images',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    productIndex: index('product_images_product_index').on(table.productId),
  }),
);

export const reviews = sqliteTable(
  'reviews',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    productIndex: index('reviews_product_index').on(table.productId),
    userIndex: index('reviews_user_index').on(table.userId),
    uniqueUserProduct: uniqueIndex('reviews_user_product_unique').on(table.userId, table.productId),
  }),
);

export const cartItems = sqliteTable(
  'cart_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    userIndex: index('cart_items_user_index').on(table.userId),
    uniqueUserProduct: uniqueIndex('cart_items_user_product_unique').on(table.userId, table.productId),
  }),
);

export const orders = sqliteTable(
  'orders',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', { enum: ORDER_STATUSES }).notNull().default('pending'),
    totalPrice: integer('total_price').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email').notNull(),
    address: text('address').notNull(),
    createdAt: integer('created_at').notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => ({
    userIndex: index('orders_user_index').on(table.userId),
    statusIndex: index('orders_status_index').on(table.status),
    createdAtIndex: index('orders_created_at_index').on(table.createdAt),
  }),
);

export const orderItems = sqliteTable(
  'order_items',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    orderId: integer('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    productId: integer('product_id').references(() => products.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull().default(1),
    productName: text('product_name').notNull(),
    productPrice: integer('product_price').notNull(),
    productCategory: text('product_category', { enum: ORDER_ITEM_PRODUCT_CATEGORIES }).notNull(),
    brandName: text('brand_name').notNull(),
    screenInches: real('screen_inches'),
    processor: text('processor', { enum: PROCESSOR_TYPES }),
    ramGb: integer('ram_gb'),
    storageGb: integer('storage_gb'),
    graphicsType: text('graphics_type', { enum: GRAPHICS_TYPES }).notNull(),
    graphicsModel: text('graphics_model'),
    imageUrl: text('image_url'),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    orderIndex: index('order_items_order_index').on(table.orderId),
    productIndex: index('order_items_product_index').on(table.productId),
  }),
);

export const popularProductsCache = sqliteTable(
  'popular_products_cache',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    popularCategory: text('popular_category', { enum: POPULAR_PRODUCT_CATEGORIES }).notNull(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    calculatedAt: integer('calculated_at').notNull(),
  },
  (table) => ({
    categoryIndex: index('popular_products_cache_category_index').on(table.popularCategory),
    uniquePosition: uniqueIndex('popular_products_cache_category_position_unique').on(
      table.popularCategory,
      table.position,
    ),
  }),
);
