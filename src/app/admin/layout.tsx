import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string };
  if (user.role !== "ADMIN_GENERAL") redirect("/dashboard");

  return (
    <div>
      <div className="border-b border-[var(--color-line)] bg-[var(--color-panel)] px-6 py-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
        >
          <span aria-hidden>&larr;</span> Volver al dashboard
        </Link>
      </div>
      {children}
    </div>
  );
}
