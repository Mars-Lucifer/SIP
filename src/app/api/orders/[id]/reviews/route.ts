import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { saveOrderItemReview } from '@/server/orders';
import { handleRouteError, parsePositiveInteger, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ReviewBody {
  productId: number;
  rating: number;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = requireAuthenticatedUser(request);
    const { id } = await context.params;
    const body = await readJson<ReviewBody>(request);

    return NextResponse.json({
      review: saveOrderItemReview(
        user.id,
        parsePositiveInteger(id, 'ID заказа'),
        parsePositiveInteger(body.productId, 'ID товара'),
        body.rating,
      ),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
