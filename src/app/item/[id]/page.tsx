'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { useAuth } from '@/app/auth-provider';
import { useCart } from '@/app/cart-provider';
import { CartQuantityControl } from '@/app/components/CartQuantityControl';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { StarRating } from '@/app/components/StarRating';
import { apiRequest, processorToLabel, type ProductDetail } from '@/app/lib/api';

export default function ItemPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { getProductQuantity, addProduct, incrementProduct, decrementProduct } = useCart();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [currentImage, setCurrentImage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartUpdating, setIsCartUpdating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);

    apiRequest<{ item: ProductDetail }>(`/api/products/${params.id}`)
      .then((response) => {
        if (!cancelled) {
          setProduct(response.item);
          setCurrentImage(0);
          setError('');
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setProduct(null);
          setError(requestError.message);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  const handleCartAction = async (action: 'add' | 'increment' | 'decrement') => {
    if (!product) {
      return;
    }

    if (!user) {
      router.push('/auth');
      return;
    }

    setIsCartUpdating(true);

    try {
      if (action === 'add') {
        await addProduct(product.id);
      } else if (action === 'increment') {
        await incrementProduct(product.id);
      } else {
        await decrementProduct(product.id);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Не удалось обновить корзину';
      window.alert(message);
    } finally {
      setIsCartUpdating(false);
    }
  };

  const images = product?.images.length ? product.images : product?.image ? [product.image] : [];
  const quantity = product ? getProductQuantity(product.id) : 0;

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto py-8 sm:py-10">
        {isLoading ? (
          <div className="py-20 text-center text-q-muted">Загрузка товара...</div>
        ) : error || !product ? (
          <div className="py-20 text-center text-q-muted">{error || 'Товар не найден'}</div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-10">
            <div className="flex flex-col items-center gap-6 lg:w-[48%] xl:w-[500px] shrink-0">
              <div className="w-full aspect-square sm:aspect-[4/3] max-w-[600px] flex items-center justify-center bg-white">
                {images[currentImage] ? (
                  <img
                    src={images[currentImage]}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain transition-opacity duration-300"
                  />
                ) : (
                  <div className="text-q-muted">Изображение отсутствует</div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCurrentImage((value) => (value - 1 + images.length) % images.length)}
                    className="size-11 rounded-full border border-q-dark flex items-center justify-center text-q-muted hover:bg-q-dark hover:text-white transition-all duration-150 active:scale-90"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => setCurrentImage((value) => (value + 1) % images.length)}
                    className="size-11 rounded-full border border-q-dark flex items-center justify-center text-q-muted hover:bg-q-dark hover:text-white transition-all duration-150 active:scale-90"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-10 flex-1 min-w-0">
              <div className="flex flex-col gap-3.5">
                <h1 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08]">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3.5">
                  <StarRating rating={product.rating} />
                  <span className="text-q-muted text-base font-medium">
                    {product.reviewCount} отзывов
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between text-base font-medium">
                  <span className="text-q-muted">Бренд</span>
                  <span className="text-q-dark text-right">{product.brandName}</span>
                </div>
                {product.category === 'laptop' && (
                  <div className="flex items-center justify-between text-base font-medium">
                    <span className="text-q-muted">Диагональ экрана</span>
                    <span className="text-q-dark text-right">
                      {product.screenInches ? `${product.screenInches}"` : 'Не указана'}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-base font-medium">
                  <span className="text-q-muted">Процессор</span>
                  <span className="text-q-dark text-right">
                    {processorToLabel(product.processor) || 'Не указан'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-medium">
                  <span className="text-q-muted">ОЗУ</span>
                  <span className="text-q-dark text-right">
                    {product.ramGb ? `${product.ramGb} Гб` : 'Не указано'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-medium">
                  <span className="text-q-muted">Накопитель</span>
                  <span className="text-q-dark text-right">
                    {product.storageGb ? `${product.storageGb} Гб` : 'Не указан'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base font-medium">
                  <span className="text-q-muted">Видеокарта</span>
                  <span className="text-q-dark text-right">
                    {product.graphicsModel ??
                      (product.graphicsType === 'discrete' ? 'Дискретная' : 'Встроенная')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="flex items-end gap-1 leading-[1.08] font-medium flex-1">
                  <span className="text-q-dark text-[40px]">{product.price.toLocaleString('ru-RU')}</span>
                  <span className="text-q-muted text-2xl">$</span>
                </div>
                <CartQuantityControl
                  quantity={quantity}
                  disabled={isCartUpdating}
                  className="flex-1 sm:flex-none sm:w-[315px] justify-between"
                  onAdd={() => handleCartAction('add')}
                  onIncrement={() => handleCartAction('increment')}
                  onDecrement={() => handleCartAction('decrement')}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
