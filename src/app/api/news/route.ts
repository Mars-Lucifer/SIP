import { NextResponse } from 'next/server';

import { listNews } from '@/server/catalog';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ items: listNews() });
  } catch (error) {
    return handleRouteError(error);
  }
}
