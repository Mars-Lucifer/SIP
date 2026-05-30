import { SQL, and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import {
  CATALOG_SORT_VALUES,
  CatalogSortValue,
  GRAPHICS_TYPES,
  GraphicsType,
  POPULAR_PRODUCT_CATEGORIES,
  POPULAR_PRODUCTS_TTL_MS,
  PopularProductCategory,
  PROCESSOR_TYPES,
  ProcessorType,
  PRODUCT_CATEGORIES,
  ProductCategory,
} from '@/server/constants';
import {
  brands,
  db,
  news,
  orderItems,
  popularProductsCache,
  productImages,
  products,
  reviews,
} from '@/server/db';
import {
  HttpError,
  normalizeForSearch,
  optionalTrimmedString,
  parseOptionalPositiveInteger,
  parseOptionalPositiveNumber,
  parsePositiveInteger,
  requireNonEmptyString,
} from '@/server/http';

interface ProductQuery {
  category?: ProductCategory;
  sort?: CatalogSortValue;
  priceFrom?: number | null;
  priceTo?: number | null;
  brandNames?: string[];
  screenFrom?: number | null;
  screenTo?: number | null;
  processor?: ProcessorType;
  ramFrom?: number | null;
  ramTo?: number | null;
  storageFrom?: number | null;
  storageTo?: number | null;
  graphicsType?: GraphicsType;
  search?: string;
  limit?: number;
}

interface ProductPayload {
  name: string;
  category: ProductCategory;
  price: number;
  brandName: string;
  screenInches: number | null;
  processor: ProcessorType | null;
  ramGb: number | null;
  storageGb: number | null;
  graphicsType: GraphicsType;
  graphicsModel: string | null;
  imageUrls: string[];
}

type PartialProductPayload = Partial<ProductPayload>;

const PRODUCT_CATEGORY_SET = new Set<string>(PRODUCT_CATEGORIES);
const PROCESSOR_TYPE_SET = new Set<string>(PROCESSOR_TYPES);
const GRAPHICS_TYPE_SET = new Set<string>(GRAPHICS_TYPES);
const CATALOG_SORT_SET = new Set<string>(CATALOG_SORT_VALUES);
const POPULAR_CATEGORY_SET = new Set<string>(POPULAR_PRODUCT_CATEGORIES);

function categorySupportsScreen(category: ProductCategory) {
  return category === 'laptop';
}

function normalizeBrandName(name: string) {
  return name.trim().replace(/\s+/g, ' ');
}

function normalizeBrandKey(name: string) {
  return normalizeBrandName(name).toLowerCase();
}

function productSelectFields() {
  const imageExpression = sql<string | null>`(
    select ${productImages.url}
    from ${productImages}
    where ${productImages.productId} = ${products.id}
    order by ${productImages.sortOrder} asc, ${productImages.id} asc
    limit 1
  )`;

  const ratingExpression = sql<number>`coalesce(
    cast(round((
      select avg(${reviews.rating})
      from ${reviews}
      where ${reviews.productId} = ${products.id}
    )) as integer),
    0
  )`;

  const reviewCountExpression = sql<number>`coalesce((
    select count(*)
    from ${reviews}
    where ${reviews.productId} = ${products.id}
  ), 0)`;

  const orderCountExpression = sql<number>`coalesce((
    select sum(${orderItems.quantity})
    from ${orderItems}
    where ${orderItems.productId} = ${products.id}
  ), 0)`;

  return {
    imageExpression,
    ratingExpression,
    reviewCountExpression,
    orderCountExpression,
  };
}

function ensureCategory(value: unknown, fieldName: string): ProductCategory {
  if (typeof value !== 'string' || !PRODUCT_CATEGORY_SET.has(value)) {
    throw new HttpError(400, `${fieldName} указана некорректно`);
  }

  return value as ProductCategory;
}

function ensureProcessor(value: unknown, fieldName: string): ProcessorType {
  if (typeof value !== 'string' || !PROCESSOR_TYPE_SET.has(value)) {
    throw new HttpError(400, `${fieldName} указан некорректно`);
  }

  return value as ProcessorType;
}

function ensureGraphicsType(value: unknown, fieldName: string): GraphicsType {
  if (typeof value !== 'string' || !GRAPHICS_TYPE_SET.has(value)) {
    throw new HttpError(400, `${fieldName} указан некорректно`);
  }

  return value as GraphicsType;
}

function ensureSort(value: unknown): CatalogSortValue {
  if (typeof value !== 'string' || !CATALOG_SORT_SET.has(value)) {
    throw new HttpError(400, 'Некорректная сортировка');
  }

  return value as CatalogSortValue;
}

function parseImageUrls(value: unknown, isPartial: boolean) {
  if (value === undefined) {
    return isPartial ? undefined : [];
  }

  if (value === null) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(400, 'Список изображений должен быть массивом строк');
  }

  if (value.length > 10) {
    throw new HttpError(400, 'Можно передать не больше 10 изображений');
  }

  return value.map((item) => {
    if (typeof item !== 'string') {
      throw new HttpError(400, 'Каждое изображение должно быть строкой');
    }

    const url = item.trim();

    if (!url) {
      throw new HttpError(400, 'Пустые ссылки на изображения запрещены');
    }

    return url;
  });
}

