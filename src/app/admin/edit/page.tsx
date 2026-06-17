'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';

import { useAuth } from '@/app/auth-provider';
import { AdminNav } from '@/app/components/AdminNav';
import { Button } from '@/app/components/Button';
import { Footer } from '@/app/components/Footer';
import { Header } from '@/app/components/Header';
import { InputGray, InputWhite } from '@/app/components/Input';
import { apiRequest, catalogLabelToCategory, type ProductDetail, uploadProductImages } from '@/app/lib/api';

const CATEGORIES = ['Чаи', 'Сиропы', 'Додавки', 'Drink Kits'] as const;
const TASTES = ['травяной', 'цитрусовый', 'ягодный', 'экзотический', 'слайдий'] as const;

interface ProductFormState {
  name: string;
  price: string;
  category: string;
  brand: string;
  customBrand: string;
  weight: string;
  tastes: string[];
}

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

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        onClick={onChange}
        className={[
          'size-4 rounded-[4px] border-2 flex items-center justify-center transition-all duration-150 shrink-0',
          checked ? 'border-q-dark bg-q-dark' : 'border-q-border group-hover:border-q-muted',
        ].join(' ')}
      >
        {checked && <span className="text-white text-[10px] leading-none">✓</span>}
      </div>
      <span className="text-q-dark text-base font-medium">{label}</span>
    </label>
  );
}

function toFormState(product: ProductDetail, knownBrands: string[]): ProductFormState {
  const hasKnownBrand = knownBrands.includes(product.brandName);

  return {
    name: product.name,
    price: String(product.price),
    category: product.category === 'tea'
      ? 'Чаи'
      : product.category === 'syrups'
        ? 'Сиропы'
        : product.category === 'additions'
          ? 'Додавки'
          : 'Drink Kits',
    brand: hasKnownBrand ? product.brandName : '__custom',
    customBrand: hasKnownBrand ? '' : product.brandName,
    weight: product.weightGrams ? String(product.weightGrams) : '',
    tastes: product.tastes,
  };
}

