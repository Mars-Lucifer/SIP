import { NextRequest, NextResponse } from 'next/server';

import { clearSessionCookie, deleteSessionByToken } from '@/server/auth';
import { handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('tech_market_session')?.value;
    const response = NextResponse.json({ success: true });

    if (token) {
      deleteSessionByToken(token);
    }

    clearSessionCookie(response);

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