function parseProductPayload(input: unknown, isPartial: boolean): PartialProductPayload {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new HttpError(400, 'Тело запроса должно быть объектом');
  }

  const source = input as Record<string, unknown>;
  const payload: PartialProductPayload = {};

  if (!isPartial || 'name' in source) {
    const name = requireNonEmptyString(source.name, 'Название товара');

    if (name.length > 200) {
      throw new HttpError(400, 'Название товара не должно быть длиннее 200 символов');
    }

    payload.name = name;
  }

  if (!isPartial || 'category' in source) {
    payload.category = ensureCategory(source.category, 'Категория');
  }

  if (!isPartial || 'price' in source) {
    payload.price = parsePositiveInteger(source.price, 'Цена');
  }

  if (!isPartial || 'brandName' in source) {
    payload.brandName = normalizeBrandName(requireNonEmptyString(source.brandName, 'Бренд'));
  }

  if (!isPartial || 'screenInches' in source) {
    payload.screenInches = parseOptionalPositiveNumber(source.screenInches, 'Диагональ');
  }

  if (!isPartial || 'processor' in source) {
    const processor = optionalTrimmedString(source.processor);
    payload.processor = processor ? ensureProcessor(processor, 'Процессор') : null;
  }

  if (!isPartial || 'ramGb' in source) {
    payload.ramGb = parseOptionalPositiveInteger(source.ramGb, 'ОЗУ');
  }

  if (!isPartial || 'storageGb' in source) {
    payload.storageGb = parseOptionalPositiveInteger(source.storageGb, 'Накопитель');
  }

  if (!isPartial || 'graphicsType' in source) {
    payload.graphicsType = ensureGraphicsType(source.graphicsType, 'Тип видеокарты');
  }

  if (!isPartial || 'graphicsModel' in source) {
    payload.graphicsModel = optionalTrimmedString(source.graphicsModel);
  }

  const imageUrls = parseImageUrls(source.imageUrls, isPartial);
  if (imageUrls !== undefined) {
    payload.imageUrls = imageUrls;
  }

  return payload;
}

function validateCompleteProduct(payload: ProductPayload) {
  if (!categorySupportsScreen(payload.category)) {
    payload.screenInches = null;
  }

  if (payload.graphicsType === 'discrete' && !payload.graphicsModel) {
    throw new HttpError(400, 'Для дискретной видеокарты требуется указать ее название');
  }

  if (payload.graphicsType === 'integrated') {
    payload.graphicsModel = null;
  }
}

function mergeProductState(current: ProductPayload, patch: PartialProductPayload) {
  const merged: ProductPayload = {
    ...current,
    ...patch,
    imageUrls: patch.imageUrls ?? current.imageUrls,
    graphicsModel:
      patch.graphicsType === 'integrated'
        ? null
        : patch.graphicsModel === undefined
          ? current.graphicsModel
          : patch.graphicsModel,
  };

  validateCompleteProduct(merged);

  return merged;
}

function getBrandIdByName(name: string) {
  const normalizedName = normalizeBrandKey(name);

  const existingBrand = db
    .select({ id: brands.id })
    .from(brands)
    .where(eq(brands.nameNormalized, normalizedName))
    .get();

  if (existingBrand) {
    return existingBrand.id;
  }

  const insertResult = db.insert(brands).values({
    name: normalizeBrandName(name),
    nameNormalized: normalizedName,
    createdAt: Date.now(),
  }).run();

  return Number(insertResult.lastInsertRowid);
}

