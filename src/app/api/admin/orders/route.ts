import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { listAdminOrders } from '@/server/orders';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    requireAdminUser(request);

    return NextResponse.json({ items: listAdminOrders() });
  } catch (error) {
    return handleRouteError(error);
  }
}
