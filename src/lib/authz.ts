import { auth } from "@/lib/auth";

/** Rechaza escrituras de server actions para el rol de solo lectura (Revisión Fiscal). */
export async function requireWriteAccess(): Promise<{ error: string } | null> {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === "REVISION_FISCAL") {
    return { error: "Tu rol (Revisión Fiscal) es de solo lectura" };
  }
  return null;
}