function buildWhereConditions(query: ProductQuery) {
  const filters: SQL[] = [];

  if (query.category) {
    filters.push(eq(products.category, query.category));
  }

  if (query.priceFrom !== undefined && query.priceFrom !== null) {
    filters.push(sql`${products.price} >= ${query.priceFrom}`);
  }

  if (query.priceTo !== undefined && query.priceTo !== null) {
    filters.push(sql`${products.price} <= ${query.priceTo}`);
  }

  if (query.screenFrom !== undefined && query.screenFrom !== null) {
    filters.push(sql`${products.screenInches} >= ${query.screenFrom}`);
  }

  if (query.screenTo !== undefined && query.screenTo !== null) {
    filters.push(sql`${products.screenInches} <= ${query.screenTo}`);
  }

  if (query.processor) {
    filters.push(eq(products.processor, query.processor));
  }

  if (query.ramFrom !== undefined && query.ramFrom !== null) {
    filters.push(sql`${products.ramGb} >= ${query.ramFrom}`);
  }

  if (query.ramTo !== undefined && query.ramTo !== null) {
    filters.push(sql`${products.ramGb} <= ${query.ramTo}`);
  }

  if (query.storageFrom !== undefined && query.storageFrom !== null) {
    filters.push(sql`${products.storageGb} >= ${query.storageFrom}`);
  }

  if (query.storageTo !== undefined && query.storageTo !== null) {
    filters.push(sql`${products.storageGb} <= ${query.storageTo}`);
  }

  if (query.graphicsType) {
    filters.push(eq(products.graphicsType, query.graphicsType));
  }

  if (query.search) {
    const preparedSearch = normalizeForSearch(query.search);

    if (preparedSearch.length > 100) {
      throw new HttpError(400, 'Поисковый запрос не должен быть длиннее 100 символов');
    }

    filters.push(sql`${products.nameSearch} like ${`%${preparedSearch}%`}`);
  }

  if (query.brandNames && query.brandNames.length > 0) {
    const normalizedBrands = Array.from(
      new Set(query.brandNames.map((brandName) => normalizeBrandKey(brandName)).filter(Boolean)),
    );

    if (normalizedBrands.length > 0) {
      const brandRows = db
        .select({ id: brands.id })
        .from(brands)
        .where(inArray(brands.nameNormalized, normalizedBrands))
        .all();

      if (brandRows.length === 0) {
        filters.push(sql`1 = 0`);
      } else {
        filters.push(inArray(products.brandId, brandRows.map((brandRow) => brandRow.id)));
      }
    }
  }

  return filters.length > 0 ? and(...filters) : undefined;
}

function orderProductQuery(
  sort: CatalogSortValue,
  ratingExpression: SQL,
  reviewCountExpression: SQL,
  orderCountExpression: SQL,
) {
  switch (sort) {
    case 'rating':
      return [desc(ratingExpression), desc(reviewCountExpression), asc(products.id)];
    case 'price_asc':
      return [asc(products.price), asc(products.id)];
    case 'price_desc':
      return [desc(products.price), asc(products.id)];
    case 'popular':
    default:
      return [desc(orderCountExpression), desc(ratingExpression), asc(products.id)];
  }
}

export function listNews() {
  cleanupExpiredNews();

  return db
    .select({
      id: news.id,
      title: news.title,
      description: news.description,
      activeUntil: news.activeUntil,
      createdAt: news.createdAt,
    })
    .from(news)
    .orderBy(desc(news.createdAt))
    .all();
}

export function createNews(input: unknown) {
  const payload = parseNewsPayload(input);
  const now = Date.now();

  const insertResult = db
    .insert(news)
    .values({
      title: payload.title,
      description: payload.description,
      activeUntil: payload.activeUntil,
      createdAt: now,
    })
    .run();

  return db
    .select({
      id: news.id,
      title: news.title,
      description: news.description,
      activeUntil: news.activeUntil,
      createdAt: news.createdAt,
    })
    .from(news)
    .where(eq(news.id, Number(insertResult.lastInsertRowid)))
    .get();
}

export function deleteNews(newsId: number) {
  cleanupExpiredNews();

  const existingNews = db
    .select({ id: news.id })
    .from(news)
    .where(eq(news.id, newsId))
    .get();

  if (!existingNews) {
    throw new HttpError(404, 'Новость не найдена');
  }

  db.delete(news).where(eq(news.id, newsId)).run();
}

