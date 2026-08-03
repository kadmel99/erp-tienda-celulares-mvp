import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import Link from "next/link";
import { Header } from "@/components/header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role: string };
  if (user.role !== "ADMIN_GENERAL") redirect("/dashboard");

  const prisma = getPrisma();
  if (prisma) {
    const usuario = await prisma.usuario.findUnique({
      where: { id: user.id },
      select: { debeCambiarPassword: true },
    });
    if (usuario?.debeCambiarPassword) redirect("/cambiar-password");
  }

  const userName = session.user.name ?? session.user.email ?? "Usuario";

  return (
    <div>
      <Header
        left={
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
          >
            <span aria-hidden>&larr;</span> Volver al dashboard
          </Link>
        }
        userName={userName}
        roleLabel="Administrador General"
      />
      {children}
    </div>
  );
}
