"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, X } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { useCart } from "@/app/cart-provider";
import { Button } from "./Button";
import { InputSearch } from "./Input";

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export function Header({
  isLoggedIn = false,
  userName = "Никита",
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { itemCount, clearCartState } = useCart();

  const resolvedIsLoggedIn = ready ? Boolean(user) : isLoggedIn;
  const resolvedUserName = user?.name ?? userName;
  const isAdmin = user?.role === "admin";

  const navLinks = [
    { label: "Каталог", href: "/catalog" },
    { label: "Корзина", href: "/basket" },
    { label: "Заказы", href: "/orders" },
    ...(isAdmin ? [{ label: "Админ", href: "/admin" }] : []),
  ];

  const handleLogout = async () => {
    await logout();
    clearCartState();
    setMenuOpen(false);
    router.push("/");
  };

  const renderNavLink = (
    link: { label: string; href: string },
    mobile = false,
  ) => {
    const isBasket = link.href === "/basket";
    const showBadge = isBasket && itemCount > 0;
    const isActive = pathname === link.href;

    return (
      <Link
        key={link.href}
        href={link.href}
        onClick={() => {
          if (mobile) {
            setMenuOpen(false);
          }
        }}
        className={[
          "inline-flex items-center gap-2 rounded-full no-underline transition-colors duration-150",
          mobile
            ? "w-full justify-between px-5 py-3 text-base font-medium"
            : "px-[18px] py-3 text-base font-medium whitespace-nowrap",
          isActive
            ? "bg-q-surface text-q-dark"
            : "text-q-dark hover:bg-q-surface/80",
        ].join(" ")}
      >
        <span>{link.label}</span>
        {showBadge ? (
          <span className="min-w-5 h-5 px-1 rounded-full bg-q-danger text-white text-xs font-medium inline-flex items-center justify-center">
            {itemCount}
          </span>
        ) : null}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-50 isolate w-full px-4 sm:px-6 xl:px-[60px] pt-4 sm:pt-5">
      <div className="max-w-[1320px] mx-auto rounded-full border border-white/70 bg-white/60 px-4 sm:px-5 lg:px-6 py-3.5 backdrop-blur-md !shadow-none">
        <div className="flex items-center gap-4 sm:gap-5 xl:gap-10">
          <Link
            href="/"
            className="flex items-center gap-3 shrink-0 no-underline group"
          >
            <div className="size-8 shrink-0 overflow-hidden rounded-[10px]">
              <img
                src="/assets/icons/logo.svg"
                alt="logo"
                className="w-full h-full"
              />
            </div>
            <span className="text-q-dark text-2xl font-medium leading-none whitespace-nowrap transition-opacity group-hover:opacity-80">
              SIP Market
            </span>
          </Link>

          <div className="hidden md:flex flex-1 min-w-0 max-w-[520px]">
            <InputSearch
              placeholder="Поиск"
              tone="white"
              radius="input"
              border="muted"
              className="h-[52px]"
            />
          </div>

          <nav className="hidden lg:flex items-center gap-1 shrink-0">
            {navLinks.map((link) => renderNavLink(link))}

            {resolvedIsLoggedIn ? (
              <div className="flex items-center gap-2 pl-2">
                <Button
                  as="a"
                  href="/orders"
                  variant="dark"
                  size="md"
                  icon={<User size={18} />}
                >
                  {resolvedUserName}
                </Button>
                <Button variant="fillGray" size="md" onClick={handleLogout}>
                  Выйти
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2">
                <Button as="a" href="/auth" variant="dark" size="md">
                  Войти
                </Button>
                <Button
                  as="a"
                  href="/auth?tab=register"
                  variant="accent"
                  size="md"
                >
                  Зарегистрироваться
                </Button>
              </div>
            )}
          </nav>

          <button
            className="lg:hidden ml-auto text-q-dark p-1 transition-transform duration-150 active:scale-95"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Меню"
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div
        className={[
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out max-w-[1320px] mx-auto",
          menuOpen ? "max-h-[32rem] opacity-100 mt-3" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="rounded-[28px] border border-white/70 bg-white/70 backdrop-blur-md p-4 !shadow-none">
          <div className="flex flex-col gap-2">
            <div className="md:hidden pb-2">
              <InputSearch
                placeholder="Поиск"
                tone="white"
                radius="input"
                border="muted"
              />
            </div>
            {navLinks.map((link) => renderNavLink(link, true))}
          </div>

          <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-q-border">
            {resolvedIsLoggedIn ? (
              <>
                <Button
                  as="a"
                  href="/orders"
                  variant="dark"
                  fullWidth
                  icon={<User size={18} />}
                  onClick={() => setMenuOpen(false)}
                >
                  {resolvedUserName}
                </Button>
                <Button variant="fillGray" fullWidth onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Button
                  as="a"
                  href="/auth"
                  variant="dark"
                  fullWidth
                  onClick={() => setMenuOpen(false)}
                >
                  Войти
                </Button>
                <Button
                  as="a"
                  href="/auth?tab=register"
                  variant="accent"
                  fullWidth
                  onClick={() => setMenuOpen(false)}
                >
                  Зарегистрироваться
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