function cleanupExpiredNews() {
  db.delete(news).where(sql`${news.activeUntil} is not null and ${news.activeUntil} <= ${Date.now()}`).run();
}

function parseNewsPayload(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new HttpError(400, 'Некорректные данные новости');
  }

  const payload = input as Record<string, unknown>;
  const title = requireNonEmptyString(payload.title, 'Название новости');
  const description = requireNonEmptyString(payload.description, 'Описание новости');
  const activeUntilRaw = payload.activeUntil;

  let activeUntil: number | null = null;

  if (activeUntilRaw !== undefined && activeUntilRaw !== null && activeUntilRaw !== '') {
    const parsedDate =
      typeof activeUntilRaw === 'number'
        ? activeUntilRaw
        : typeof activeUntilRaw === 'string'
          ? Date.parse(activeUntilRaw)
          : Number.NaN;

    if (!Number.isFinite(parsedDate)) {
      throw new HttpError(400, 'Дата окончания новости указана некорректно');
    }

    if (parsedDate <= Date.now()) {
      throw new HttpError(400, 'Дата окончания новости должна быть позже текущего времени');
    }

    activeUntil = parsedDate;
  }

  return {
    title,
    description,
    activeUntil,
  };
}

export function listBrands() {
  return db
    .select({
      id: brands.id,
      name: brands.name,
    })
    .from(brands)
    .orderBy(asc(brands.name))
    .all();
}

export function listProducts(query: ProductQuery = {}) {
  const { imageExpression, ratingExpression, reviewCountExpression, orderCountExpression } =
    productSelectFields();

  const whereClause = buildWhereConditions(query);
  const sort = query.sort ?? 'popular';

  const baseProductQuery = db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      category: products.category,
      brandId: brands.id,
      brandName: brands.name,
      screenInches: products.screenInches,
      processor: products.processor,
      ramGb: products.ramGb,
      storageGb: products.storageGb,
      graphicsType: products.graphicsType,
      graphicsModel: products.graphicsModel,
      image: imageExpression.as('image'),
      rating: ratingExpression.as('rating'),
      reviewCount: reviewCountExpression.as('reviewCount'),
      orderCount: orderCountExpression.as('orderCount'),
    })
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId));

  const filteredProductQuery = whereClause
    ? baseProductQuery.where(whereClause)
    : baseProductQuery;

  const orderedProductQuery = filteredProductQuery.orderBy(
    ...orderProductQuery(sort, ratingExpression, reviewCountExpression, orderCountExpression),
  );

  const finalProductQuery =
    query.limit !== undefined
      ? orderedProductQuery.limit(query.limit)
      : orderedProductQuery;

  const baseCountQuery = db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(products);

  const finalCountQuery = whereClause ? baseCountQuery.where(whereClause) : baseCountQuery;

  const countRow = finalCountQuery.get();

  return {
    total: countRow?.count ?? 0,
    items: finalProductQuery.all(),
  };
}

export function getProductById(productId: number) {
  const { imageExpression, ratingExpression, reviewCountExpression, orderCountExpression } =
    productSelectFields();

  const item = db
    .select({
      id: products.id,
      name: products.name,
      price: products.price,
      category: products.category,
      brandId: brands.id,
      brandName: brands.name,
      screenInches: products.screenInches,
      processor: products.processor,
      ramGb: products.ramGb,
      storageGb: products.storageGb,
      graphicsType: products.graphicsType,
      graphicsModel: products.graphicsModel,
      createdAt: products.createdAt,
      updatedAt: products.updatedAt,
      image: imageExpression.as('image'),
      rating: ratingExpression.as('rating'),
      reviewCount: reviewCountExpression.as('reviewCount'),
      orderCount: orderCountExpression.as('orderCount'),
    })
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId))
    .where(eq(products.id, productId))
    .get();

  if (!item) {
    return null;
  }

  const images = db
    .select({
      id: productImages.id,
      url: productImages.url,
      sortOrder: productImages.sortOrder,
    })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id))
    .all();

  return {
    ...item,
    images: images.map((image) => image.url),
  };
}

