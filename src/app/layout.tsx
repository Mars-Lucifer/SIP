import "../styles/index.css";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AuthProvider } from "@/app/auth-provider";
import { CartProvider } from "@/app/cart-provider";

export const metadata: Metadata = {
  title: "TechMarket",
  description: "TechMarket storefront",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
