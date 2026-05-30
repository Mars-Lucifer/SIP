'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/auth-provider';
import { Button } from '@/app/components/Button';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { InputGray } from '@/app/components/Input';
import { apiRequest, type AuthUser } from '@/app/lib/api';

export default function AuthPage() {
  const router = useRouter();
  const { setUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setActiveTab(params.get('tab') === 'register' ? 'register' : 'login');
  }, []);

  const switchTab = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    router.replace(tab === 'register' ? '/auth?tab=register' : '/auth');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    const endpoint = activeTab === 'login' ? '/api/auth/login' : '/api/auth/register';
    const payload = activeTab === 'login' ? { login, password } : { login, password, name };

    try {
      const response = await apiRequest<{ user: AuthUser }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setUser(response.user);
      router.push(response.user.role === 'admin' ? '/admin' : '/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось выполнить вход');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif] flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 sm:py-16">
        <div className="w-full max-w-[360px] sm:max-w-[400px] flex flex-col gap-8 sm:gap-10">
          <div className="flex items-center gap-2 justify-center">
            <Button
              variant={activeTab === 'login' ? 'dark' : 'outline'}
              size="md"
              onClick={() => switchTab('login')}
            >
              Вход
            </Button>
            <Button
              variant={activeTab === 'register' ? 'dark' : 'outline'}
              size="md"
              onClick={() => switchTab('register')}
            >
              Регистрация
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {activeTab === 'register' && (
              <InputGray
                type="text"
                placeholder="Имя"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            )}
            <InputGray
              type="text"
              placeholder="Логин"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              required
            />
            <InputGray
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />

            {error && <p className="text-sm text-q-danger">{error}</p>}

            <Button
              variant="dark"
              size="md"
              fullWidth
              className="mt-2"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? 'Загрузка...'
                : activeTab === 'login'
                  ? 'Войти'
                  : 'Зарегистрироваться'}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
