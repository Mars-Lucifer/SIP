import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { deleteNews } from '@/server/catalog';
import { handleRouteError, parsePositiveInteger } from '@/server/http';

export const runtime = 'nodejs';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    requireAdminUser(request);
    const { id } = await context.params;

    deleteNews(parsePositiveInteger(id, 'ID новости'));

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
