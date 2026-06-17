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
  const { getProductQuantity, addProduct, incrementProduct, decrementProduct } = useCart();
  const resolvedProductId = typeof id === "number" ? id : Number(id);
  const resolvedQuantity =
    typeof cartQuantity === "number"
      ? cartQuantity
      : Number.isFinite(resolvedProductId)
        ? getProductQuantity(resolvedProductId)
        : 0;
  const [tintColor, setTintColor] = useState("rgb(245 245 245)");

  useEffect(() => {
    if (!image) {
      setTintColor("rgb(245 245 245)");
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
        setTintColor(dominant);
      }
    };

    preview.onerror = () => {
      if (!cancelled) {
        setTintColor("rgb(245 245 245)");
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
        requestError instanceof Error ? requestError.message : "Не удалось обновить корзину";
      window.alert(message);
    }
  };

  return (
    <article
      className="group relative overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_12px_35px_rgba(31,33,40,0.06)] transition-transform duration-300 hover:-translate-y-1"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ backgroundColor: tintColor, opacity: 0.15 }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0.9)_100%)]" />

      <Link
        href={`/item/${id}`}
        className="relative flex h-full min-h-[390px] flex-col no-underline"
      >
        <div className="relative flex h-[250px] items-center justify-center overflow-hidden px-5 pt-8">
          {image ? (
            <img
              src={image}
              alt={name}
              className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ImageOff size={40} className="text-q-border" />
            </div>
          )}
        </div>

        <div className="relative mt-auto flex items-end justify-between gap-3 p-5 pt-4">
          <p className="text-q-dark text-[20px] font-medium leading-[1.1]">
            {name}
          </p>

          <div className="shrink-0 text-right font-medium leading-[1.08] whitespace-nowrap">
            <div className="text-q-dark text-[28px]">
              {price.toLocaleString("ru-RU")}
            </div>
            <div className="text-q-muted text-[18px]">$</div>
          </div>
        </div>
      </Link>

      <div className="pointer-events-none absolute inset-x-4 top-4 flex justify-center opacity-0 -translate-y-3 transition-all duration-300 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
        <button
          type="button"
          disabled={cartDisabled}
        className={[
            "pointer-events-auto inline-flex items-center gap-2.5 rounded-full border border-white/80 bg-white px-4 py-2.5 text-sm font-medium text-q-dark shadow-[0_12px_30px_rgba(31,33,40,0.12)] transition-all duration-200 active:scale-95",
            cartDisabled ? "cursor-not-allowed opacity-60" : "hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(31,33,40,0.14)]",
          ].join(" ")}
          onClick={() => handleAction("add")}
          aria-label={
            resolvedQuantity > 0
              ? `Добавлено в корзину: ${resolvedQuantity}`
              : "Добавить в корзину"
          }
        >
          {resolvedQuantity > 0 ? (
            <span>{`В корзине: ${resolvedQuantity}`}</span>
          ) : (
            <>
              <ShoppingCart size={16} />
              <span>Добавить в корзину</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
}
