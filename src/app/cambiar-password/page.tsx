import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { CambiarPasswordForm } from "./cambiar-password-form";

export default async function CambiarPasswordPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const prisma = getPrisma();
  const usuario = prisma
    ? await prisma.usuario.findUnique({ where: { id: userId }, select: { debeCambiarPassword: true } })
    : null;

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div
          className="rounded-[16px] border border-[var(--color-line)] bg-[var(--color-panel)] p-9"
          style={{ boxShadow: "var(--shadow-panel)" }}
        >
          <div className="mb-6 flex flex-col items-center gap-1 text-center">
            <h1 className="text-lg font-semibold text-[var(--color-ink)]">Cambiar contraseña</h1>
            <p className="text-sm text-[var(--color-ink-soft)]">
              {usuario?.debeCambiarPassword
                ? "Por seguridad, debes establecer una contraseña propia antes de continuar."
                : "Establece una nueva contraseña para tu cuenta."}
            </p>
          </div>
          <CambiarPasswordForm forzado={!!usuario?.debeCambiarPassword} />
        </div>
      </div>
    </div>
  );
}
