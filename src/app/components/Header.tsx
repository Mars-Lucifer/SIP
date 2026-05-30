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
          mobile
            ? "text-base font-medium py-2 no-underline transition-colors duration-150"
            : "text-base font-medium leading-normal transition-colors duration-150 no-underline whitespace-nowrap",
          pathname === link.href
            ? "text-q-dark"
            : "text-q-muted hover:text-q-dark",
          isBasket ? "inline-flex items-center gap-2" : "",
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
    <header className="sticky z-50 isolate top-0 w-full px-4 sm:px-6 xl:px-[60px] py-4 sm:py-5">
      <div className="absolute pointer-events-none z-[-10] h-full sm:h-1/2 top-0 left-4 right-4 sm:left-6 sm:right-6 xl:left-[60px] xl:right-[60px] bg-white" />
      <div className="bg-q-surface rounded-q-input px-4 sm:px-5 py-3.5 flex items-center gap-4 sm:gap-6 xl:gap-10 max-w-[1320px] mx-auto">
        <Link
          href="/"
          className="flex items-center gap-3.5 shrink-0 group no-underline"
        >
          <div className="size-8 shrink-0">
            <img
              src="/assets/icons/logo.svg"
              alt="logo"
              className="w-full h-full"
            />
          </div>
          <span className="text-q-dark font-medium text-2xl leading-normal whitespace-nowrap transition-opacity group-hover:opacity-75">
            TechMarket
          </span>
        </Link>

        <div className="hidden sm:flex flex-1 min-w-0">
          {/* <InputSearch placeholder="Поиск" tone="white" /> */}
        </div>

        <nav className="hidden md:flex items-center gap-6 xl:gap-10 shrink-0">
          {navLinks.map((link) => renderNavLink(link))}

          {resolvedIsLoggedIn ? (
            <div className="flex items-center gap-2">
              <Link href="/orders" className="no-underline">
                <button className="bg-q-dark text-white rounded-q-pill px-[18px] py-3 text-base font-medium flex items-center gap-2.5 hover:bg-q-dark-soft transition-colors duration-150 whitespace-nowrap cursor-pointer">
                  {resolvedUserName}
                  <User size={18} />
                </button>
              </Link>
              <Button variant="outlineMuted" size="md" onClick={handleLogout}>
                Выйти
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/auth">
                <Button variant="dark" size="md">
                  Войти
                </Button>
              </Link>
              <Link href="/auth?tab=register">
                <Button variant="accent" size="md">
                  Зарегистрироваться
                </Button>
              </Link>
            </div>
          )}
        </nav>

        <button
          className="md:hidden ml-auto text-q-dark p-1 transition-transform duration-150 active:scale-95"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Меню"
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* <div className="sm:hidden mt-2 px-0">
        <InputSearch placeholder="Поиск" tone="white" border="strong" />
      </div> */}

      <div
        className={[
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out max-w-[1320px] mx-auto",
          menuOpen ? "max-h-96 opacity-100 mt-2" : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <div className="bg-q-surface rounded-q-input p-4 flex flex-col gap-3">
          {navLinks.map((link) => renderNavLink(link, true))}
          <div className="flex flex-col gap-2 pt-2 border-t border-q-border">
            {resolvedIsLoggedIn ? (
              <>
                <Link href="/orders" onClick={() => setMenuOpen(false)}>
                  <Button variant="dark" fullWidth>
                    {resolvedUserName} <User size={18} />
                  </Button>
                </Link>
                <Button variant="outlineMuted" fullWidth onClick={handleLogout}>
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth" onClick={() => setMenuOpen(false)}>
                  <Button variant="dark" fullWidth>
                    Войти
                  </Button>
                </Link>
                <Link
                  href="/auth?tab=register"
                  onClick={() => setMenuOpen(false)}
                >
                  <Button variant="accent" fullWidth>
                    Зарегистрироваться
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
