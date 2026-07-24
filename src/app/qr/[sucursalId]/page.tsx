import { getPrisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QrForm } from "./qr-form";

export default async function QrPage(props: { params: Promise<{ sucursalId: string }> }) {
  const { sucursalId } = await props.params;
  const prisma = getPrisma();
  if (!prisma) return <p className="p-8 text-center text-sm">Error de conexi&oacute;n</p>;

  const sucursal = await prisma.sucursal.findUnique({
    where: { id: sucursalId },
    select: { id: true, nombre: true },
  });

  if (!sucursal) notFound();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] p-4"
      style={{
        background: "repeating-linear-gradient(100deg, var(--bg-brush-a) 0px, var(--bg-brush-a) 1px, transparent 1px, transparent 3px), var(--color-bg)"
      }}>
      <div className="w-full max-w-md rounded-[14px] border border-[var(--color-line)] bg-[var(--color-panel)] p-8"
        style={{ boxShadow: "var(--shadow-panel)" }}>
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold text-[var(--color-ink)]">{sucursal.nombre}</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">D&eacute;janos tus datos y te contactamos</p>
        </div>
        <QrForm sucursalId={sucursal.id} />
      </div>
    </div>
  );
}
