import { getPrisma } from "@/lib/prisma";
import { UsuariosList } from "./usuarios-list";

export default async function UsuariosPage() {
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const [usuarios, sucursales] = await Promise.all([
    prisma.usuario.findMany({
      orderBy: { nombre: "asc" },
      include: { sucursal: { select: { nombre: true } } },
    }),
    prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  return (
    <div className="p-6">
      <UsuariosList usuarios={usuarios} sucursales={sucursales} />
    </div>
  );
}
