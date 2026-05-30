import { NextRequest, NextResponse } from 'next/server';

import { getUserFromRequest } from '@/server/auth';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
