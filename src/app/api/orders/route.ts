import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { listUserOrders } from '@/server/orders';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthenticatedUser(request);

    return NextResponse.json({ items: listUserOrders(user.id) });
  } catch (error) {
    return handleRouteError(error);
  }
}
