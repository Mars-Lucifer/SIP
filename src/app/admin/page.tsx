'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/app/auth-provider';
import { AdminNav } from '@/app/components/AdminNav';
import { Button } from '@/app/components/Button';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { InputGray, InputWhite } from '@/app/components/Input';
import {
  apiRequest,
  catalogLabelToCategory,
  labelToGraphicsType,
  labelToProcessor,
  uploadProductImages,
} from '@/app/lib/api';

const CATEGORIES = ['Ноутбуки', 'Мини ПК'];
const PROCESSORS = ['Intel', 'AMD', 'Arm', 'Apple'];
const GPU_TYPES = ['Встроенная', 'Дискретная'];

function RadioItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={[
          'size-4 rounded-full border-2 flex items-center justify-center transition-all duration-150 shrink-0',
          checked ? 'border-q-dark' : 'border-q-border group-hover:border-q-muted',
        ].join(' ')}
      >
        {checked && <div className="size-2 rounded-full bg-q-dark" />}
      </div>
      <span className="text-q-dark text-base font-medium">{label}</span>
    </label>
  );
}

export default function AdminAddPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [brands, setBrands] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: '',
    price: '',
    category: 'Ноутбуки',
    brand: '',
    customBrand: '',
    screen: '',
    ram: '',
    storage: '',
    processor: '',
    gpu: '',
    customGpu: '',
  });
  const isMiniPc = form.category === 'Мини ПК';

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
      return;
    }

    let cancelled = false;

    apiRequest<{ items: Array<{ id: number; name: string }> }>('/api/brands')
      .then((response) => {
        if (!cancelled) {
          setBrands(response.items.map((item) => item.name));
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setError(requestError.message);
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
      if (selectedFiles.length > 10) {
        throw new Error('Можно выбрать не больше 10 изображений');
      }

      const imageUrls = selectedFiles.length > 0 ? await uploadProductImages(selectedFiles) : [];
      const brandName = form.brand === '__custom' ? form.customBrand.trim() : form.brand.trim();

      await apiRequest('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name,
          category: catalogLabelToCategory(form.category),
          price: Number(form.price),
          brandName,
          screenInches: isMiniPc ? null : form.screen ? Number(form.screen) : null,
          processor: form.processor ? labelToProcessor(form.processor) : null,
          ramGb: form.ram ? Number(form.ram) : null,
          storageGb: form.storage ? Number(form.storage) : null,
          graphicsType: labelToGraphicsType(form.gpu),
          graphicsModel: form.gpu === 'Дискретная' ? form.customGpu.trim() : null,
          imageUrls,
        }),
      });

      setStatusMessage('Товар добавлен');
      setSelectedFiles([]);
      setForm({
        name: '',
        price: '',
        category: 'Ноутбуки',
        brand: '',
        customBrand: '',
        screen: '',
        ram: '',
        storage: '',
        processor: '',
        gpu: '',
        customGpu: '',
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось добавить товар');
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
                Добавить товар
              </h1>

              {!ready ? (
                <p className="text-q-muted">Проверка доступа...</p>
              ) : !isAdmin ? (
                <p className="text-q-muted">{error || 'Доступ запрещен'}</p>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-8">
                  <div className="flex flex-col gap-4">
                    <InputWhite
                      type="text"
                      placeholder="Название"
                      value={form.name}
                      onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                      required
                    />
                    <div className="h-px bg-q-border" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <div className="flex gap-5 items-start">
                      <div className="flex flex-col gap-2">
                        <p className="text-q-dark text-base font-medium">Категория</p>
                        {CATEGORIES.map((category) => (
                          <RadioItem
                            key={category}
                            label={category}
                            checked={form.category === category}
                            onChange={() =>
                              setForm((current) => ({
                                ...current,
                                category,
                                screen: category === 'Мини ПК' ? '' : current.screen,
                              }))
                            }
                          />
                        ))}
                      </div>
                      <div className="flex-1">
                        <InputWhite
                          type="number"
                          placeholder="Цена"
                          value={form.price}
                          onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div className="h-px bg-q-border" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-q-dark text-base font-medium">Бренд</p>
                    <div className="flex flex-wrap gap-3">
                      {brands.map((brand) => (
                        <RadioItem
                          key={brand}
                          label={brand}
                          checked={form.brand === brand}
                          onChange={() => setForm((current) => ({ ...current, brand, customBrand: '' }))}
                        />
                      ))}
                      <RadioItem
                        label="Добавить бренд"
                        checked={form.brand === '__custom'}
                        onChange={() => setForm((current) => ({ ...current, brand: '__custom' }))}
                      />
                    </div>
                    {form.brand === '__custom' && (
                      <InputGray
                        type="text"
                        placeholder="Новый бренд"
                        value={form.customBrand}
                        onChange={(e) => setForm((current) => ({ ...current, customBrand: e.target.value }))}
                        required
                      />
                    )}
                    <div className="h-px bg-q-border" />
                  </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-q-dark text-base font-medium">Характеристики</p>
                    <div className="flex flex-wrap gap-3">
                      {!isMiniPc && (
                        <InputWhite
                          type="number"
                          placeholder="Диагональ экрана"
                          className="w-36"
                          value={form.screen}
                          onChange={(e) => setForm((current) => ({ ...current, screen: e.target.value }))}
                        />
                      )}
                      <InputWhite
                        type="number"
                        placeholder="ОЗУ (Гб)"
                        className="w-28"
                        value={form.ram}
                        onChange={(e) => setForm((current) => ({ ...current, ram: e.target.value }))}
                      />
                      <InputWhite
                        type="number"
                        placeholder="Накопитель (Гб)"
                        className="w-36"
                        value={form.storage}
                        onChange={(e) => setForm((current) => ({ ...current, storage: e.target.value }))}
                      />
                    </div>

                    <p className="text-q-dark text-base font-medium">Процессор</p>
                    <div className="flex flex-wrap gap-3">
                      {PROCESSORS.map((processor) => (
                        <RadioItem
                          key={processor}
                          label={processor}
                          checked={form.processor === processor}
                          onChange={() => setForm((current) => ({ ...current, processor }))}
                        />
                      ))}
                    </div>

                    <p className="text-q-dark text-base font-medium">Видеокарта</p>
                    <div className="flex flex-wrap gap-3">
                      {GPU_TYPES.map((gpu) => (
                        <RadioItem
                          key={gpu}
                          label={gpu}
                          checked={form.gpu === gpu}
                          onChange={() => setForm((current) => ({ ...current, gpu, customGpu: '' }))}
                        />
                      ))}
                    </div>
                    {form.gpu === 'Дискретная' && (
                      <InputGray
                        type="text"
                        placeholder="Название видеокарты"
                        value={form.customGpu}
                        onChange={(e) => setForm((current) => ({ ...current, customGpu: e.target.value }))}
                        required
                      />
                    )}
                  </div>

                  <div className="flex flex-col gap-4">
                    <p className="text-q-dark text-base font-medium">Изображения товара</p>
                    <InputWhite
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      multiple
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="text-q-muted text-sm flex flex-col gap-1">
                        {selectedFiles.map((file) => (
                          <span key={`${file.name}-${file.size}`}>{file.name}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {error && <p className="text-sm text-q-danger">{error}</p>}
                  {statusMessage && <p className="text-sm text-q-dark">{statusMessage}</p>}

                  <Button variant="accent" size="md" fullWidth type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Добавление...' : 'Добавить'}
                  </Button>
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
