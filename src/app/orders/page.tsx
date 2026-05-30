'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/auth-provider';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { apiRequest, formatDate, type OrderRecord } from '@/app/lib/api';

function OrderItemRating({
  orderId,
  productId,
  initialRating,
  onSaved,
}: {
  orderId: number;
  productId: number | null;
  initialRating: number | null;
  onSaved: (rating: number) => void;
}) {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  if (!productId) {
    return null;
  }

  if (initialRating) {
    return (
      <div className="inline-flex items-center gap-2 text-sm font-medium text-q-dark">
        <Star size={16} fill="var(--q-star)" stroke="none" />
        <span>{initialRating}/5</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-1"
      onMouseLeave={() => setHoveredRating(0)}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const ratingValue = index + 1;
        const isActive = ratingValue <= hoveredRating;

        return (
          <button
            key={ratingValue}
            type="button"
            disabled={isSaving}
            className="transition-transform duration-150 hover:scale-110 disabled:cursor-wait"
            onMouseEnter={() => setHoveredRating(ratingValue)}
            onClick={async () => {
              setIsSaving(true);

              try {
                const response = await apiRequest<{ review: { rating: number } }>(
                  `/api/orders/${orderId}/reviews`,
                  {
                    method: 'POST',
                    body: JSON.stringify({ productId, rating: ratingValue }),
                  },
                );
                onSaved(response.review.rating);
              } catch (requestError) {
                const message =
                  requestError instanceof Error ? requestError.message : 'Не удалось сохранить оценку';
                window.alert(message);
              } finally {
                setIsSaving(false);
              }
            }}
            aria-label={`Оценить товар на ${ratingValue} из 5`}
          >
            <Star
              size={18}
              fill={isActive ? 'var(--q-star)' : 'var(--q-surface)'}
              color={isActive ? 'var(--q-star)' : 'var(--q-muted)'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function OrdersPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user) {
      router.replace('/auth');
      return;
    }

    let cancelled = false;

    apiRequest<{ items: OrderRecord[] }>('/api/orders')
      .then((response) => {
        if (!cancelled) {
          setOrders(response.items);
          setError('');
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
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
  }, [ready, router, user]);

  const updateRating = (orderId: number, itemId: number, rating: number) => {
    setOrders((current) =>
      current.map((order) =>
        order.id !== orderId
          ? order
          : {
              ...order,
              items: order.items.map((item) =>
                item.id === itemId ? { ...item, userRating: rating } : item,
              ),
            },
      ),
    );
  };

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto py-8 sm:py-10">
        <div className="flex flex-col items-center gap-10">
          <h1 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08] self-center">
            История заказов
          </h1>

          {isLoading ? (
            <div className="text-q-muted">Загрузка заказов...</div>
          ) : error ? (
            <div className="text-q-muted">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-q-muted">У вас пока нет заказов</div>
          ) : (
            <div className="flex flex-col gap-3.5 w-full max-w-[700px]">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-q-card border border-q-border p-6 sm:p-8 flex flex-col sm:flex-row gap-6 sm:gap-5 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex-1 min-w-0 flex flex-col gap-5">
                    {order.items.map((item, index) => (
                      <div key={item.id}>
                        {index > 0 && <div className="h-px bg-q-border mb-5" />}
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-q-muted text-base font-medium">{item.name}</p>
                            <p className="text-q-muted text-sm">Количество: {item.quantity}</p>
                            <div className="mt-2 flex items-center gap-3">
                              {item.userRating ? (
                                <>
                                  <Star size={16} fill="var(--q-star)" color="var(--q-star)" />
                                  <span className="text-q-dark text-sm font-medium">
                                    {item.userRating}/5
                                  </span>
                                </>
                              ) : (
                                <OrderItemRating
                                  orderId={order.id}
                                  productId={item.productId}
                                  initialRating={item.userRating}
                                  onSaved={(rating) => updateRating(order.id, item.id, rating)}
                                />
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 shrink-0">
                            <p className="text-q-dark text-base font-medium whitespace-nowrap">
                              {(item.price * item.quantity).toLocaleString('ru-RU')} $
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden sm:block w-px bg-q-border self-stretch mx-2" />
                  <div className="sm:hidden h-px bg-q-border" />

                  <div className="sm:w-48 flex flex-col justify-between gap-3 shrink-0">
                    <p className="text-q-muted text-base font-medium">{formatDate(order.createdAt)}</p>
                    <div className="flex items-center justify-between sm:flex-col sm:items-start gap-2">
                      <p className="text-q-muted text-base font-medium">Сумма</p>
                      <p className="text-q-dark text-base font-medium text-right">
                        {order.totalPrice.toLocaleString('ru-RU')} $
                      </p>
                    </div>
                    <p className="text-q-muted text-sm">
                      {order.status === 'shipped' ? 'Отправлен' : 'Ожидает отправки'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
