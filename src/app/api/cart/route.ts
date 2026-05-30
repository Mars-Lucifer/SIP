import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { getCart } from '@/server/orders';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = requireAuthenticatedUser(request);

    return NextResponse.json(getCart(user.id));
  } catch (error) {
    return handleRouteError(error);
  }
}
