import { getPrisma } from "@/lib/prisma";
import { SucursalesList } from "./sucursales-list";

export default async function SucursalesPage() {
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const sucursales = await prisma.sucursal.findMany({ orderBy: { nombre: "asc" } });

  return (
    <div className="p-6">
      <SucursalesList sucursales={sucursales} />
    </div>
  );
}
