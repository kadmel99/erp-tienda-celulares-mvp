import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL = conexión directa (puerto 5432) — requerida para migrate (advisory locks).
    // DATABASE_URL = pooler de transaction mode — usada por Prisma Client en runtime.
    url: process.env["DIRECT_URL"] ?? process.env["DATABASE_URL"]!,
  },
});
