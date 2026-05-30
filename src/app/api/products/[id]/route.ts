import { NextResponse } from 'next/server';

import { getProductById } from '@/server/catalog';
import { HttpError, handleRouteError, parsePositiveInteger } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const product = getProductById(parsePositiveInteger(id, 'ID товара'));

    if (!product) {
      throw new HttpError(404, 'Товар не найден');
    }

    return NextResponse.json({ item: product });
  } catch (error) {
    return handleRouteError(error);
  }
}
