import { Minus, Plus, ShoppingCart } from 'lucide-react';

import { Button } from '@/app/components/Button';

interface CartQuantityControlProps {
  quantity: number;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  disabled?: boolean;
  className?: string;
}

export function CartQuantityControl({
  quantity,
  onAdd,
  onIncrement,
  onDecrement,
  disabled = false,
  className = '',
}: CartQuantityControlProps) {
  if (quantity <= 0) {
    return (
      <Button
        variant="accent"
        size="md"
        className={className}
        icon={<ShoppingCart size={18} />}
        onClick={onAdd}
        disabled={disabled}
      >
        Добавить в корзину
      </Button>
    );
  }

  return (
    <div
      className={[
        'inline-flex items-center rounded-q-pill border border-q-border bg-white overflow-hidden',
        className,
      ].join(' ')}
    >
      <button
        type="button"
        className="size-11 flex items-center justify-center text-q-dark transition-colors duration-150 hover:bg-q-surface disabled:text-q-muted disabled:hover:bg-white"
        onClick={onDecrement}
        disabled={disabled}
        aria-label="Уменьшить количество"
      >
        <Minus size={16} />
      </button>
      <div className="min-w-[72px] px-3 text-center text-base font-medium text-q-dark select-none">
        {quantity}
      </div>
      <button
        type="button"
        className="size-11 flex items-center justify-center text-q-dark transition-colors duration-150 hover:bg-q-surface disabled:text-q-muted disabled:hover:bg-white"
        onClick={onIncrement}
        disabled={disabled}
        aria-label="Увеличить количество"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
