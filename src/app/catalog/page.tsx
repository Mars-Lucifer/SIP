"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { Button } from "@/app/components/Button";
import { Footer } from "@/app/components/Footer";
import { Header } from "@/app/components/Header";
import { InputField, InputSearch } from "@/app/components/Input";
import { ProductCard } from "@/app/components/ProductCard";
import {
  apiRequest,
  catalogLabelToCategory,
  labelToGraphicsType,
  labelToProcessor,
  type ProductListItem,
} from "@/app/lib/api";

const CATEGORIES = ["Все", "Ноутбуки", "Мини ПК"] as const;
const SORT_OPTIONS = [
  { value: "popular", label: "По популярности" },
  { value: "rating", label: "По рейтингу" },
  { value: "price_asc", label: "(Цена) По возрастанию" },
  { value: "price_desc", label: "(Цена) По убыванию" },
] as const;
const GPU_TYPES = ["Встроенная", "Дискретная"] as const;
const PROCESSOR_OPTIONS = ["Intel", "AMD", "Arm", "Apple"] as const;

type CategoryKey = (typeof CATEGORIES)[number];
type SortKey = (typeof SORT_OPTIONS)[number]["value"];
type GpuType = (typeof GPU_TYPES)[number];

interface FilterState {
  category: CategoryKey;
  sort: SortKey;
  priceFrom: string;
  priceTo: string;
  brands: string[];
  screenFrom: string;
  screenTo: string;
  processor: string;
  ramFrom: string;
  ramTo: string;
  storageFrom: string;
  storageTo: string;
  gpu: "" | GpuType;
}

const INITIAL_FILTERS: FilterState = {
  category: "Все",
  sort: "popular",
  priceFrom: "",
  priceTo: "",
  brands: [],
  screenFrom: "",
  screenTo: "",
  processor: "",
  ramFrom: "",
  ramTo: "",
  storageFrom: "",
  storageTo: "",
  gpu: "",
};

const RANGE_KEYS = [
  "priceFrom",
  "priceTo",
  "screenFrom",
  "screenTo",
  "ramFrom",
  "ramTo",
  "storageFrom",
  "storageTo",
] as const;

type RangeKey = (typeof RANGE_KEYS)[number];

