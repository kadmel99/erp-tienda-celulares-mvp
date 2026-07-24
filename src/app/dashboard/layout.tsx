import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Sidebar from "@/components/sidebar";

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
  let userName = session.user.name ?? session.user.email ?? "Usuario";

  if (prisma && user.sucursalId) {
    const sucursal = await prisma.sucursal.findUnique({
      where: { id: user.sucursalId },
      select: { nombre: true },
    });
    if (sucursal) {
      userName = `${userName} — ${sucursal.nombre}`;
    }
  } else if (prisma && user.role === "REVISION_FISCAL" && user.sucursalIds.length > 0) {
    const sucursales = await prisma.sucursal.findMany({
      where: { id: { in: user.sucursalIds } },
      select: { nombre: true },
      orderBy: { nombre: "asc" },
    });
    if (sucursales.length > 0) {
      userName = `${userName} — ${sucursales.map((s) => s.nombre).join(", ")}`;
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} userName={userName} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
