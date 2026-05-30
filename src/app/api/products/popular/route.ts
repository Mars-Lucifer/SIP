import { NextRequest, NextResponse } from 'next/server';

import { getPopularCategory, getPopularProducts } from '@/server/catalog';
import { HttpError, handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const category = request.nextUrl.searchParams.get('category');

    if (!category) {
      throw new HttpError(400, 'Параметр category обязателен');
    }

    return NextResponse.json(getPopularProducts(getPopularCategory(category)));
  } catch (error) {
    return handleRouteError(error);
  }
}
