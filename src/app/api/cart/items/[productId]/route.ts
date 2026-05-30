import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { removeProductFromCart, updateProductQuantityInCart } from '@/server/orders';
import { handleRouteError, HttpError, parsePositiveInteger, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ productId: string }>;
}

interface UpdateCartItemBody {
  action: 'increment' | 'decrement';
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = requireAuthenticatedUser(request);
    const { productId } = await context.params;
    const body = await readJson<UpdateCartItemBody>(request);

    if (body.action !== 'increment' && body.action !== 'decrement') {
      throw new HttpError(400, 'Некорректное действие корзины');
    }

    return NextResponse.json(
      updateProductQuantityInCart(
        user.id,
        parsePositiveInteger(productId, 'ID С‚РѕРІР°СЂР°'),
        body.action,
      ),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const user = requireAuthenticatedUser(request);
    const { productId } = await context.params;

    return NextResponse.json(
      removeProductFromCart(user.id, parsePositiveInteger(productId, 'ID товара')),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