function getProductStateById(productId: number) {
  const productRow = db
    .select({
      id: products.id,
      name: products.name,
      category: products.category,
      price: products.price,
      brandName: brands.name,
      screenInches: products.screenInches,
      processor: products.processor,
      ramGb: products.ramGb,
      storageGb: products.storageGb,
      graphicsType: products.graphicsType,
      graphicsModel: products.graphicsModel,
    })
    .from(products)
    .innerJoin(brands, eq(brands.id, products.brandId))
    .where(eq(products.id, productId))
    .get();

  if (!productRow) {
    return null;
  }

  const images = db
    .select({ url: productImages.url })
    .from(productImages)
    .where(eq(productImages.productId, productId))
    .orderBy(asc(productImages.sortOrder), asc(productImages.id))
    .all()
    .map((image) => image.url);

  return {
    name: productRow.name,
    category: productRow.category,
    price: productRow.price,
    brandName: productRow.brandName,
    screenInches: productRow.screenInches,
    processor: productRow.processor,
    ramGb: productRow.ramGb,
    storageGb: productRow.storageGb,
    graphicsType: productRow.graphicsType,
    graphicsModel: productRow.graphicsModel,
    imageUrls: images,
  } satisfies ProductPayload;
}

export function createProduct(input: unknown) {
  const payload = parseProductPayload(input, false) as ProductPayload;
  validateCompleteProduct(payload);

  const now = Date.now();
  const brandId = getBrandIdByName(payload.brandName);

  const insertResult = db.insert(products).values({
    name: payload.name,
    nameSearch: normalizeForSearch(payload.name),
    category: payload.category,
    price: payload.price,
    brandId,
    screenInches: payload.screenInches,
    processor: payload.processor,
    ramGb: payload.ramGb,
    storageGb: payload.storageGb,
    graphicsType: payload.graphicsType,
    graphicsModel: payload.graphicsType === 'discrete' ? payload.graphicsModel : null,
    createdAt: now,
    updatedAt: now,
  }).run();

  const productId = Number(insertResult.lastInsertRowid);

  if (payload.imageUrls.length > 0) {
    db.insert(productImages).values(
      payload.imageUrls.map((url, index) => ({
        productId,
        url,
        sortOrder: index,
        createdAt: now,
      })),
    ).run();
  }

  invalidatePopularProductsCache();

  return getProductById(productId);
}

export function updateProduct(productId: number, input: unknown) {
  const currentProduct = getProductStateById(productId);

  if (!currentProduct) {
    throw new HttpError(404, 'Товар не найден');
  }

  const patch = parseProductPayload(input, true);
  const nextState = mergeProductState(currentProduct, patch);
  const brandId = getBrandIdByName(nextState.brandName);

  db.update(products).set({
    name: nextState.name,
    nameSearch: normalizeForSearch(nextState.name),
    category: nextState.category,
    price: nextState.price,
    brandId,
    screenInches: nextState.screenInches,
    processor: nextState.processor,
    ramGb: nextState.ramGb,
    storageGb: nextState.storageGb,
    graphicsType: nextState.graphicsType,
    graphicsModel: nextState.graphicsType === 'discrete' ? nextState.graphicsModel : null,
    updatedAt: Date.now(),
  }).where(eq(products.id, productId)).run();

  if (patch.imageUrls !== undefined) {
    db.delete(productImages).where(eq(productImages.productId, productId)).run();

    if (patch.imageUrls.length > 0) {
      db.insert(productImages).values(
        patch.imageUrls.map((url, index) => ({
          productId,
          url,
          sortOrder: index,
          createdAt: Date.now(),
        })),
      ).run();
    }
  }

  invalidatePopularProductsCache();

  return getProductById(productId);
}

export function deleteProduct(productId: number) {
  const existingProduct = db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!existingProduct) {
    throw new HttpError(404, 'Товар не найден');
  }

  db.delete(products).where(eq(products.id, productId)).run();
  invalidatePopularProductsCache();
}

export function invalidatePopularProductsCache() {
  db.delete(popularProductsCache).run();
}

function queryPopularCandidates(popularCategory: PopularProductCategory) {
  switch (popularCategory) {
    case 'work_laptops':
      return listProducts({
        category: 'laptop',
        graphicsType: 'integrated',
        sort: 'popular',
        limit: 12,
      }).items;
    case 'gaming_laptops':
      return listProducts({
        category: 'laptop',
        graphicsType: 'discrete',
        sort: 'popular',
        limit: 12,
      }).items;
    case 'mini_pc':
      return listProducts({
        category: 'mini_pc',
        sort: 'popular',
        limit: 12,
      }).items;
  }
}

