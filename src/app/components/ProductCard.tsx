'use client';

import { ImageOff, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/auth-provider';
import { useCart } from '@/app/cart-provider';

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  cartQuantity?: number;
  cartDisabled?: boolean;
  onAddToCart?: () => void;
  onIncrementCart?: () => void;
  onDecrementCart?: () => void;
}

export function ProductCard({
  id,
  name,
  price,
  image,
  cartQuantity,
  cartDisabled = false,
  onAddToCart,
  onIncrementCart,
  onDecrementCart,
}: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { getProductQuantity, addProduct, incrementProduct, decrementProduct } = useCart();
  const resolvedProductId = typeof id === 'number' ? id : Number(id);
  const resolvedQuantity =
    typeof cartQuantity === 'number' ? cartQuantity : Number.isFinite(resolvedProductId) ? getProductQuantity(resolvedProductId) : 0;

  const handleAction = async (action: 'add' | 'increment' | 'decrement') => {
    if (action === 'add' && onAddToCart) {
      onAddToCart();
      return;
    }

    if (action === 'increment' && onIncrementCart) {
      onIncrementCart();
      return;
    }

    if (action === 'decrement' && onDecrementCart) {
      onDecrementCart();
      return;
    }

    if (!Number.isFinite(resolvedProductId)) {
      return;
    }

    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      if (action === 'add') {
        await addProduct(resolvedProductId);
      } else if (action === 'increment') {
        await incrementProduct(resolvedProductId);
      } else {
        await decrementProduct(resolvedProductId);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Не удалось обновить корзину';
      window.alert(message);
    }
  };

  return (
    <div className="group relative rounded-q-input border border-q-border overflow-hidden bg-white transition-all duration-200 hover:-translate-y-0.5 cursor-pointer flex flex-col">
      <Link href={`/item/${id}`} className="no-underline flex flex-col flex-1">
        <div className="h-[170px] border-b border-q-border flex items-center justify-center bg-white overflow-hidden shrink-0">
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex items-center justify-center size-full">
              <ImageOff size={40} className="text-q-border" />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 p-4 flex-1">
          <p className="text-q-dark text-[20px] font-medium leading-normal flex-1">
            {name}
          </p>

          <div className="flex items-end justify-between gap-3">
            <div className="flex items-end gap-1 leading-[1.08] font-medium whitespace-nowrap">
              <span className="text-q-dark text-2xl">
                {price.toLocaleString('ru-RU')}
              </span>
              <span className="text-q-muted text-[18px]">$</span>
            </div>

            <div
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
            >
              <button
                type="button"
                disabled={cartDisabled}
                className={[
                  'size-10 rounded-full border flex items-center justify-center transition-all duration-150 active:scale-90 shrink-0',
                  resolvedQuantity > 0
                    ? 'border-q-dark bg-q-dark text-white hover:bg-q-dark-soft hover:border-q-dark-soft'
                    : 'border-q-border text-q-dark hover:bg-q-dark hover:text-white hover:border-q-dark',
                  cartDisabled ? 'cursor-not-allowed opacity-60' : '',
                ].join(' ')}
                onClick={() => handleAction('add')}
                aria-label={
                  resolvedQuantity > 0
                    ? `Добавлено в корзину: ${resolvedQuantity}`
                    : 'Добавить в корзину'
                }
              >
                {resolvedQuantity > 0 ? (
                  <span className="text-sm font-medium leading-none">{resolvedQuantity}</span>
                ) : (
                  <ShoppingCart size={16} />
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
