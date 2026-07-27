import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ClientesClient } from "./clientes-client";

export default async function ClientesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string };
  if (user.role === "REVISION_FISCAL") redirect("/dashboard");

  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const clientes = await prisma.cliente.findMany({
    orderBy: { nombre: "asc" },
    include: {
      _count: { select: { ventas: true, apartados: true } },
    },
  });

  return (
    <div className="p-6">
      <ClientesClient clientes={clientes} />
    </div>
  );
}
