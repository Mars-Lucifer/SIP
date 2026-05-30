'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { Button } from './Button';

interface AdminNavProps {
  layout?: 'wrap' | 'stack';
  className?: string;
}

const navItems = [
  { label: 'Добавление товара', href: '/admin' },
  { label: 'Удаление товара', href: '/admin/remove' },
  { label: 'Изменение товара', href: '/admin/edit' },
  { label: 'Заказы', href: '/admin/orders' },
  { label: 'Новости', href: '/admin/news' },
];

export function AdminNav({ layout = 'wrap', className = '' }: AdminNavProps) {
  const pathname = usePathname();
  const isStack = layout === 'stack';

  return (
    <div className={[isStack ? 'flex flex-col gap-3' : 'flex flex-wrap gap-3', className].join(' ')}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={isStack ? 'no-underline w-full' : 'no-underline'}
        >
          <Button
            variant={pathname === item.href ? 'dark' : 'outlineMuted'}
            size="md"
            fullWidth={isStack}
          >
            {item.label}
          </Button>
        </Link>
      ))}
    </div>
  );
}
