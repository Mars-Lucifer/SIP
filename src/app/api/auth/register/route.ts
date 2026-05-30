import { NextResponse } from 'next/server';

import { createSession, registerUser, setSessionCookie } from '@/server/auth';
import { handleRouteError, readJson } from '@/server/http';

export const runtime = 'nodejs';

interface RegisterBody {
  login: string;
  password: string;
  name: string;
}

export async function POST(request: Request) {
  try {
    const body = await readJson<RegisterBody>(request);
    const user = registerUser(body);
    const session = createSession(user.id);
    const response = NextResponse.json({ user }, { status: 201 });

    setSessionCookie(response, session.token, session.expiresAt);

    return response;
  } catch (error) {
    return handleRouteError(error);
  }
}
