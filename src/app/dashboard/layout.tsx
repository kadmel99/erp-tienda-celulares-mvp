import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Sidebar from "@/components/sidebar";
import { Header } from "@/components/header";

const ROLE_LABEL: Record<string, string> = {
  ADMIN_GENERAL: "Administrador General",
  OPERADOR: "Operador",
  REVISION_FISCAL: "Revisión Fiscal",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as {
    id: string;
    role: "ADMIN_GENERAL" | "OPERADOR" | "REVISION_FISCAL";
    sucursalId: string | null;
    sucursalIds: string[];
  };

  const prisma = getPrisma();

  if (prisma) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { debeCambiarPassword: true },
    });
    if (usuario?.debeCambiarPassword) redirect("/cambiar-password");
  }

  const userName = session.user.name ?? session.user.email ?? "Usuario";
  let sucursalLabel = "";

  if (prisma && user.sucursalId) {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: user.sucursalId },
      select: { nombre: true },
    });
    if (sucursal) sucursalLabel = sucursal.nombre;
  } else if (prisma && user.role === "REVISION_FISCAL" && user.sucursalIds.length > 0) {
    const sucursales = await prisma.sucursal.findMany({
      where: { id: { in: user.sucursalIds } },
      select: { nombre: true },
      orderBy: { nombre: "asc" },
    });
    sucursalLabel = sucursales.length > 3
      ? `${sucursales.length} sucursales asignadas`
      : sucursales.map((s) => s.nombre).join(", ");
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar role={user.role} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          left={
            sucursalLabel ? (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-ink-faint)]">
                  Sucursal en operaci&oacute;n
                </p>
                <p className="text-sm font-medium text-[var(--color-ink)]">{sucursalLabel}</p>
              </div>
            ) : (
              <span />
            )
          }
          userName={userName}
          roleLabel={ROLE_LABEL[user.role] ?? user.role}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
