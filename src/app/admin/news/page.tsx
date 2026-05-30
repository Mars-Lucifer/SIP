'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

import { useAuth } from '@/app/auth-provider';
import { AdminNav } from '@/app/components/AdminNav';
import { Button } from '@/app/components/Button';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { InputWhite } from '@/app/components/Input';
import { apiRequest, formatDateTime, type NewsItem } from '@/app/lib/api';

export default function AdminNewsPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    activeUntil: '',
  });

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

    apiRequest<{ items: NewsItem[] }>('/api/admin/news')
      .then((response) => {
        if (!cancelled) {
          setNewsItems(response.items);
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setStatusMessage('');

    try {
      const response = await apiRequest<{ item: NewsItem }>('/api/admin/news', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          activeUntil: form.activeUntil ? new Date(form.activeUntil).toISOString() : null,
        }),
      });

      setNewsItems((current) => [response.item, ...current]);
      setForm({
        title: '',
        description: '',
        activeUntil: '',
      });
      setStatusMessage('Новость добавлена');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось добавить новость');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (newsId: number) => {
    setDeletingId(newsId);
    setError('');
    setStatusMessage('');

    try {
      await apiRequest(`/api/admin/news/${newsId}`, {
        method: 'DELETE',
      });
      setNewsItems((current) => current.filter((item) => item.id !== newsId));
      setStatusMessage('Новость удалена');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось удалить новость');
    } finally {
      setDeletingId(null);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">
          <div className="w-full lg:w-[48%] xl:w-[600px] shrink-0">
            <div className="bg-q-surface rounded-q-panel p-8 flex flex-col gap-8">
              <h1 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08]">
                Новости
              </h1>

              {!ready ? (
                <p className="text-q-muted">Проверка доступа...</p>
              ) : !isAdmin ? (
                <p className="text-q-muted">{error || 'Доступ запрещен'}</p>
              ) : (
                <>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <InputWhite
                      type="text"
                      placeholder="Название новости"
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      required
                    />
                    <textarea
                      className="w-full min-h-28 px-4 py-3 text-base font-medium text-q-dark placeholder:text-q-muted outline-none transition-all duration-150 focus:border-q-dark focus-visible:outline-none bg-white rounded-q-input border border-q-border resize-y"
                      placeholder="Описание новости"
                      value={form.description}
                      onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                      required
                    />
                    <InputWhite
                      type="datetime-local"
                      value={form.activeUntil}
                      onChange={(event) => setForm((current) => ({ ...current, activeUntil: event.target.value }))}
                    />
                    <Button variant="accent" size="md" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? 'Добавление...' : 'Добавить'}
                    </Button>
                  </form>

                  <div className="h-px bg-q-border" />

                  {error && <p className="text-sm text-q-danger">{error}</p>}
                  {statusMessage && <p className="text-sm text-q-dark">{statusMessage}</p>}

                  {isLoading ? (
                    <p className="text-q-muted">Загрузка новостей...</p>
                  ) : newsItems.length === 0 ? (
                    <p className="text-q-muted">Новостей пока нет</p>
                  ) : (
                    <div className="flex flex-col gap-3.5">
                      {newsItems.map((item) => (
                        <div key={item.id} className="rounded-q-card border border-q-border p-5 flex flex-col gap-4">
                          <div className="flex flex-col gap-2">
                            <p className="text-q-dark text-xl font-medium leading-[1.08]">{item.title}</p>
                            <p className="text-q-muted text-base whitespace-pre-wrap">{item.description}</p>
                          </div>
                          <div className="flex items-center justify-between gap-4 flex-wrap">
                            <p className="text-q-muted text-sm">
                              {item.activeUntil
                                ? `До ${formatDateTime(item.activeUntil)}`
                                : 'Без срока окончания'}
                            </p>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={<Trash2 size={16} />}
                              disabled={deletingId === item.id}
                              onClick={() => handleDelete(item.id)}
                            >
                              {deletingId === item.id ? 'Удаление...' : 'Удалить'}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex-1">
            <AdminNav />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
