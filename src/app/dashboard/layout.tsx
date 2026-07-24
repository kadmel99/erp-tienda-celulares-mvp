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
    role: "ADMIN_GENERAL" | "OPERADOR";
    sucursalId: string | null;
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
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar role={user.role} userName={userName} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
