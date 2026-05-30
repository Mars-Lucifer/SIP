import { NextResponse } from 'next/server';

import { listBrands } from '@/server/catalog';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET() {
  try {
    return NextResponse.json({ items: listBrands() });
  } catch (error) {
    return handleRouteError(error);
  }
}
