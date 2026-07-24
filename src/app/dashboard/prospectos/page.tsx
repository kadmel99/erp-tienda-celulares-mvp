import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";
import { ProspectosClient } from "./prospectos-client";
import QRCode from "qrcode";

export default async function ProspectosPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { role: string; sucursalId: string | null };
  const prisma = getPrisma();
  if (!prisma) return <p className="p-6 text-[var(--color-ink-soft)]">Error de conexi&oacute;n</p>;

  const isAdmin = user.role === "ADMIN_GENERAL";
  const sucursalId = user.sucursalId;

  const [prospectos, sucursales] = await Promise.all([
    prisma.prospecto.findMany({
      where: isAdmin ? {} : { sucursalId: sucursalId ?? "" },
      orderBy: { createdAt: "desc" },
      take: 200,
      include: { sucursal: { select: { nombre: true } } },
    }),
    isAdmin ? prisma.sucursal.findMany({ where: { activa: true } }) : Promise.resolve([]),
  ]);

  const currentSucursal = isAdmin && sucursales.length > 0
    ? sucursales[0]
    : sucursalId ? await prisma.sucursal.findUnique({ where: { id: sucursalId } }) : null;

  let qrDataUrl: string | null = null;
  if (currentSucursal) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    qrDataUrl = await QRCode.toDataURL(`${baseUrl}/qr/${currentSucursal.id}`, { width: 200, margin: 1 });
  }

  return (
    <div className="p-6">
      <ProspectosClient
        prospectos={prospectos}
        sucursales={sucursales}
        isAdmin={isAdmin}
        qrDataUrl={qrDataUrl}
        sucursalNombre={currentSucursal?.nombre ?? null}
      />
    </div>
  );
}
