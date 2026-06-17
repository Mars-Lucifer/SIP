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
      category TEXT NOT NULL CHECK (category IN ('tea', 'syrups', 'additions', 'drink_kits')),
      price INTEGER NOT NULL,
      brand_id INTEGER NOT NULL,
      weight_grams INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS product_tastes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      taste TEXT NOT NULL CHECK (taste IN ('травяной', 'цитрусовый', 'ягодный', 'экзотический', 'слайдий')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
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
      product_category TEXT NOT NULL CHECK (product_category IN ('tea', 'syrups', 'additions', 'drink_kits')),
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
      popular_category TEXT NOT NULL CHECK (popular_category IN ('tea', 'syrups', 'additions', 'drink_kits')),
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
    CREATE INDEX IF NOT EXISTS products_search_index ON products(name_search);
    CREATE INDEX IF NOT EXISTS product_tastes_product_index ON product_tastes(product_id);
    CREATE INDEX IF NOT EXISTS product_tastes_taste_index ON product_tastes(taste);
    CREATE UNIQUE INDEX IF NOT EXISTS product_tastes_product_taste_unique
      ON product_tastes(product_id, taste);
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

function ensureProductWeightColumn() {
  const columns = rawDb.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;

  if (!columns.some((column) => column.name === 'weight_grams')) {
    rawDb.exec(`ALTER TABLE products ADD COLUMN weight_grams INTEGER`);
  }
}

function productCatalogNeedsRefresh() {
  const productCount = rawDb.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };

  if (productCount.count === 0) {
    return true;
  }

  const legacyCount = rawDb
    .prepare(
      "SELECT COUNT(*) as count FROM products WHERE category NOT IN ('tea', 'syrups', 'additions', 'drink_kits')",
    )
    .get() as { count: number };

  return legacyCount.count > 0;
}

function clearProductCatalog() {
  rawDb.exec(`
    DELETE FROM popular_products_cache;
    DELETE FROM product_tastes;
    DELETE FROM product_images;
    DELETE FROM cart_items;
    DELETE FROM reviews;
    DELETE FROM order_items;
    DELETE FROM products;
    DELETE FROM brands;
  `);
}

function seedProductCatalog() {
  const now = Date.now();

  const seedBrands = [
    'Natura Tea',
    'Citrus Bar',
    'Berry Lab',
    'Exotic House',
    'Drink Mix',
  ];

  const brandInsert = rawDb.prepare(`
    INSERT INTO brands (name, name_normalized, created_at)
    VALUES (?, ?, ?)
  `);

  const productInsert = rawDb.prepare(`
    INSERT INTO products (name, name_search, category, price, brand_id, weight_grams, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const tasteInsert = rawDb.prepare(`
    INSERT INTO product_tastes (product_id, taste, sort_order, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const imageInsert = rawDb.prepare(`
    INSERT INTO product_images (product_id, url, sort_order, created_at)
    VALUES (?, ?, ?, ?)
  `);

  const brandIds = new Map<string, number>();

  for (const name of seedBrands) {
    const result = brandInsert.run(name, name.trim().toLowerCase(), now);
    brandIds.set(name, Number(result.lastInsertRowid));
  }

  const seedProducts = [
    {
      name: 'Чай травяной вечерний',
      category: 'tea',
      price: 690,
      brandName: 'Natura Tea',
      weightGrams: 100,
      tastes: ['травяной'],
      imageUrls: [],
    },
    {
      name: 'Чай цитрусовый заряд',
      category: 'tea',
      price: 740,
      brandName: 'Citrus Bar',
      weightGrams: 120,
      tastes: ['цитрусовый'],
      imageUrls: [],
    },
    {
      name: 'Чай ягодный микс',
      category: 'tea',
      price: 780,
      brandName: 'Berry Lab',
      weightGrams: 110,
      tastes: ['ягодный'],
      imageUrls: [],
    },
    {
      name: 'Сироп экзотический',
      category: 'syrups',
      price: 530,
      brandName: 'Exotic House',
      weightGrams: 250,
      tastes: ['экзотический'],
      imageUrls: [],
    },
    {
      name: 'Сироп ягодный двойной',
      category: 'syrups',
      price: 560,
      brandName: 'Berry Lab',
      weightGrams: 250,
      tastes: ['ягодный'],
      imageUrls: [],
    },
    {
      name: 'Додавка цитрусовая',
      category: 'additions',
      price: 250,
      brandName: 'Citrus Bar',
      weightGrams: 50,
      tastes: ['цитрусовый'],
      imageUrls: [],
    },
    {
      name: 'Додавка травяная',
      category: 'additions',
      price: 230,
      brandName: 'Natura Tea',
      weightGrams: 50,
      tastes: ['травяной'],
      imageUrls: [],
    },
    {
      name: 'Drink Kit Berry',
      category: 'drink_kits',
      price: 1290,
      brandName: 'Drink Mix',
      weightGrams: 420,
      tastes: ['ягодный', 'цитрусовый'],
      imageUrls: [],
    },
    {
      name: 'Drink Kit Exotic',
      category: 'drink_kits',
      price: 1350,
      brandName: 'Exotic House',
      weightGrams: 440,
      tastes: ['экзотический', 'слайдий'],
      imageUrls: [],
    },
  ];

  const insertTransaction = rawDb.transaction(() => {
    for (const item of seedProducts) {
      const brandId = brandIds.get(item.brandName);

      if (!brandId) {
        throw new Error(`Missing brand seed: ${item.brandName}`);
      }

      const productResult = productInsert.run(
        item.name,
        item.name.toLowerCase(),
        item.category,
        item.price,
        brandId,
        item.weightGrams,
        now,
        now,
      );

      const productId = Number(productResult.lastInsertRowid);

      item.tastes.forEach((taste, index) => {
        tasteInsert.run(productId, taste, index, now);
      });

      item.imageUrls.forEach((url, index) => {
        imageInsert.run(productId, url, index, now);
      });
    }
  });

  insertTransaction();
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
      title: 'Открытие обновлённого каталога',
      description:
        'Мы перевели магазин на чайную линейку: чаи, сиропы, добавки и готовые Drink Kits теперь доступны в каталоге.',
      activeUntil: null,
      createdAt: now - 1000 * 60 * 60 * 24 * 2,
    },
    {
      title: 'Новые вкусы уже в подборках',
      description:
        'Добавили фильтр по вкусу, чтобы было проще находить травяные, цитрусовые, ягодные и экзотические позиции.',
      activeUntil: now + 1000 * 60 * 60 * 24 * 14,
      createdAt: now - 1000 * 60 * 60 * 24,
    },
    {
      title: 'Вес теперь хранится у товара',
      description:
        'Для новых позиций можно указывать вес, а в карточках товара останутся только бренд, вкусы и базовая информация.',
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
  ensureProductWeightColumn();
  if (productCatalogNeedsRefresh()) {
    clearProductCatalog();
    seedProductCatalog();
    invalidatePopularProductsCache();
  }
  seedRootAdmin();
  seedNews();

  globalThis.__techMarketDatabaseInitialized__ = true;
}

initializeDatabase();

export * from '@/server/db/schema';
