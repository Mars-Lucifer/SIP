import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';

import {
  brands,
  cartItems,
  db,
  orderItems,
  orders,
  productImages,
  products,
  reviews,
  users,
} from '@/server/db';
import { invalidatePopularProductsCache } from '@/server/catalog';
import { HttpError, requireNonEmptyString } from '@/server/http';

interface CheckoutPayload {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

function productImageExpression() {
  return sql<string | null>`(
    select ${productImages.url}
    from ${productImages}
    where ${productImages.productId} = ${products.id}
    order by ${productImages.sortOrder} asc, ${productImages.id} asc
    limit 1
  )`;
}

function validateCheckoutPayload(payload: CheckoutPayload) {
  return {
    fullName: requireNonEmptyString(payload.fullName, 'ФИО'),
    phone: requireNonEmptyString(payload.phone, 'Телефон'),
    email: requireNonEmptyString(payload.email, 'Электронная почта'),
    address: requireNonEmptyString(payload.address, 'Адрес доставки'),
  };
}

function mapOrderItems(orderIds: number[], userId?: number) {
  if (orderIds.length === 0) {
    return new Map<number, Array<Record<string, unknown>>>();
  }

  const rows = db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      name: orderItems.productName,
      price: orderItems.productPrice,
      category: orderItems.productCategory,
      brandName: orderItems.brandName,
      screenInches: orderItems.screenInches,
      processor: orderItems.processor,
      ramGb: orderItems.ramGb,
      storageGb: orderItems.storageGb,
      graphicsType: orderItems.graphicsType,
      graphicsModel: orderItems.graphicsModel,
      imageUrl: orderItems.imageUrl,
      createdAt: orderItems.createdAt,
    })
    .from(orderItems)
    .where(inArray(orderItems.orderId, orderIds))
    .orderBy(asc(orderItems.id))
    .all();

  const productIds = Array.from(
    new Set(
      rows
        .map((row) => row.productId)
        .filter((productId): productId is number => typeof productId === 'number'),
    ),
  );

  const reviewRatings =
    userId && productIds.length > 0
      ? new Map(
          db
            .select({
              productId: reviews.productId,
              rating: reviews.rating,
            })
            .from(reviews)
            .where(and(eq(reviews.userId, userId), inArray(reviews.productId, productIds)))
            .all()
            .map((review) => [review.productId, review.rating]),
        )
      : new Map<number, number>();

  const itemsByOrderId = new Map<number, Array<Record<string, unknown>>>();

  for (const row of rows) {
    const bucket = itemsByOrderId.get(row.orderId) ?? [];
    bucket.push({
      id: row.id,
      productId: row.productId,
      quantity: row.quantity,
      name: row.name,
      price: row.price,
      category: row.category,
      brandName: row.brandName,
      screenInches: row.screenInches,
      processor: row.processor,
      ramGb: row.ramGb,
      storageGb: row.storageGb,
      graphicsType: row.graphicsType,
      graphicsModel: row.graphicsModel,
      imageUrl: row.imageUrl,
      createdAt: row.createdAt,
      userRating: row.productId ? reviewRatings.get(row.productId) ?? null : null,
    });
    itemsByOrderId.set(row.orderId, bucket);
  }

  return itemsByOrderId;
}

function formatOrderRecord<
  TOrder extends {
    id: number;
    status: string;
    totalPrice: number;
    fullName: string;
    phone: string;
    email: string;
    address: string;
    createdAt: number;
    updatedAt: number;
  },
>(order: TOrder, itemsByOrderId: Map<number, Array<Record<string, unknown>>>) {
  return {
    id: order.id,
    status: order.status,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    payment: {
      fullName: order.fullName,
      phone: order.phone,
      email: order.email,
      address: order.address,
    },
    items: itemsByOrderId.get(order.id) ?? [],
  };
}

export function getCart(userId: number) {
  const imageExpression = productImageExpression();

  const items = db
    .select({
      productId: products.id,
      cartItemId: cartItems.id,
      quantity: cartItems.quantity,
      name: products.name,
      price: products.price,
      category: products.category,
      image: imageExpression.as('image'),
    })
    .from(cartItems)
    .innerJoin(products, eq(products.id, cartItems.productId))
    .where(eq(cartItems.userId, userId))
    .orderBy(desc(cartItems.updatedAt), desc(cartItems.id))
    .all();

  return {
    totalPrice: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    items,
  };
}

