import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { createNews, listNews } from '@/server/catalog';
import { handleRouteError, readJson } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    requireAdminUser(request);

    return NextResponse.json({ items: listNews() });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdminUser(request);
    const body = await readJson(request);

    return NextResponse.json({ item: createNews(body) }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
