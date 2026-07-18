# Zona iOS — Sistema de Gestión Comercial

Proyecto independiente (no forma parte del repo de Tithelio). Ver especificación funcional y de datos completa en [`SPEC-MVP.md`](./SPEC-MVP.md).

## Stack

Next.js 16 (App Router) + TypeScript · Tailwind CSS v4 · Prisma 7 sobre Supabase Postgres · NextAuth v5 (Credentials) · Supabase Storage · @react-pdf/renderer · Nodemailer.

## Primeros pasos

1. Crear un proyecto en [Supabase](https://supabase.com) y copiar las cadenas de conexión (pooled y directa).
2. Copiar `.env.example` a `.env` y completar las variables (`DATABASE_URL`, `DIRECT_URL`, credenciales SMTP, `AUTH_SECRET`).
3. Instalar dependencias:
   ```
   npm install
   ```
4. Aplicar el esquema y sembrar el usuario administrador inicial:
   ```
   npm run db:migrate:dev
   npm run db:seed
   ```
5. Levantar el servidor de desarrollo:
   ```
   npm run dev
   ```
6. Login inicial: `admin@tienda.com` / `changeme123` (definido en `prisma/seed.ts` — cambiar tras el primer ingreso).

## Alcance de este MVP

Ver sección 9 de `SPEC-MVP.md` para lo que queda **fuera** de este MVP (facturación electrónica DIAN real, operación offline, campañas por WhatsApp) y por qué.
