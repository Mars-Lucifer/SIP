export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type UserRole = 'user' | 'admin';
export type ProductCategory = 'tea' | 'syrups' | 'additions' | 'drink_kits';
export type ProductTaste = 'травяной' | 'цитрусовый' | 'ягодный' | 'экзотический' | 'слайдий';
export type OrderItemCategory = ProductCategory;
export type PopularCategory = ProductCategory;
export type OrderStatus = 'pending' | 'shipped';

export interface AuthUser {
  id: number;
  login: string;
  name: string;
  role: UserRole;
}

export interface NewsItem {
  id: number;
  title: string;
  description: string;
  activeUntil: number | null;
  createdAt: number;
}

export interface ProductListItem {
  id: number;
  name: string;
  price: number;
  category: ProductCategory;
  brandId: number;
  brandName: string;
  weightGrams: number | null;
  tastes: ProductTaste[];
  image: string | null;
  rating: number;
  reviewCount: number;
  orderCount: number;
}

export interface ProductDetail extends ProductListItem {
  createdAt: number;
  updatedAt: number;
  images: string[];
}

export interface CartItem {
  productId: number;
  cartItemId: number;
  quantity: number;
  name: string;
  price: number;
  category: ProductCategory;
  image: string | null;
}

export interface CartResponse {
  totalPrice: number;
  items: CartItem[];
}

export interface OrderItem {
  id: number;
  productId: number | null;
  quantity: number;
  name: string;
  price: number;
  category: OrderItemCategory;
  brandName: string;
  weightGrams: number | null;
  tastes: ProductTaste[];
  imageUrl: string | null;
  createdAt: number;
  userRating: number | null;
}

export interface OrderRecord {
  id: number;
  status: OrderStatus;
  totalPrice: number;
  createdAt: number;
  updatedAt: number;
  payment: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
  };
  items: OrderItem[];
}

export interface AdminOrderRecord extends OrderRecord {
  user: {
    id: number;
    login: string;
    name: string;
  };
}

interface ApiErrorPayload {
  error?: string;
}

export async function apiRequest<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as T | ApiErrorPayload | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : 'Ошибка запроса';

    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export function formatPrice(price: number) {
  return price.toLocaleString('ru-RU');
}

export function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(timestamp);
}

export function formatDateTime(timestamp: number) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(timestamp);
}

export function categoryToLabel(category: OrderItemCategory) {
  switch (category) {
    case 'tea':
      return 'Чаи';
    case 'syrups':
      return 'Сиропы';
    case 'additions':
      return 'Додавки';
    case 'drink_kits':
      return 'Drink Kits';
    default:
      return 'Чаи';
  }
}

export function catalogLabelToCategory(label: string): ProductCategory | undefined {
  switch (label) {
    case 'Чаи':
      return 'tea';
    case 'Сиропы':
      return 'syrups';
    case 'Додавки':
      return 'additions';
    case 'Drink Kits':
      return 'drink_kits';
    default:
      return undefined;
  }
}

export const POPULAR_TABS: Array<{ key: PopularCategory; label: string }> = [
  { key: 'tea', label: 'Чаи' },
  { key: 'syrups', label: 'Сиропы' },
  { key: 'additions', label: 'Додавки' },
  { key: 'drink_kits', label: 'Drink Kits' },
];

export async function uploadProductImages(files: File[]) {
  const formData = new FormData();

  for (const file of files) {
    formData.append('files', file);
  }

  const response = await apiRequest<{ items: Array<{ name: string; url: string }> }>(
    '/api/admin/uploads/products',
    {
      method: 'POST',
      body: formData,
    },
  );

  return response.items.map((item) => item.url);
}
