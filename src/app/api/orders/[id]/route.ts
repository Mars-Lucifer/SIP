import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { getUserOrder } from '@/server/orders';
import { handleRouteError, parsePositiveInteger } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = requireAuthenticatedUser(request);
    const { id } = await context.params;

    return NextResponse.json({
      order: getUserOrder(user.id, parsePositiveInteger(id, 'ID заказа')),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
