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
import { apiRequest } from '@/app/lib/api';

export default function AdminRemovePage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [productId, setProductId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
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
    }
  }, [ready, router, user]);

  const handleRemove = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    setStatusMessage('');

    try {
      await apiRequest(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });
      setStatusMessage('Товар удалён');
      setProductId('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось удалить товар');
    } finally {
      setIsSubmitting(false);
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
                Удалить товар
              </h1>

              {!ready ? (
                <p className="text-q-muted">Проверка доступа...</p>
              ) : !isAdmin ? (
                <p className="text-q-muted">{error || 'Доступ запрещен'}</p>
              ) : (
                <form onSubmit={handleRemove} className="flex flex-col gap-8">
                  <InputWhite
                    type="text"
                    placeholder="ID товара"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    required
                  />

                  {error && <p className="text-sm text-q-danger">{error}</p>}
                  {statusMessage && <p className="text-sm text-q-dark">{statusMessage}</p>}

                  <div className="flex gap-5">
                    <Button
                      variant="danger"
                      size="md"
                      type="submit"
                      icon={<Trash2 size={18} />}
                      className="flex-1 justify-center"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Удаление...' : 'Удалить'}
                    </Button>
                    <div className="flex-1" />
                  </div>
                </form>
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
