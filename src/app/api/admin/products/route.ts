import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { createProduct } from '@/server/catalog';
import { handleRouteError, readJson } from '@/server/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    requireAdminUser(request);
    const body = await readJson(request);

    return NextResponse.json({ item: createProduct(body) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
