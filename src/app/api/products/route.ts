import { NextRequest, NextResponse } from 'next/server';

import { listProducts, parseProductFilters } from '@/server/catalog';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const query = parseProductFilters(request.nextUrl.searchParams);
    const result = listProducts(query);

    return NextResponse.json(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
