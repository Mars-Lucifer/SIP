import { NextRequest, NextResponse } from 'next/server';

import { requireAuthenticatedUser } from '@/server/auth';
import { checkout } from '@/server/orders';
import { handleRouteError, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface CheckoutBody {
  fullName: string;
  phone: string;
  email: string;
  address: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = requireAuthenticatedUser(request);
    const body = await readJson<CheckoutBody>(request);

    return NextResponse.json({ order: checkout(user.id, body) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