export default function AdminEditPage() {
  const router = useRouter();
  const { user, ready } = useAuth();
  const [brands, setBrands] = useState<string[]>([]);
  const [searchId, setSearchId] = useState('');
  const [foundProduct, setFoundProduct] = useState<ProductDetail | null>(null);
  const [originalForm, setOriginalForm] = useState<ProductFormState | null>(null);
  const [form, setForm] = useState<ProductFormState>({
    name: '',
    price: '',
    category: 'Чаи',
    brand: '',
    customBrand: '',
    weight: '',
    tastes: [],
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

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

  const toggleTaste = (taste: string) => {
    setForm((current) => ({
      ...current,
      tastes: current.tastes.includes(taste)
        ? current.tastes.filter((item) => item !== taste)
        : [...current.tastes, taste],
    }));
  };

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearching(true);
    setError('');
    setStatusMessage('');

    try {
      const response = await apiRequest<{ item: ProductDetail }>(`/api/admin/products/${searchId}`);
      const nextBrands = brands.includes(response.item.brandName)
        ? brands
        : [...brands, response.item.brandName];

      setBrands(nextBrands);
      setFoundProduct(response.item);
      const nextForm = toFormState(response.item, nextBrands);
      setForm(nextForm);
      setOriginalForm(nextForm);
      setSelectedFiles([]);
    } catch (requestError) {
      setFoundProduct(null);
      setOriginalForm(null);
      setError(requestError instanceof Error ? requestError.message : 'Товар не найден');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!foundProduct || !originalForm) {
      return;
    }

    setIsSaving(true);
    setError('');
    setStatusMessage('');

    try {
      const payload: Record<string, unknown> = {};
      const currentBrandName = form.brand === '__custom' ? form.customBrand.trim() : form.brand.trim();
      const originalBrandName =
        originalForm.brand === '__custom' ? originalForm.customBrand.trim() : originalForm.brand.trim();

      if (form.name !== originalForm.name) payload.name = form.name;
      if (form.price !== originalForm.price) payload.price = Number(form.price);
      if (form.category !== originalForm.category) {
        const category = catalogLabelToCategory(form.category);
        if (!category) {
          throw new Error('Некорректная категория');
        }
        payload.category = category;
      }
      if (currentBrandName !== originalBrandName) payload.brandName = currentBrandName;
      if (form.weight !== originalForm.weight) payload.weightGrams = form.weight ? Number(form.weight) : null;
      if (JSON.stringify(form.tastes) !== JSON.stringify(originalForm.tastes)) payload.tastes = form.tastes;

      if (selectedFiles.length > 0) {
        if (selectedFiles.length > 10) {
          throw new Error('Можно выбрать не больше 10 изображений');
        }

        payload.imageUrls = await uploadProductImages(selectedFiles);
      }

      if (Object.keys(payload).length === 0) {
        setStatusMessage('Изменений нет');
        return;
      }

      const response = await apiRequest<{ item: ProductDetail }>(`/api/admin/products/${foundProduct.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const nextBrands = brands.includes(response.item.brandName)
        ? brands
        : [...brands, response.item.brandName];

      setBrands(nextBrands);
      setFoundProduct(response.item);
      const nextForm = toFormState(response.item, nextBrands);
      setForm(nextForm);
      setOriginalForm(nextForm);
      setSelectedFiles([]);
      setStatusMessage('Товар изменён');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Не удалось изменить товар');
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen bg-white font-[Manrope,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto py-8 sm:py-10">
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-10 items-start">
          <div className="w-full lg:w-[48%] xl:w-[600px] shrink-0">
            <div className="bg-q-surface rounded-q-panel p-8 flex flex-col gap-8">
              <h1 className="text-q-dark text-[36px] sm:text-[48px] font-medium leading-[1.08]">
                Изменить товар
              </h1>

              {!ready ? (
                <p className="text-q-muted">Проверка доступа...</p>
              ) : !isAdmin ? (
                <p className="text-q-muted">{error || 'Доступ запрещен'}</p>
              ) : (
                <>
                  <form onSubmit={handleSearch} className="flex items-center gap-3">
                    <InputWhite
                      type="text"
                      placeholder="ID товара"
                      value={searchId}
                      onChange={(e) => setSearchId(e.target.value)}
                      className="flex-1"
                      required
                    />
                    <Button variant="dark" size="md" type="submit" icon={<Search size={18} />} disabled={isSearching}>
                      {isSearching ? 'Поиск...' : 'Найти'}
                    </Button>
                  </form>

                  {foundProduct && (
                    <form onSubmit={handleSave} className="flex flex-col gap-8">
                      <div className="flex flex-col gap-4">
                        <InputWhite
                          type="text"
                          placeholder="Название"
                          value={form.name}
                          onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
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
                                onChange={() => setForm((current) => ({ ...current, category }))}
                              />
                            ))}
                          </div>
                          <div className="flex-1">
                            <InputWhite
                              type="number"
                              placeholder="Цена"
                              value={form.price}
                              onChange={(e) => setForm((current) => ({ ...current, price: e.target.value }))}
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
                        <p className="text-q-dark text-base font-medium">Вес</p>
                        <InputWhite
                          type="number"
                          placeholder="Вес в граммах"
                          value={form.weight}
                          onChange={(e) => setForm((current) => ({ ...current, weight: e.target.value }))}
                        />
                        <div className="h-px bg-q-border" />
                      </div>

                      <div className="flex flex-col gap-4">
                        <p className="text-q-dark text-base font-medium">Вкусы</p>
                        <div className="flex flex-wrap gap-3">
                          {TASTES.map((taste) => (
                            <CheckboxItem
                              key={taste}
                              label={taste}
                              checked={form.tastes.includes(taste)}
                              onChange={() => toggleTaste(taste)}
                            />
                          ))}
                        </div>
                        <div className="h-px bg-q-border" />
                      </div>

                      <div className="flex flex-col gap-4">
                        <p className="text-q-dark text-base font-medium">Изображения товара</p>
                        <InputWhite
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          multiple
                          onChange={(e) => setSelectedFiles(Array.from(e.target.files ?? []))}
                        />
                        {selectedFiles.length > 0 ? (
                          <div className="text-q-muted text-sm flex flex-col gap-1">
                            {selectedFiles.map((file) => (
                              <span key={`${file.name}-${file.size}`}>{file.name}</span>
                            ))}
                          </div>
                        ) : foundProduct.images.length > 0 ? (
                          <div className="text-q-muted text-sm flex flex-col gap-1">
                            {foundProduct.images.map((image) => (
                              <span key={image}>{image}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      {error && <p className="text-sm text-q-danger">{error}</p>}
                      {statusMessage && <p className="text-sm text-q-dark">{statusMessage}</p>}

                      <Button variant="accent" size="md" fullWidth type="submit" disabled={isSaving}>
                        {isSaving ? 'Сохранение...' : 'Изменить'}
                      </Button>
                    </form>
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
