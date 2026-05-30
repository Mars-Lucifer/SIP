'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';

import { useAuth } from '@/app/auth-provider';
import { AdminNav } from '@/app/components/AdminNav';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { apiRequest, formatDate, type AdminOrderRecord } from '@/app/lib/api';

type FilterTab = 'all' | 'pending' | 'shipped';

function OrderCard({
  order,
  onShip,
}: {
  order: AdminOrderRecord;
  onShip: (id: number) => void;
}) {
  return (
    <div className="relative rounded-q-card w-full border border-q-border">
      <div className="flex flex-col gap-5 p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-8 items-start">
          <div className="flex flex-col gap-5 flex-1 min-w-0">
            {order.items.map((product, idx) => (
              <div key={product.id}>
                {idx > 0 && <div className="h-px bg-q-border mb-5" />}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-q-muted text-base font-medium">{product.name}</p>
                    <p className="text-q-muted text-sm">Количество: {product.quantity}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-q-dark text-base font-medium text-right">
                      {(product.price * product.quantity).toLocaleString('ru-RU')} $
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden lg:block w-px self-stretch bg-q-border shrink-0" />

          <div className="flex flex-col gap-5 flex-1 min-w-0 text-base font-medium">
            <p className="text-q-muted">{formatDate(order.createdAt)}</p>
            <p className="text-q-muted">{order.payment.fullName}</p>

            <div className="flex items-center justify-between gap-2">
              <span className="text-q-muted">ID</span>
              <span className="text-q-dark text-right">{order.id}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-q-muted">Телефон</span>
              <span className="text-q-dark text-right">{order.payment.phone}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-q-muted">Эл. почта</span>
              <span className="text-q-dark text-right">{order.payment.email}</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span className="text-q-muted shrink-0">Адрес доставки</span>
              <span className="text-q-dark text-right">{order.payment.address}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-q-muted">Покупатель</span>
              <span className="text-q-dark text-right">{order.user.name}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          {order.status === 'shipped' ? (
            <div className="inline-flex items-center gap-2.5 px-[18px] py-3 rounded-full border border-q-border text-q-muted text-base font-medium cursor-default select-none">
              Отправлено
              <Send size={16} className="opacity-50" />
            </div>
          ) : (
            <button
              onClick={() => onShip(order.id)}
              className="inline-flex items-center gap-2.5 px-[18px] py-3 rounded-full bg-q-accent text-q-dark text-base font-medium hover:bg-q-accent-soft active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Отправить
              <Send size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterBar({
  active,
  onChange,
  counts,
}: {
  active: FilterTab;
  onChange: (value: FilterTab) => void;
  counts: { all: number; pending: number; shipped: number };
}) {
  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'all', label: `Все (${counts.all})` },
    { key: 'pending', label: `Ожидают отправки (${counts.pending})` },
    { key: 'shipped', label: `Отправлено (${counts.shipped})` },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={[
            'px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 cursor-pointer',
            active === tab.key
              ? 'bg-q-dark text-white'
              : 'border border-q-border text-q-muted hover:border-q-dark hover:text-q-dark',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<AdminOrderRecord[]>([]);
  const [filter, setFilter] = useState<FilterTab>('all');
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

    if (user.role !== 'admin') {
      setError('Доступ разрешен только администратору');
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    apiRequest<{ items: AdminOrderRecord[] }>('/api/admin/orders')
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

  const handleShip = async (id: number) => {
    try {
      const response = await apiRequest<{ order: AdminOrderRecord }>(`/api/admin/orders/${id}/ship`, {
        method: 'POST',
      });

      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, ...response.order, user: order.user } : order,
        ),
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось изменить заказ');
    }
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (filter === 'pending') return order.status !== 'shipped';
      if (filter === 'shipped') return order.status === 'shipped';
      return true;
    });
  }, [filter, orders]);

  const counts = {
    all: orders.length,
    pending: orders.filter((order) => order.status !== 'shipped').length,
    shipped: orders.filter((order) => order.status === 'shipped').length,
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">
          <div className="w-full lg:flex-1 min-w-0">
            <div className="flex flex-col gap-8">
              <h1 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08]">
                Заказы
              </h1>

              {!ready ? (
                <p className="text-q-muted">Проверка доступа...</p>
              ) : !isAdmin ? (
                <p className="text-q-muted">{error || 'Доступ запрещен'}</p>
              ) : (
                <>
                  <FilterBar active={filter} onChange={setFilter} counts={counts} />

                  {isLoading ? (
                    <div className="rounded-q-card border border-q-border p-12 flex items-center justify-center">
                      <p className="text-q-muted text-base font-medium">Загрузка заказов...</p>
                    </div>
                  ) : error ? (
                    <div className="rounded-q-card border border-q-border p-12 flex items-center justify-center">
                      <p className="text-q-muted text-base font-medium">{error}</p>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="rounded-q-card border border-q-border p-12 flex items-center justify-center">
                      <p className="text-q-muted text-base font-medium">
                        {filter === 'pending'
                          ? 'Нет заказов, ожидающих отправки'
                          : filter === 'shipped'
                            ? 'Нет отправленных заказов'
                            : 'Нет заказов'}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {filteredOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onShip={handleShip} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[315px] shrink-0">
            <AdminNav layout="stack" />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
