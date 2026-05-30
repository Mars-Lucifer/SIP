import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { addProductToCart } from '@/server/orders';
import { handleRouteError, parsePositiveInteger, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface AddCartItemBody {
  productId: number;
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthenticatedUser(request);
    const body = await readJson<AddCartItemBody>(request);

    return NextResponse.json(addProductToCart(user.id, parsePositiveInteger(body.productId, 'ID товара')));
  } catch (error) {
    return handleRouteError(error);
  }
}
