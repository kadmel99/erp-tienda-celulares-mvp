import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Zona iOS — Gestión",
  description: "Sistema de gestión comercial multi-sucursal — Zona iOS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
