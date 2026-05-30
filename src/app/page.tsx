'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';

import { useAuth } from '@/app/auth-provider';
import { Button } from '@/app/components/Button';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { ProductCard } from '@/app/components/ProductCard';
import {
  apiRequest,
  formatDate,
  POPULAR_TABS,
  type NewsItem,
  type ProductDetail,
} from '@/app/lib/api';

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductDetail[]>([]);
  const [newsError, setNewsError] = useState('');
  const [productsError, setProductsError] = useState('');

  useEffect(() => {
    let cancelled = false;

    apiRequest<{ items: NewsItem[] }>('/api/news')
      .then((response) => {
        if (!cancelled) {
          setNewsItems(response.items);
          setNewsError('');
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setNewsError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const activeTab = POPULAR_TABS[activeCategory];

    apiRequest<{ calculatedAt: number | null; items: ProductDetail[] }>(
      `/api/products/popular?category=${activeTab.key}`,
    )
      .then((response) => {
        if (!cancelled) {
          setPopularProducts(response.items);
          setProductsError('');
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setProductsError(error.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      router.push('/auth');
      return;
    }

    try {
      await apiRequest('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ productId }),
      });
      window.alert('Товар добавлен в корзину');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось добавить товар';
      window.alert(message);
    }
  };

  const mainNews = newsItems[0];
  const secondaryNews = newsItems.slice(1, 3);

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto">
        <section className="mt-6 sm:mt-8">
          <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none">
            <div className="bg-q-dark rounded-q-hero p-8 flex flex-col justify-between overflow-hidden relative shrink-0 w-full sm:w-auto sm:flex-1 min-h-[300px] sm:min-h-[400px]">
              <div className="absolute right-0 top-[-10%] w-[45%] h-[130%] pointer-events-none">
                <div
                  className="w-full h-full opacity-80"
                  style={{
                    background:
                      'radial-gradient(ellipse at 50% 80%, var(--q-accent) 0%, var(--q-accent) 30%, transparent 70%)',
                    filter: 'blur(32px)',
                  }}
                />
              </div>

              <h2 className="text-white text-[32px] sm:text-[48px] font-medium leading-[1.08] relative z-10 max-w-[500px]">
                {mainNews?.title ?? 'Новости скоро появятся'}
              </h2>

              <div className="flex flex-col gap-5 relative z-10">
                <div className="flex items-end gap-4">
                  <p className="text-q-muted text-sm sm:text-base font-normal flex-1">
                    {mainNews?.description ??
                      'Пока новости загружаются, вы уже можете смотреть каталог и собирать корзину.'}
                  </p>
                  <p className="text-white text-[28px] sm:text-[40px] font-medium leading-[1.08] text-right shrink-0">
                    {mainNews?.activeUntil ? formatDate(mainNews.activeUntil) : 'Без срока'}
                  </p>
                </div>
                <div className="h-1 bg-q-dark-subtle rounded-full w-full">
                  <div className="h-full bg-white rounded-full w-[72%]" />
                </div>
                {newsError && <p className="text-q-muted text-sm">{newsError}</p>}
              </div>
            </div>

            <div className="hidden sm:flex flex-col sm:flex-row gap-5 shrink-0">
              {secondaryNews.map((newsItem) => (
                <div
                  key={newsItem.id}
                  className="h-full sm:h-[400px] w-[280px] sm:w-[315px] rounded-q-hero border border-q-dark p-8 flex flex-col items-start justify-between transition-all duration-200 hover:bg-q-surface"
                >
                  <p className="text-q-dark text-[28px] sm:text-[32px] font-medium leading-[1.08]">
                    {newsItem.title}
                  </p>
                  <p className="text-q-muted text-sm sm:text-base leading-normal">
                    {newsItem.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-20 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
          <h2 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08] max-w-[500px]">
            Первый интернет-магазин ноутбуков
          </h2>
          <p className="text-q-muted text-base font-normal leading-normal sm:max-w-[315px]">
            Вы тоже любите ноутбуки и компактность? Тогда нам по пути! Магазин уже работает с
            реальным API, а каталог и заказы теперь берутся из базы.
          </p>
        </section>

        <section className="mt-14 sm:mt-20">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h2 className="text-q-dark text-[32px] sm:text-[40px] font-medium leading-[1.08]">
              Популярные товары
            </h2>
            <Link href="/catalog" className="no-underline">
              <Button variant="outline" size="md" icon={<ArrowUpRight size={18} />}>
                Перейти в каталог
              </Button>
            </Link>
          </div>

          <div className="flex gap-6 sm:gap-10 overflow-x-auto pb-2 mb-6 sm:mb-8 scrollbar-none border-b border-q-surface">
            {POPULAR_TABS.map((tab, index) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(index)}
                className={[
                  'text-xl sm:text-2xl font-medium leading-[1.08] whitespace-nowrap pb-3 border-b-2 transition-all duration-150 shrink-0 cursor-pointer',
                  activeCategory === index
                    ? 'text-q-dark border-q-dark'
                    : 'text-q-muted border-transparent hover:text-q-dark',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {productsError ? (
            <div className="py-10 text-center text-q-muted">{productsError}</div>
          ) : popularProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {popularProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.image ?? product.images[0]}
                />
              ))}
            </div>
          ) : (
            <div className="py-10 text-center text-q-muted">
              Популярные товары появятся после добавления товаров и первых заказов.
            </div>
          )}
        </section>

        <div className="mt-20 sm:mt-28" />
      </main>

      <Footer />
    </div>
  );
}