export function addProductToCart(userId: number, productId: number) {
  const product = db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, productId))
    .get();

  if (!product) {
    throw new HttpError(404, 'Товар не найден');
  }

  const existingCartItem = db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(sql`${cartItems.userId} = ${userId} and ${cartItems.productId} = ${productId}`)
    .get();

  if (existingCartItem) {
    db
      .update(cartItems)
      .set({
        quantity: existingCartItem.quantity + 1,
        updatedAt: Date.now(),
      })
      .where(eq(cartItems.id, existingCartItem.id))
      .run();
  } else {
    db.insert(cartItems).values({
      userId,
      productId,
      quantity: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }).run();
  }

  return getCart(userId);
}

export function removeProductFromCart(userId: number, productId: number) {
  const existingCartItem = db
    .select({
      id: cartItems.id,
    })
    .from(cartItems)
    .where(sql`${cartItems.userId} = ${userId} and ${cartItems.productId} = ${productId}`)
    .get();

  if (!existingCartItem) {
    throw new HttpError(404, 'Товар не найден в корзине');
  }

  db.delete(cartItems).where(eq(cartItems.id, existingCartItem.id)).run();

  return getCart(userId);
}

export function updateProductQuantityInCart(userId: number, productId: number, action: 'increment' | 'decrement') {
  const existingCartItem = db
    .select({
      id: cartItems.id,
      quantity: cartItems.quantity,
    })
    .from(cartItems)
    .where(sql`${cartItems.userId} = ${userId} and ${cartItems.productId} = ${productId}`)
    .get();

  if (!existingCartItem) {
    throw new HttpError(404, 'РўРѕРІР°СЂ РЅРµ РЅР°Р№РґРµРЅ РІ РєРѕСЂР·РёРЅРµ');
  }

  if (action === 'increment') {
    db
      .update(cartItems)
      .set({
        quantity: existingCartItem.quantity + 1,
        updatedAt: Date.now(),
      })
      .where(eq(cartItems.id, existingCartItem.id))
      .run();
  } else if (existingCartItem.quantity <= 1) {
    db.delete(cartItems).where(eq(cartItems.id, existingCartItem.id)).run();
  } else {
    db
      .update(cartItems)
      .set({
        quantity: existingCartItem.quantity - 1,
        updatedAt: Date.now(),
      })
      .where(eq(cartItems.id, existingCartItem.id))
      .run();
  }

  return getCart(userId);
}

export function saveOrderItemReview(userId: number, orderId: number, productId: number, rating: number) {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new HttpError(400, 'Оценка должна быть целым числом от 1 до 5');
  }

  const existingOrder = db
    .select({ id: orders.id })
    .from(orders)
    .where(sql`${orders.id} = ${orderId} and ${orders.userId} = ${userId}`)
    .get();

  if (!existingOrder) {
    throw new HttpError(404, 'Заказ не найден');
  }

  const existingOrderItem = db
    .select({
      productId: orderItems.productId,
    })
    .from(orderItems)
    .where(sql`${orderItems.orderId} = ${orderId} and ${orderItems.productId} = ${productId}`)
    .get();

  if (!existingOrderItem?.productId) {
    throw new HttpError(404, 'Товар не найден в заказе');
  }

  const existingReview = db
    .select({
      id: reviews.id,
    })
    .from(reviews)
    .where(sql`${reviews.userId} = ${userId} and ${reviews.productId} = ${productId}`)
    .get();

  if (existingReview) {
    db
      .update(reviews)
      .set({ rating })
      .where(eq(reviews.id, existingReview.id))
      .run();
  } else {
    db
      .insert(reviews)
      .values({
        productId,
        userId,
        rating,
        comment: null,
        createdAt: Date.now(),
      })
      .run();
  }

  return {
    productId,
    rating,
  };
}

