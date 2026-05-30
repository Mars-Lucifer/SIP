import fs from 'fs';
import path from 'path';

import BetterSqlite3 from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from '@/server/db/schema';
import { hashPassword } from '@/server/security';

const DATABASE_DIRECTORY = path.join(process.cwd(), 'storage');
export const DATABASE_PATH = path.join(DATABASE_DIRECTORY, 'shop.db');

type SQLiteConnection = InstanceType<typeof BetterSqlite3>;
type DrizzleConnection = ReturnType<typeof drizzle<typeof schema>>;

declare global {
  var __techMarketSqlite__: SQLiteConnection | undefined;
  var __techMarketDrizzle__: DrizzleConnection | undefined;
  var __techMarketDatabaseInitialized__: boolean | undefined;
}

if (!fs.existsSync(DATABASE_DIRECTORY)) {
  fs.mkdirSync(DATABASE_DIRECTORY, { recursive: true });
}

const sqlite =
  globalThis.__techMarketSqlite__ ?? new BetterSqlite3(DATABASE_PATH, { fileMustExist: false });

if (!globalThis.__techMarketSqlite__) {
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  globalThis.__techMarketSqlite__ = sqlite;
}

export const rawDb = globalThis.__techMarketSqlite__ ?? sqlite;

export const db = globalThis.__techMarketDrizzle__ ?? drizzle(rawDb, { schema });

if (!globalThis.__techMarketDrizzle__) {
  globalThis.__techMarketDrizzle__ = db;
}

function createTables() {
  rawDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      login TEXT NOT NULL,
      login_normalized TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      active_until INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_normalized TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_search TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('laptop', 'mini_pc')),
      price INTEGER NOT NULL,
      brand_id INTEGER NOT NULL,
      screen_inches REAL,
      processor TEXT CHECK (processor IN ('intel', 'amd', 'arm', 'apple') OR processor IS NULL),
      ram_gb INTEGER,
      storage_gb INTEGER,
      graphics_type TEXT NOT NULL CHECK (graphics_type IN ('integrated', 'discrete')),
      graphics_model TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      url TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'shipped')),
      total_price INTEGER NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      address TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      quantity INTEGER NOT NULL DEFAULT 1,
      product_name TEXT NOT NULL,
      product_price INTEGER NOT NULL,
      product_category TEXT NOT NULL CHECK (product_category IN ('laptop', 'mini_pc', 'peripheral')),
      brand_name TEXT NOT NULL,
      screen_inches REAL,
      processor TEXT CHECK (processor IN ('intel', 'amd', 'arm', 'apple') OR processor IS NULL),
      ram_gb INTEGER,
      storage_gb INTEGER,
      graphics_type TEXT NOT NULL CHECK (graphics_type IN ('integrated', 'discrete')),
      graphics_model TEXT,
      image_url TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS popular_products_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      popular_category TEXT NOT NULL CHECK (popular_category IN ('work_laptops', 'gaming_laptops', 'mini_pc')),
      product_id INTEGER NOT NULL,
      position INTEGER NOT NULL,
      calculated_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS cart_items_user_product_unique
      ON cart_items(user_id, product_id);
    CREATE UNIQUE INDEX IF NOT EXISTS reviews_user_product_unique
      ON reviews(user_id, product_id);
    CREATE UNIQUE INDEX IF NOT EXISTS popular_products_cache_category_position_unique
      ON popular_products_cache(popular_category, position);
    CREATE INDEX IF NOT EXISTS sessions_user_index ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS news_created_at_index ON news(created_at);
    CREATE INDEX IF NOT EXISTS products_category_index ON products(category);
    CREATE INDEX IF NOT EXISTS products_brand_index ON products(brand_id);
    CREATE INDEX IF NOT EXISTS products_processor_index ON products(processor);
    CREATE INDEX IF NOT EXISTS products_graphics_index ON products(graphics_type);
    CREATE INDEX IF NOT EXISTS products_search_index ON products(name_search);
    CREATE INDEX IF NOT EXISTS product_images_product_index ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS reviews_product_index ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS reviews_user_index ON reviews(user_id);
    CREATE INDEX IF NOT EXISTS cart_items_user_index ON cart_items(user_id);
    CREATE INDEX IF NOT EXISTS orders_user_index ON orders(user_id);
    CREATE INDEX IF NOT EXISTS orders_status_index ON orders(status);
    CREATE INDEX IF NOT EXISTS orders_created_at_index ON orders(created_at);
    CREATE INDEX IF NOT EXISTS order_items_order_index ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS order_items_product_index ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS popular_products_cache_category_index
      ON popular_products_cache(popular_category);
  `);
}

function migrateLegacyCatalogData() {
  rawDb.exec(`
    DELETE FROM popular_products_cache;
    UPDATE products
    SET screen_inches = NULL
    WHERE category = 'mini_pc';
    DELETE FROM products
    WHERE category = 'peripheral';
  `);
}

function seedNews() {
  const existing = rawDb.prepare('SELECT COUNT(*) as count FROM news').get() as { count: number };

  if (existing.count > 0) {
    return;
  }

  const now = Date.now();
  const insertNews = rawDb.prepare(`
    INSERT INTO news (title, description, active_until, created_at)
    VALUES (@title, @description, @activeUntil, @createdAt)
  `);

  const seedItems = [
    {
      title: 'Открытие магазина',
      description: 'Мы запустили магазин электроники и подготовили первые подборки ноутбуков.',
      activeUntil: null,
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    },
    {
      title: 'Снижение цен на популярные модели',
      description: 'Часть позиций в каталоге участвует в стартовой акции для первых покупателей.',
      activeUntil: now + 1000 * 60 * 60 * 24 * 14,
      createdAt: now - 1000 * 60 * 60 * 24,
    },
    {
      title: 'Скоро появится админ-управление новостями',
      description: 'Пока новости заполняются базово, а позже для них появится отдельный интерфейс.',
      activeUntil: null,
      createdAt: now,
    },
  ];

  const seedTransaction = rawDb.transaction((items: typeof seedItems) => {
    for (const item of items) {
      insertNews.run(item);
    }
  });

  seedTransaction(seedItems);
}

function seedRootAdmin() {
  const rootLogin = 'root';
  const rootLoginNormalized = 'root';
  const now = Date.now();
  const rootPasswordHash = hashPassword('rootroot');

  const existingRoot = rawDb
    .prepare('SELECT id FROM users WHERE login_normalized = ? LIMIT 1')
    .get(rootLoginNormalized) as { id: number } | undefined;

  if (existingRoot) {
    rawDb
      .prepare(`
        UPDATE users
        SET login = ?, name = ?, password_hash = ?, role = 'admin'
        WHERE id = ?
      `)
      .run([rootLogin, rootLogin, rootPasswordHash, existingRoot.id]);

    return;
  }

  rawDb
    .prepare(`
      INSERT INTO users (login, login_normalized, name, password_hash, role, created_at)
      VALUES (?, ?, ?, ?, 'admin', ?)
    `)
    .run([rootLogin, rootLoginNormalized, rootLogin, rootPasswordHash, now]);
}

export function initializeDatabase() {
  if (globalThis.__techMarketDatabaseInitialized__) {
    return;
  }

  createTables();
  migrateLegacyCatalogData();
  seedRootAdmin();
  seedNews();

  globalThis.__techMarketDatabaseInitialized__ = true;
}

initializeDatabase();

export * from '@/server/db/schema';
