import { NextResponse } from 'next/server';

import { createSession, loginUser, setSessionCookie } from '@/server/auth';
import { handleRouteError, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface LoginBody {
  login: string;
  password: string;
}

export async function POST(request: Request) {
  try {
    const body = await readJson<LoginBody>(request);
    const user = loginUser(body);
    const session = createSession(user.id);
    const response = NextResponse.json({ user });

    setSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
