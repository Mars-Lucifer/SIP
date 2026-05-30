import { randomBytes } from 'crypto';

import { eq, lt } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, SESSION_DURATION_MS, UserRole } from '@/server/constants';
import { db, sessions, users } from '@/server/db';
import { HttpError, normalizeForSearch, requireNonEmptyString } from '@/server/http';
import { hashPassword, hashSessionToken, verifyPassword } from '@/server/security';

type UserRow = typeof users.$inferSelect;

export interface PublicUser {
  id: number;
  login: string;
  name: string;
  role: UserRole;
}

interface RegisterPayload {
  login: string;
  password: string;
  name: string;
}

interface LoginPayload {
  login: string;
  password: string;
}

function normalizeLogin(login: string) {
  return login.trim().toLowerCase();
}

function toPublicUser(user: UserRow): PublicUser {
  return {
    id: user.id,
    login: user.login,
    name: user.name,
    role: user.role,
  };
}

function validateLogin(login: string) {
  const prepared = requireNonEmptyString(login, 'Логин');

  if (prepared.length < 3) {
    throw new HttpError(400, 'Логин должен содержать минимум 3 символа');
  }

  if (prepared.length > 50) {
    throw new HttpError(400, 'Логин не должен быть длиннее 50 символов');
  }

  if (/\s/.test(prepared)) {
    throw new HttpError(400, 'Логин не должен содержать пробелы');
  }

  return prepared;
}

function validatePassword(password: string) {
  if (typeof password !== 'string' || password.length < 8) {
    throw new HttpError(400, 'Пароль должен содержать минимум 8 символов');
  }

  return password;
}

function validateName(name: string) {
  const prepared = requireNonEmptyString(name, 'Имя пользователя');

  if (prepared.length > 100) {
    throw new HttpError(400, 'Имя пользователя не должно быть длиннее 100 символов');
  }

  return prepared;
}

function cleanupExpiredSessions() {
  db.delete(sessions).where(lt(sessions.expiresAt, Date.now())).run();
}

export function registerUser(payload: RegisterPayload) {
  const login = validateLogin(payload.login);
  const password = validatePassword(payload.password);
  const name = validateName(payload.name);
  const loginNormalized = normalizeLogin(login);

  const existingUser = db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.loginNormalized, loginNormalized))
    .get();

  if (existingUser) {
    throw new HttpError(409, 'Пользователь с таким логином уже существует');
  }

  const insertResult = db.insert(users).values({
    login,
    loginNormalized,
    name,
    passwordHash: hashPassword(password),
    role: 'user' as UserRole,
    createdAt: Date.now(),
  }).run();

  const createdUser = db
    .select()
    .from(users)
    .where(eq(users.id, Number(insertResult.lastInsertRowid)))
    .get();

  if (!createdUser) {
    throw new HttpError(500, 'Не удалось создать пользователя');
  }

  return toPublicUser(createdUser);
}

export function loginUser(payload: LoginPayload) {
  const login = validateLogin(payload.login);
  const password = validatePassword(payload.password);
  const loginNormalized = normalizeLogin(login);

  const user = db
    .select()
    .from(users)
    .where(eq(users.loginNormalized, loginNormalized))
    .get();

  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'Неверный логин или пароль');
  }

  return toPublicUser(user);
}

export function createSession(userId: number) {
  cleanupExpiredSessions();

  const token = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  db.insert(sessions).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    createdAt: Date.now(),
  }).run();

  return { token, expiresAt };
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: number) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(expiresAt),
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
  });
}

export function deleteSessionByToken(token: string) {
  db.delete(sessions).where(eq(sessions.tokenHash, hashSessionToken(token))).run();
}

export function getUserFromRequest(request: NextRequest): PublicUser | null {
  cleanupExpiredSessions();

  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const sessionRow = db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      userId: users.id,
      login: users.login,
      name: users.name,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(eq(sessions.tokenHash, hashSessionToken(sessionToken)))
    .get();

  if (!sessionRow) {
    return null;
  }

  if (sessionRow.expiresAt <= Date.now()) {
    db.delete(sessions).where(eq(sessions.id, sessionRow.sessionId)).run();
    return null;
  }

  return {
    id: sessionRow.userId,
    login: sessionRow.login,
    name: sessionRow.name,
    role: sessionRow.role,
  };
}

export function requireAuthenticatedUser(request: NextRequest) {
  const user = getUserFromRequest(request);

  if (!user) {
    throw new HttpError(401, 'Требуется авторизация');
  }

  return user;
}

export function requireAdminUser(request: NextRequest) {
  const user = requireAuthenticatedUser(request);

  if (user.role !== 'admin') {
    throw new HttpError(403, 'Доступ разрешен только администратору');
  }

  return user;
}

export function normalizeSearchInput(value: string) {
  return normalizeForSearch(value);
}