export function checkout(userId: number, payload: CheckoutPayload) {
  const payment = validateCheckoutPayload(payload);
  const imageExpression = productImageExpression();

  const orderId = db.transaction((tx) => {
    const cartRows = tx
      .select({
        productId: products.id,
        quantity: cartItems.quantity,
        name: products.name,
        price: products.price,
        category: products.category,
        brandName: brands.name,
        screenInches: products.screenInches,
        processor: products.processor,
        ramGb: products.ramGb,
        storageGb: products.storageGb,
        graphicsType: products.graphicsType,
        graphicsModel: products.graphicsModel,
        imageUrl: imageExpression.as('image'),
      })
      .from(cartItems)
      .innerJoin(products, eq(products.id, cartItems.productId))
      .innerJoin(brands, eq(brands.id, products.brandId))
      .where(eq(cartItems.userId, userId))
      .all();

    if (cartRows.length === 0) {
      throw new HttpError(400, 'Корзина пуста');
    }

    const totalPrice = cartRows.reduce(
      (sum, cartRow) => sum + cartRow.price * cartRow.quantity,
      0,
    );
    const now = Date.now();

    const orderInsertResult = tx
      .insert(orders)
      .values({
        userId,
        status: 'pending',
        totalPrice,
        fullName: payment.fullName,
        phone: payment.phone,
        email: payment.email,
        address: payment.address,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const createdOrderId = Number(orderInsertResult.lastInsertRowid);

    tx.insert(orderItems).values(
      cartRows.map((cartRow) => ({
        orderId: createdOrderId,
        productId: cartRow.productId,
        quantity: cartRow.quantity,
        productName: cartRow.name,
        productPrice: cartRow.price,
        productCategory: cartRow.category,
        brandName: cartRow.brandName,
        screenInches: cartRow.screenInches,
        processor: cartRow.processor,
        ramGb: cartRow.ramGb,
        storageGb: cartRow.storageGb,
        graphicsType: cartRow.graphicsType,
        graphicsModel: cartRow.graphicsModel,
        imageUrl: cartRow.imageUrl,
        createdAt: now,
      })),
    ).run();

    tx.delete(cartItems).where(eq(cartItems.userId, userId)).run();

    return createdOrderId;
  });

  invalidatePopularProductsCache();

  return getUserOrder(userId, orderId);
}

export function listUserOrders(userId: number) {
  const orderRows = db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      fullName: orders.fullName,
      phone: orders.phone,
      email: orders.email,
      address: orders.address,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .all();

  const itemsByOrderId = mapOrderItems(orderRows.map((orderRow) => orderRow.id), userId);

  return orderRows.map((orderRow) => formatOrderRecord(orderRow, itemsByOrderId));
}

export function getUserOrder(userId: number, orderId: number) {
  const orderRow = db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      fullName: orders.fullName,
      phone: orders.phone,
      email: orders.email,
      address: orders.address,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .where(sql`${orders.id} = ${orderId} and ${orders.userId} = ${userId}`)
    .get();

  if (!orderRow) {
    throw new HttpError(404, 'Заказ не найден');
  }

  const itemsByOrderId = mapOrderItems([orderId], userId);

  return formatOrderRecord(orderRow, itemsByOrderId);
}

export function listAdminOrders() {
  const orderRows = db
    .select({
      id: orders.id,
      status: orders.status,
      totalPrice: orders.totalPrice,
      fullName: orders.fullName,
      phone: orders.phone,
      email: orders.email,
      address: orders.address,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      userId: users.id,
      userLogin: users.login,
      userName: users.name,
    })
    .from(orders)
    .innerJoin(users, eq(users.id, orders.userId))
    .orderBy(desc(orders.createdAt), desc(orders.id))
    .all();

  const itemsByOrderId = mapOrderItems(orderRows.map((orderRow) => orderRow.id));

  return orderRows.map((orderRow) => ({
    ...formatOrderRecord(orderRow, itemsByOrderId),
    user: {
      id: orderRow.userId,
      login: orderRow.userLogin,
      name: orderRow.userName,
    },
  }));
}

export function markOrderAsShipped(orderId: number) {
  const existingOrder = db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .get();

  if (!existingOrder) {
    throw new HttpError(404, 'Заказ не найден');
  }

  const updatedAt = Date.now();

  db
    .update(orders)
    .set({
      status: 'shipped',
      updatedAt,
    })
    .where(eq(orders.id, orderId))
    .run();

  const itemsByOrderId = mapOrderItems([orderId]);

  return formatOrderRecord(
    {
      id: existingOrder.id,
      status: 'shipped',
      totalPrice: existingOrder.totalPrice,
      fullName: existingOrder.fullName,
      phone: existingOrder.phone,
      email: existingOrder.email,
      address: existingOrder.address,
      createdAt: existingOrder.createdAt,
      updatedAt,
    },
    itemsByOrderId,
  );
}
