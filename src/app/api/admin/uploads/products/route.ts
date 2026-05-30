import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';

import { NextRequest, NextResponse } from 'next/server';

import { requireAdminUser } from '@/server/auth';
import { HttpError, handleRouteError } from '@/server/http';

export const runtime = 'nodejs';

const UPLOAD_DIRECTORY = path.join(process.cwd(), 'public', 'uploads', 'products');
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function getExtension(file: File) {
  const byType: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
  };

  return byType[file.type] ?? path.extname(file.name).toLowerCase() ?? '.bin';
}

export async function POST(request: NextRequest) {
  try {
    requireAdminUser(request);

    const formData = await request.formData();
    const files = formData.getAll('files').filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      throw new HttpError(400, 'Нужно передать хотя бы одно изображение');
    }

    if (files.length > 10) {
      throw new HttpError(400, 'Можно загрузить не больше 10 изображений за один запрос');
    }

    await fs.mkdir(UPLOAD_DIRECTORY, { recursive: true });

    const uploaded = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        throw new HttpError(400, 'Разрешены только JPG, PNG, WEBP и GIF изображения');
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${Date.now()}-${randomUUID()}${getExtension(file)}`;
      const filePath = path.join(UPLOAD_DIRECTORY, fileName);

      await fs.writeFile(filePath, buffer);

      uploaded.push({
        name: file.name,
        url: `/uploads/products/${fileName}`,
      });
    }

    return NextResponse.json({ items: uploaded }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
