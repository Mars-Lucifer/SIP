import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { deleteProduct, getProductById, updateProduct } from '@/server/catalog';
import { HttpError, handleRouteError, parsePositiveInteger, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    requireAdminUser(request);
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

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    requireAdminUser(request);
    const { id } = await context.params;
    const body = await readJson(request);

    return NextResponse.json({
      item: updateProduct(parsePositiveInteger(id, 'ID товара'), body),
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    requireAdminUser(request);
    const { id } = await context.params;

    deleteProduct(parsePositiveInteger(id, 'ID товара'));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
