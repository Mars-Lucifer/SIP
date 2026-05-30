export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type UserRole = 'user' | 'admin';
export type ProductCategory = 'laptop' | 'mini_pc';
export type OrderItemCategory = ProductCategory | 'peripheral';
export type ProcessorType = 'intel' | 'amd' | 'arm' | 'apple';
export type GraphicsType = 'integrated' | 'discrete';
export type PopularCategory = 'work_laptops' | 'gaming_laptops' | 'mini_pc';
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
  screenInches: number | null;
  processor: ProcessorType | null;
  ramGb: number | null;
  storageGb: number | null;
  graphicsType: GraphicsType;
  graphicsModel: string | null;
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
  screenInches: number | null;
  processor: ProcessorType | null;
  ramGb: number | null;
  storageGb: number | null;
  graphicsType: GraphicsType;
  graphicsModel: string | null;
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
    case 'laptop':
      return 'Ноутбуки';
    case 'mini_pc':
      return 'Мини ПК';
    case 'peripheral':
      return 'Периферия';
    default:
      return 'Мини ПК';
  }
}

export function catalogLabelToCategory(label: string): ProductCategory | undefined {
  switch (label) {
    case 'Ноутбуки':
      return 'laptop';
    case 'Мини ПК':
      return 'mini_pc';
    default:
      return undefined;
  }
}

export function processorToLabel(value: ProcessorType | null) {
  switch (value) {
    case 'intel':
      return 'Intel';
    case 'amd':
      return 'AMD';
    case 'arm':
      return 'Arm';
    case 'apple':
      return 'Apple';
    default:
      return '';
  }
}

export function labelToProcessor(value: string): ProcessorType | undefined {
  switch (value) {
    case 'Intel':
      return 'intel';
    case 'AMD':
      return 'amd';
    case 'Arm':
      return 'arm';
    case 'Apple':
      return 'apple';
    default:
      return undefined;
  }
}

export function graphicsTypeToLabel(value: GraphicsType) {
  return value === 'discrete' ? 'Дискретная' : 'Встроенная';
}

export function labelToGraphicsType(value: string): GraphicsType | undefined {
  switch (value) {
    case 'Встроенная':
      return 'integrated';
    case 'Дискретная':
      return 'discrete';
    default:
      return undefined;
  }
}

export const POPULAR_TABS: Array<{ key: PopularCategory; label: string }> = [
  { key: 'work_laptops', label: 'Рабочие ноутбуки' },
  { key: 'gaming_laptops', label: 'Игровые ноутбуки' },
  { key: 'mini_pc', label: 'Мини ПК' },
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
