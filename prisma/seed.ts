import bcrypt from "bcrypt";
import { getPrisma } from "../src/lib/prisma";

async function main() {
  const prisma = getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL no está configurada — revisa tu archivo .env");
  }

  const sucursal = await prisma.sucursal.upsert({
    where: { id: "sucursal-medellin" },
    update: {},
    create: {
      id: "sucursal-medellin",
      nombre: "Medellín (Principal)",
      ciudad: "Medellín",
    },
  });

  const passwordHash = await bcrypt.hash("changeme123", 10);

  await prisma.usuario.upsert({
    where: { email: "admin@tienda.com" },
    update: {},
    create: {
      nombre: "Administrador General",
      email: "admin@tienda.com",
      passwordHash,
      rol: "ADMIN_GENERAL",
      sucursalId: sucursal.id,
    },
  });

  console.log("Seed completo. Login: admin@tienda.com / changeme123 (cámbiala después del primer ingreso).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
