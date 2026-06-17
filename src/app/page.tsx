"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

const NEWS_SLIDE_DURATION_MS = 5000;

import { Button } from "@/app/components/Button";
import { Footer } from "@/app/components/Footer";
import { Header } from "@/app/components/Header";
import { ProductCard } from "@/app/components/ProductCard";
import {
  apiRequest,
  formatDate,
  POPULAR_TABS,
  type NewsItem,
  type ProductDetail,
} from "@/app/lib/api";

const HERO_RIGHT_IMAGE = "/assets/images/home/hero-right.png";
const ABOUT_IMAGE_LEFT = "/assets/images/home/about-left.png";
const ABOUT_IMAGE_RIGHT = "/assets/images/home/about-right.png";

function PanelImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden rounded-[60px] bg-white/10">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
      <div className="pointer-events-none absolute inset-0 rounded-[60px] border-[20px] border-white/60 blur-[30px]" />
    </div>
  );
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [activeNewsIndex, setActiveNewsIndex] = useState(0);
  const [newsSlideProgress, setNewsSlideProgress] = useState(0);
  const [popularProducts, setPopularProducts] = useState<ProductDetail[]>([]);
  const [newsError, setNewsError] = useState("");
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiRequest<{ items: NewsItem[] }>("/api/news")
      .then((response) => {
        if (!cancelled) {
          setNewsItems(response.items);
          setNewsError("");
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
    if (newsItems.length === 0) {
      setActiveNewsIndex(0);
      setNewsSlideProgress(0);
      return;
    }

    if (activeNewsIndex >= newsItems.length) {
      setActiveNewsIndex(0);
    }
  }, [newsItems.length, activeNewsIndex]);

  useEffect(() => {
    if (newsItems.length <= 1) {
      setNewsSlideProgress(newsItems.length === 1 ? 1 : 0);
      return;
    }

    const startedAt = Date.now();
    let frameId = 0;

    const tick = () => {
      const elapsed = Date.now() - startedAt;
      const progress = Math.min(elapsed / NEWS_SLIDE_DURATION_MS, 1);
      setNewsSlideProgress(progress);

      if (progress >= 1) {
        setActiveNewsIndex((current) => (current + 1) % newsItems.length);
        return;
      }

      frameId = window.requestAnimationFrame(tick);
    };

    setNewsSlideProgress(0);
    frameId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [newsItems.length, activeNewsIndex]);

  useEffect(() => {
    let cancelled = false;
    const activeTab = POPULAR_TABS[activeCategory];

    apiRequest<{ calculatedAt: number | null; items: ProductDetail[] }>(
      `/api/products/popular?category=${activeTab.key}`,
    )
      .then((response) => {
        if (!cancelled) {
          setPopularProducts(response.items);
          setProductsError("");
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

  const activeNews =
    newsItems[activeNewsIndex] ?? newsItems[0] ?? null;
  const heroTitle =
    activeNews?.title ?? "Давайте готовить невероятные напитки вместе!";
  const heroDescription =
    activeNews?.description ??
    "В SIP Market мы собираем всё для красивых домашних напитков, уютных ритуалов и маленьких поводов для удовольствия.";
  const heroDate = activeNews?.activeUntil
    ? formatDate(activeNews.activeUntil)
    : "Без срока";

  return (
    <div className="min-h-screen bg-white font-[Manrope,sans-serif]">
      <Header />

      <main className="mx-auto max-w-[1440px] px-4 sm:px-6 xl:px-[60px]">
        <section className="mt-6 sm:mt-8">
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,0.95fr)]">
            <article
              className="relative min-h-[300px] overflow-hidden rounded-[60px] p-8 sm:min-h-[460px] sm:p-10"
              style={{
                backgroundImage: [
                  "radial-gradient(circle at 18% 18%, rgba(88,17,191,0.98) 0%, rgba(88,17,191,0) 38%)",
                  "radial-gradient(circle at 80% 20%, rgba(203,140,253,0.98) 0%, rgba(203,140,253,0) 34%)",
                  "radial-gradient(circle at 82% 82%, rgba(174,16,195,0.98) 0%, rgba(174,16,195,0) 40%)",
                  "radial-gradient(circle at 20% 82%, rgba(145,29,250,0.98) 0%, rgba(145,29,250,0) 36%)",
                  "linear-gradient(135deg, #5811bf 0%, #cb8cfd 50%, #ae10c3 100%)",
                ].join(", "),
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_46%)]" />

              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <h1 className="max-w-[560px] text-[32px] font-medium leading-[1.08] text-white sm:text-[48px]">
                  {heroTitle}
                </h1>

                <div className="flex flex-col gap-5">
                  <p className="max-w-[520px] text-sm leading-normal text-white/70 sm:text-base">
                    {heroDescription}
                  </p>

                  {newsItems.length > 0 ? (
                    <div className="flex h-3 w-full items-center justify-center gap-1">
                      {newsItems.map((item, index) => {
                        const isActive = index === activeNewsIndex;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            aria-label={`Показать новость ${index + 1}`}
                            aria-current={isActive ? "true" : undefined}
                            onClick={() => setActiveNewsIndex(index)}
                            className={[
                              "h-full overflow-hidden rounded-full bg-white/30 transition-[width] duration-300",
                              isActive ? "w-[60px]" : "w-5",
                            ].join(" ")}
                          >
                            {isActive ? (
                              <div
                                className="h-full rounded-full bg-white"
                                style={{
                                  width: `${newsSlideProgress * 100}%`,
                                }}
                              />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}

                  {newsError ? (
                    <p className="text-sm text-white/60">{newsError}</p>
                  ) : null}
                </div>
              </div>
            </article>

            <article className="relative flex min-h-[300px] flex-col items-center justify-between overflow-hidden rounded-[60px] bg-gray-plus p-8 text-center sm:min-h-[460px] sm:p-10">
              <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_56%)]" />

              <div className="relative z-10 text-[32px] font-medium leading-[1.08] text-q-dark sm:text-[48px]">
                {heroDate}
              </div>

              <div className="absolute inset-x-0 bottom-0 z-10 flex justify-center px-8">
                <img
                  src={HERO_RIGHT_IMAGE}
                  alt="illustration"
                  className="w-full max-w-[320px] object-contain"
                />
              </div>
            </article>
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-6 max-w-[650px]">
              <h2 className="text-[36px] font-medium leading-[1.08] text-q-dark sm:text-[48px]">
                About SIP
              </h2>
              <p className="max-w-[315px] text-base leading-normal text-q-muted">
                SIP - curated shop с ингредиентами для домашних напитков и
                красивых ритуалов. От blue tea lemonade до matcha latte - все
                для того, чтобы повторить любимые cafe-style рецепты дома.
              </p>

              <div className="flex flex-wrap items-start gap-2.5">
                <Button
                  as="a"
                  href="https://instagram.com/sip_market"
                  target="_blank"
                  rel="noreferrer"
                  variant="fillGray"
                  size="md"
                  icon={
                    <img
                      src="/assets/icons/instagram.svg"
                      alt=""
                      className="size-4"
                    />
                  }
                >
                  Инстаграм
                </Button>
                <Button
                  as="a"
                  href="https://t.me/sip_market"
                  target="_blank"
                  rel="noreferrer"
                  variant="fillGray"
                  size="md"
                  icon={
                    <img
                      src="/assets/icons/telegram.svg"
                      alt=""
                      className="size-4"
                    />
                  }
                >
                  Телеграм
                </Button>
                <Button
                  as="a"
                  href="https://vk.com/sip_market"
                  target="_blank"
                  rel="noreferrer"
                  variant="fillGray"
                  size="md"
                  icon={
                    <img src="/assets/icons/vk.svg" alt="" className="size-4" />
                  }
                >
                  ВК
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:w-[650px]">
              <div className="h-[420px]">
                <PanelImage src={ABOUT_IMAGE_LEFT} alt="About SIP visual one" />
              </div>
              <div className="h-[420px]">
                <PanelImage
                  src={ABOUT_IMAGE_RIGHT}
                  alt="About SIP visual two"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 sm:mt-20">
          <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
            <h2 className="text-[32px] font-medium leading-[1.08] text-q-dark sm:text-[40px]">
              Популярные товары
            </h2>
            <Link href="/catalog" className="no-underline">
              <Button
                variant="outline"
                size="md"
                icon={<ArrowUpRight size={18} />}
              >
                Перейти в каталог
              </Button>
            </Link>
          </div>

          <div className="mb-6 flex gap-6 overflow-x-auto border-b border-q-surface pb-2 scrollbar-none sm:mb-8 sm:gap-10">
            {POPULAR_TABS.map((tab, index) => (
              <button
                key={tab.key}
                onClick={() => setActiveCategory(index)}
                className={[
                  "shrink-0 cursor-pointer whitespace-nowrap border-b-2 pb-3 text-xl font-medium leading-[1.08] transition-all duration-150 sm:text-2xl",
                  activeCategory === index
                    ? "border-q-dark text-q-dark"
                    : "border-transparent text-q-muted hover:text-q-dark",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {productsError ? (
            <div className="py-10 text-center text-q-muted">
              {productsError}
            </div>
          ) : popularProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
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
              Популярные товары появятся после добавления товаров и первых
              заказов.
            </div>
          )}
        </section>

        <div className="mt-20 sm:mt-28" />
      </main>

      <Footer />
    </div>
  );
}
