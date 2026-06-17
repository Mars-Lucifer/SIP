"use client";

import { useEffect, useState } from "react";
import { ImageOff, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/app/auth-provider";
import { useCart } from "@/app/cart-provider";

interface ProductCardProps {
  id: string | number;
  name: string;
  price: number;
  image?: string;
  cartQuantity?: number;
  cartDisabled?: boolean;
  onAddToCart?: () => void;
  onIncrementCart?: () => void;
  onDecrementCart?: () => void;
}

function averageColorFromImage(imageElement: HTMLImageElement): string {
  const canvas = document.createElement("canvas");
  const size = 24;
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) {
    return "";
  }

  context.drawImage(imageElement, 0, 0, size, size);

  try {
    const { data } = context.getImageData(0, 0, size, size);
    let red = 0;
    let green = 0;
    let blue = 0;
    let count = 0;

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3];
      if (alpha < 32) {
        continue;
      }

      red += data[index];
      green += data[index + 1];
      blue += data[index + 2];
      count += 1;
    }

    if (!count) {
      return "";
    }

    return `rgb(${Math.round(red / count)} ${Math.round(green / count)} ${Math.round(
      blue / count,
    )})`;
  } catch {
    return "";
  }
}

function toHoverTint(color: string): string {
  const match = color.match(/rgb\((\d+)\s+(\d+)\s+(\d+)\)/);
  if (!match) {
    return "rgba(207, 105, 70, 0.15)";
  }

  return `rgba(${match[1]}, ${match[2]}, ${match[3]}, 0.15)`;
}

/** Вставьте сюда SVG-скругление. Форма рассчитана на левую сторону кнопки. */
function CartTabCornerSvg() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="block"
    >
      <path
        d="M3.57628e-07 0C8.83656 0 16 7.16344 16 16V0H3.57628e-07Z"
        fill="white"
      />
    </svg>
  );
}

export function ProductCard({
  id,
  name,
  price,
  image,
  cartQuantity,
  cartDisabled = false,
  onAddToCart,
  onIncrementCart,
  onDecrementCart,
}: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { getProductQuantity, addProduct, incrementProduct, decrementProduct } =
    useCart();
  const resolvedProductId = typeof id === "number" ? id : Number(id);
  const resolvedQuantity =
    typeof cartQuantity === "number"
      ? cartQuantity
      : Number.isFinite(resolvedProductId)
        ? getProductQuantity(resolvedProductId)
        : 0;
  const [hoverTint, setHoverTint] = useState("rgba(207, 105, 70, 0.15)");

  useEffect(() => {
    if (!image) {
      return;
    }

    let cancelled = false;
    const preview = new window.Image();
    preview.crossOrigin = "anonymous";

    preview.onload = () => {
      if (cancelled) {
        return;
      }

      const dominant = averageColorFromImage(preview);
      if (dominant) {
        setHoverTint(toHoverTint(dominant));
      }
    };

    preview.src = image;

    return () => {
      cancelled = true;
      preview.onload = null;
      preview.onerror = null;
    };
  }, [image]);

  const handleAction = async (action: "add" | "increment" | "decrement") => {
    if (action === "add" && onAddToCart) {
      onAddToCart();
      return;
    }

    if (action === "increment" && onIncrementCart) {
      onIncrementCart();
      return;
    }

    if (action === "decrement" && onDecrementCart) {
      onDecrementCart();
      return;
    }

    if (!Number.isFinite(resolvedProductId)) {
      return;
    }

    if (!user) {
      router.push("/auth");
      return;
    }

    try {
      if (action === "add") {
        await addProduct(resolvedProductId);
      } else if (action === "increment") {
        await incrementProduct(resolvedProductId);
      } else {
        await decrementProduct(resolvedProductId);
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Не удалось обновить корзину";
      window.alert(message);
    }
  };

  return (
    <article className="group relative rounded-[40px] border border-q-border bg-white transition-[border-color,background-color] duration-300 hover:border-transparent">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-[40px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ backgroundColor: hoverTint }}
      />

      <div className="pointer-events-none absolute left-1/2 top-0 z-20 -translate-x-1/2 opacity-0 transition-opacity duration-300 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100">
        <button
          type="button"
          disabled={cartDisabled}
          className={[
            "pointer-events-auto relative inline-flex items-center gap-[10px] bg-white px-6 py-2 text-base font-medium text-q-dark rounded-b-2xl",
            cartDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
          ].join(" ")}
          onClick={() => handleAction("add")}
          aria-label={
            resolvedQuantity > 0
              ? `Добавлено в корзину: ${resolvedQuantity}`
              : "Добавить в корзину"
          }
        >
          <span aria-hidden className="pointer-events-none absolute -left-4 top-0 size-4">
            <CartTabCornerSvg />
          </span>
          <span aria-hidden className="pointer-events-none absolute -right-4 top-0 size-4 -scale-x-100">
            <CartTabCornerSvg />
          </span>

          {resolvedQuantity > 0 ? (
            <span>{`В корзине: ${resolvedQuantity}`}</span>
          ) : (
            <>
              <span>Добавить</span>
              <ShoppingCart size={18} strokeWidth={1.5} />
            </>
          )}
        </button>
      </div>

      <Link
        href={`/item/${id}`}
        className="relative flex flex-col overflow-hidden rounded-[40px] no-underline"
      >
        <div className="relative flex h-[249px] items-center justify-center p-5">
          {image ? (
            <img
              src={image}
              alt={name}
              className="max-h-full max-w-full flex-1 object-contain"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff size={40} className="text-q-border" />
            </div>
          )}
        </div>

        <div className="relative flex items-start gap-4 px-8 py-6">
          <p className="flex-1 text-2xl font-medium leading-[1.08] text-q-dark">
            {name}
          </p>

          <div className="flex shrink-0 items-end gap-1">
            <span className="text-lg font-medium leading-[1.08] text-q-muted">
              $
            </span>
            <span className="text-lg font-medium leading-[1.08] text-q-dark">
              {price.toLocaleString("ru-RU")}
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