function sanitizeDigits(value: string): string {
  return value.replace(/[^\d.]/g, "");
}

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-q-dark text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function RadioGroup({
  name,
  options,
  value,
  onChange,
}: {
  name: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((option) => {
        const checked = value === option;
        return (
          <label
            key={option}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="radio"
              name={name}
              value={option}
              checked={checked}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              className={[
                "size-[18px] rounded-full bg-q-surface border flex items-center justify-center transition-all",
                checked
                  ? "border-q-dark"
                  : "border-q-border group-hover:border-q-muted",
              ].join(" ")}
            >
              {checked && (
                <span className="size-[8px] rounded-full bg-q-dark" />
              )}
            </span>
            <span
              className={[
                "text-base transition-colors",
                checked ? "text-q-dark" : "text-q-muted",
              ].join(" ")}
            >
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function CheckboxGroup({
  options,
  values,
  onToggle,
}: {
  options: string[];
  values: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 max-h-52 overflow-auto pr-1">
      {options.map((option) => {
        const checked = values.includes(option);
        return (
          <label
            key={option}
            className="inline-flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onToggle(option)}
              className="sr-only"
            />
            <span
              className={[
                "size-[18px] rounded-[6px] border flex items-center justify-center transition-all",
                checked
                  ? "bg-q-dark border-q-dark"
                  : "bg-q-surface border-q-border group-hover:border-q-muted",
              ].join(" ")}
            >
              {checked && <img src="/assets/icons/check.svg" alt="chech" />}
            </span>
            <span
              className={[
                "text-base transition-colors",
                checked ? "text-q-dark" : "text-q-muted",
              ].join(" ")}
            >
              {option}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function RangeInputs({
  fromPlaceholder,
  toPlaceholder,
  fromValue,
  toValue,
  onFromChange,
  onToChange,
  onFromCommit,
  onToCommit,
}: {
  fromPlaceholder: string;
  toPlaceholder: string;
  fromValue: string;
  toValue: string;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onFromCommit: (value: string) => void;
  onToCommit: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <InputField
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={fromPlaceholder}
        value={fromValue}
        onChange={(e) => onFromChange(sanitizeDigits(e.target.value))}
        onBlur={(e) => onFromCommit(sanitizeDigits(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onFromCommit(sanitizeDigits(e.currentTarget.value));
          }
        }}
        tone="surface"
        border="muted"
        className="flex-1 min-w-0 px-3 py-2 text-sm"
      />
      <InputField
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        placeholder={toPlaceholder}
        value={toValue}
        onChange={(e) => onToChange(sanitizeDigits(e.target.value))}
        onBlur={(e) => onToCommit(sanitizeDigits(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onToCommit(sanitizeDigits(e.currentTarget.value));
          }
        }}
        tone="surface"
        border="muted"
        className="flex-1 min-w-0 px-3 py-2 text-sm"
      />
    </div>
  );
}

export default function CatalogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<FilterState>(INITIAL_FILTERS);
  const [products, setProducts] = useState<ProductListItem[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const supportsScreenFilter = filters.category !== "Мини ПК";

  useEffect(() => {
    let cancelled = false;

    apiRequest<{ items: Array<{ id: number; name: string }> }>("/api/brands")
      .then((response) => {
        if (!cancelled) {
          setBrands(response.items.map((item) => item.name));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBrands([]);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams();

    const category = catalogLabelToCategory(filters.category);
    if (category) {
      params.set("category", category);
    }

    params.set("sort", filters.sort);

    if (filters.priceFrom) params.set("priceFrom", filters.priceFrom);
    if (filters.priceTo) params.set("priceTo", filters.priceTo);
    if (supportsScreenFilter && filters.screenFrom) params.set("screenFrom", filters.screenFrom);
    if (supportsScreenFilter && filters.screenTo) params.set("screenTo", filters.screenTo);
    if (filters.ramFrom) params.set("ramFrom", filters.ramFrom);
    if (filters.ramTo) params.set("ramTo", filters.ramTo);
    if (filters.storageFrom) params.set("storageFrom", filters.storageFrom);
    if (filters.storageTo) params.set("storageTo", filters.storageTo);
    if (filters.processor) {
      const processor = labelToProcessor(filters.processor);
      if (processor) params.set("processor", processor);
    }
    if (filters.gpu) {
      const graphicsType = labelToGraphicsType(filters.gpu);
      if (graphicsType) params.set("graphicsType", graphicsType);
    }
    for (const brand of filters.brands) {
      params.append("brand", brand);
    }
    if (search) {
      params.set("search", search.trim().toLowerCase());
    }

    setIsLoading(true);

    apiRequest<{ total: number; items: ProductListItem[] }>(
      `/api/products?${params.toString()}`,
    )
      .then((response) => {
        if (!cancelled) {
          setProducts(response.items);
          setTotal(response.total);
          setError("");
        }
      })
      .catch((requestError: Error) => {
        if (!cancelled) {
          setProducts([]);
          setTotal(0);
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
  }, [filters, search, supportsScreenFilter]);

  const updateInstantFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K],
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const updateDraftRange = (key: RangeKey, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
  };

  const commitRangeField = (key: RangeKey, value: string) => {
    setDraftFilters((prev) => ({ ...prev, [key]: value }));
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const commitSearch = (value: string) => {
    setSearchInput(value);
    setSearch(value.trim());
  };

  const toggleBrand = (brand: string) => {
    const nextBrands = filters.brands.includes(brand)
      ? filters.brands.filter((item) => item !== brand)
      : [...filters.brands, brand];
    updateInstantFilter("brands", nextBrands);
  };

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setDraftFilters(INITIAL_FILTERS);
    setSearchInput("");
    setSearch("");
  };

  const handleAddToCart = async (productId: number) => {
    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      await apiRequest("/api/cart/items", {
        method: "POST",
        body: JSON.stringify({ productId }),
      });
      window.alert("Товар добавлен в корзину");
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Не удалось добавить товар";
      window.alert(message);
    }
  };

  const sortLabelMap = Object.fromEntries(
    SORT_OPTIONS.map((item) => [item.value, item.label]),
  ) as Record<SortKey, string>;

  const renderFilterPanel = () => (
    <div className="bg-q-surface rounded-q-card p-5 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-q-muted">
          Найдено: <span className="text-q-dark font-semibold">{total}</span>
        </p>
        <Button variant="outlineMuted" size="sm" onClick={clearFilters}>
          Сбросить
        </Button>
      </div>

      <FilterSection title="Категория">
        <RadioGroup
          name="category-filter"
          options={CATEGORIES}
          value={filters.category}
          onChange={(value) => {
            const nextCategory = value as CategoryKey;
            setFilters((prev) => ({
              ...prev,
              category: nextCategory,
              screenFrom: nextCategory === "Мини ПК" ? "" : prev.screenFrom,
              screenTo: nextCategory === "Мини ПК" ? "" : prev.screenTo,
            }));
            setDraftFilters((prev) => ({
              ...prev,
              category: nextCategory,
              screenFrom: nextCategory === "Мини ПК" ? "" : prev.screenFrom,
              screenTo: nextCategory === "Мини ПК" ? "" : prev.screenTo,
            }));
          }}
        />
      </FilterSection>

      <FilterSection title="Сортировка">
        <RadioGroup
          name="sort-filter"
          options={SORT_OPTIONS.map((item) => item.label)}
          value={sortLabelMap[filters.sort]}
          onChange={(label) => {
            const selected = SORT_OPTIONS.find((item) => item.label === label);
            if (selected) {
              updateInstantFilter("sort", selected.value);
            }
          }}
        />
      </FilterSection>

      <FilterSection title="Цена">
        <RangeInputs
          fromPlaceholder="От ₽"
          toPlaceholder="До ₽"
          fromValue={draftFilters.priceFrom}
          toValue={draftFilters.priceTo}
          onFromChange={(value) => updateDraftRange("priceFrom", value)}
          onToChange={(value) => updateDraftRange("priceTo", value)}
          onFromCommit={(value) => commitRangeField("priceFrom", value)}
          onToCommit={(value) => commitRangeField("priceTo", value)}
        />
      </FilterSection>

      <FilterSection title="Бренд">
        <CheckboxGroup
          options={brands}
          values={filters.brands}
          onToggle={toggleBrand}
        />
      </FilterSection>

      {supportsScreenFilter && (
        <FilterSection title="Диагональ экрана">
          <RangeInputs
            fromPlaceholder='От "'
            toPlaceholder='До "'
            fromValue={draftFilters.screenFrom}
            toValue={draftFilters.screenTo}
            onFromChange={(value) => updateDraftRange("screenFrom", value)}
            onToChange={(value) => updateDraftRange("screenTo", value)}
            onFromCommit={(value) => commitRangeField("screenFrom", value)}
            onToCommit={(value) => commitRangeField("screenTo", value)}
          />
        </FilterSection>
      )}

      <FilterSection title="Процессор">
        <RadioGroup
          name="processor-filter"
          options={["Любой", ...PROCESSOR_OPTIONS]}
          value={filters.processor || "Любой"}
          onChange={(value) =>
            updateInstantFilter("processor", value === "Любой" ? "" : value)
          }
        />
      </FilterSection>

      <FilterSection title="ОЗУ">
        <RangeInputs
          fromPlaceholder="От Гб"
          toPlaceholder="До Гб"
          fromValue={draftFilters.ramFrom}
          toValue={draftFilters.ramTo}
          onFromChange={(value) => updateDraftRange("ramFrom", value)}
          onToChange={(value) => updateDraftRange("ramTo", value)}
          onFromCommit={(value) => commitRangeField("ramFrom", value)}
          onToCommit={(value) => commitRangeField("ramTo", value)}
        />
      </FilterSection>

      <FilterSection title="Накопитель">
        <RangeInputs
          fromPlaceholder="От Гб"
          toPlaceholder="До Гб"
          fromValue={draftFilters.storageFrom}
          toValue={draftFilters.storageTo}
          onFromChange={(value) => updateDraftRange("storageFrom", value)}
          onToChange={(value) => updateDraftRange("storageTo", value)}
          onFromCommit={(value) => commitRangeField("storageFrom", value)}
          onToCommit={(value) => commitRangeField("storageTo", value)}
        />
      </FilterSection>

      <FilterSection title="Видеокарта">
        <RadioGroup
          name="gpu-filter"
          options={["Любая", ...GPU_TYPES]}
          value={filters.gpu || "Любая"}
          onChange={(value) =>
            updateInstantFilter(
              "gpu",
              (value === "Любая" ? "" : value) as FilterState["gpu"],
            )
          }
        />
      </FilterSection>
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-[Inter,sans-serif]">
      <Header />

      <main className="px-4 sm:px-6 xl:px-[60px] max-w-[1440px] mx-auto py-8 sm:py-10">
        <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
          <Button
            variant={filtersOpen ? "dark" : "outlineMuted"}
            size="md"
            icon={
              filtersOpen ? <X size={18} /> : <SlidersHorizontal size={18} />
            }
            iconPosition="right"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            Фильтры
          </Button>
          <span className="text-sm text-q-muted">
            Найдено: <span className="text-q-dark font-semibold">{total}</span>
          </span>
        </div>

        <div className="flex gap-8 xl:gap-10 items-start">
          <aside className="shrink-0 w-[220px] xl:w-[240px] hidden lg:block">
            {renderFilterPanel()}
          </aside>

          {filtersOpen && (
            <div className="lg:hidden fixed inset-0 z-40 flex">
              <button
                type="button"
                className="flex-1 bg-black/40"
                onClick={() => setFiltersOpen(false)}
                aria-label="Закрыть фильтры"
              />
              <div className="w-72 bg-white h-full overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-medium text-q-dark">Фильтры</h2>
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    aria-label="Закрыть"
                  >
                    <X size={20} className="text-q-muted" />
                  </button>
                </div>
                {renderFilterPanel()}
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="mb-6">
              <InputSearch
                placeholder="Поиск по названию"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onBlur={(e) => commitSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitSearch(e.currentTarget.value);
                  }
                }}
                tone="surface"
                radius="input"
                border="muted"
              />
            </div>

            {error ? (
              <div className="py-20 text-center text-q-muted">{error}</div>
            ) : isLoading ? (
              <div className="py-20 text-center text-q-muted">
                Загрузка товаров...
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={product.price}
                    image={product.image ?? undefined}
                  />
                ))}
              </div>
            ) : (
              <div className="py-20 text-center flex flex-col items-center gap-4">
                <p className="text-q-muted text-base font-medium">
                  По выбранным фильтрам ничего не найдено
                </p>
                <Button variant="outlineMuted" onClick={clearFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
