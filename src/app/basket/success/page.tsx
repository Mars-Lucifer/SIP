'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

import { useAuth } from '@/app/auth-provider';
import { Button } from '@/app/components/Button';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { apiRequest, type OrderRecord } from '@/app/lib/api';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-base font-medium">
      <span className="text-q-muted shrink-0">{label}</span>
      <span className="text-q-dark text-right">{value}</span>
    </div>
  );
}

export default function BasketEndPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setOrderId(params.get('orderId'));
  }, []);

  useEffect(() => {
    if (!ready || orderId === null) {
      return;
    }

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (!orderId) {
      setError('Не удалось определить заказ');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    apiRequest<{ order: OrderRecord }>(`/api/orders/${orderId}`)
      .then((response) => {
        if (!cancelled) {
          setOrder(response.order);
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
  }, [orderId, ready, router, user]);

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[650px]">
          <div className="bg-q-surface rounded-q-panel p-8 sm:p-10 flex flex-col gap-8 sm:gap-10 items-center">
            <h1 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08] self-start">
              Успешно!
            </h1>

            {isLoading ? (
              <div className="w-full text-center text-q-muted">Загрузка чека...</div>
            ) : error || !order ? (
              <div className="w-full text-center text-q-muted">{error || 'Заказ не найден'}</div>
            ) : (
              <>
                <div className="w-full rounded-q-card border border-q-border p-5 flex flex-col gap-5">
                  <DetailRow label="ФИО получателя" value={order.payment.fullName} />
                  <DetailRow label="Номер телефона" value={order.payment.phone} />
                  <DetailRow label="Эл. почта" value={order.payment.email} />
                  <DetailRow label="Адрес доставки" value={order.payment.address} />
                  <DetailRow label="Сумма покупки" value={`${order.totalPrice.toLocaleString('ru-RU')} $`} />
                </div>

                {order.items.map((item) => (
                  <div key={item.id} className="w-full rounded-q-card border border-q-border p-5">
                    <p className="text-q-dark text-[18px] font-medium leading-[1.08]">{item.name}</p>
                  </div>
                ))}
              </>
            )}

            <Link href="/orders">
              <Button variant="dark" size="md" icon={<ArrowUpRight size={18} />}>
                Перейти в заказы
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
