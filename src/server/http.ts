import { NextResponse } from 'next/server';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new HttpError(400, 'Некорректный JSON в теле запроса');
  }
}

export function handleRouteError(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);

  return NextResponse.json(
    { error: 'Внутренняя ошибка сервера' },
    { status: 500 },
  );
}

export function normalizeForSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function requireNonEmptyString(value: unknown, fieldName: string) {
  if (typeof value !== 'string') {
    throw new HttpError(400, `${fieldName} обязательно`);
  }

  const prepared = value.trim();

  if (!prepared) {
    throw new HttpError(400, `${fieldName} обязательно`);
  }

  return prepared;
}

export function optionalTrimmedString(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new HttpError(400, 'Ожидалась строка');
  }

  const prepared = value.trim();

  return prepared || null;
}

export function parsePositiveInteger(value: unknown, fieldName: string) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} должно быть положительным целым числом`);
  }

  return parsed;
}

export function parsePositiveNumber(value: unknown, fieldName: string) {
  const parsed =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} должно быть положительным числом`);
  }

  return parsed;
}

export function parseOptionalPositiveInteger(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return parsePositiveInteger(value, fieldName);
}

export function parseOptionalPositiveNumber(value: unknown, fieldName: string) {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return parsePositiveNumber(value, fieldName);
}