export function rebuildPopularProductsCache(force = false) {
  const latestCache = db
    .select({
      calculatedAt: sql<number>`max(${popularProductsCache.calculatedAt})`,
    })
    .from(popularProductsCache)
    .get();

  const now = Date.now();
  const isFresh =
    latestCache?.calculatedAt !== null &&
    latestCache?.calculatedAt !== undefined &&
    latestCache.calculatedAt > now - POPULAR_PRODUCTS_TTL_MS;

  if (!force && isFresh) {
    return latestCache.calculatedAt;
  }

  const preparedCacheRows = POPULAR_PRODUCT_CATEGORIES.flatMap((popularCategory) => {
    const candidates = queryPopularCandidates(popularCategory)
      .sort((left, right) => {
        if (right.rating !== left.rating) {
          return right.rating - left.rating;
        }

        if (right.orderCount !== left.orderCount) {
          return right.orderCount - left.orderCount;
        }

        return left.id - right.id;
      })
      .slice(0, 8);

    return candidates.map((candidate, index) => ({
      popularCategory,
      productId: candidate.id,
      position: index,
      calculatedAt: now,
    }));
  });

  db.delete(popularProductsCache).run();

  if (preparedCacheRows.length > 0) {
    db.insert(popularProductsCache).values(preparedCacheRows).run();
  }

  return now;
}

export function getPopularCategory(value: string) {
  if (!POPULAR_CATEGORY_SET.has(value)) {
    throw new HttpError(400, 'Некорректная категория популярных товаров');
  }

  return value as PopularProductCategory;
}

export function getPopularProducts(popularCategory: PopularProductCategory) {
  rebuildPopularProductsCache();

  const cacheRows = db
    .select({
      productId: popularProductsCache.productId,
      position: popularProductsCache.position,
      calculatedAt: popularProductsCache.calculatedAt,
    })
    .from(popularProductsCache)
    .where(eq(popularProductsCache.popularCategory, popularCategory))
    .orderBy(asc(popularProductsCache.position))
    .all();

  const items = cacheRows
    .map((cacheRow) => getProductById(cacheRow.productId))
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  return {
    calculatedAt: cacheRows[0]?.calculatedAt ?? null,
    items,
  };
}

export function parseProductFilters(searchParams: URLSearchParams): ProductQuery {
  const category = searchParams.get('category');
  const sort = searchParams.get('sort');
  const processor = searchParams.get('processor');
  const graphicsType = searchParams.get('graphicsType');
  const search = searchParams.get('search');
  const brandNames = searchParams.getAll('brand');
  const parsedCategory = category ? ensureCategory(category, 'Категория') : undefined;
  const allowScreenFilters = !parsedCategory || categorySupportsScreen(parsedCategory);

  return {
    category: parsedCategory,
    sort: sort ? ensureSort(sort) : 'popular',
    priceFrom: parseOptionalPositiveInteger(searchParams.get('priceFrom'), 'Цена от') ?? undefined,
    priceTo: parseOptionalPositiveInteger(searchParams.get('priceTo'), 'Цена до') ?? undefined,
    brandNames,
    screenFrom: allowScreenFilters
      ? parseOptionalPositiveNumber(searchParams.get('screenFrom'), 'Диагональ от') ?? undefined
      : undefined,
    screenTo: allowScreenFilters
      ? parseOptionalPositiveNumber(searchParams.get('screenTo'), 'Диагональ до') ?? undefined
      : undefined,
    processor: processor ? ensureProcessor(processor, 'Процессор') : undefined,
    ramFrom: parseOptionalPositiveInteger(searchParams.get('ramFrom'), 'ОЗУ от') ?? undefined,
    ramTo: parseOptionalPositiveInteger(searchParams.get('ramTo'), 'ОЗУ до') ?? undefined,
    storageFrom:
      parseOptionalPositiveInteger(searchParams.get('storageFrom'), 'Память от') ?? undefined,
    storageTo:
      parseOptionalPositiveInteger(searchParams.get('storageTo'), 'Память до') ?? undefined,
    graphicsType: graphicsType ? ensureGraphicsType(graphicsType, 'Видеокарта') : undefined,
    search: search ? normalizeForSearch(search) : undefined,
  };
}
