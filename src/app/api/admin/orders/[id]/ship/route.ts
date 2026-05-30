import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { markOrderAsShipped } from '@/server/orders';
import { handleRouteError, parsePositiveInteger } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    requireAdminUser(request);
    const { id } = await context.params;

    return NextResponse.json({
      order: markOrderAsShipped(parsePositiveInteger(id, 'ID заказа')),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
