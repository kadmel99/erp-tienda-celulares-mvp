"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import React from "react";
import { renderToStream } from "@react-pdf/renderer";
import { HallazgosReportePDF } from "@/lib/pdf/hallazgos-reporte";
import type { HallazgoTipo, HallazgoSeveridad } from "@/generated/prisma/enums";

export async function crearHallazgo(formData: FormData) {
  const session = await auth();
  const user = session?.user as { id: string; role: string; sucursalIds: string[] } | undefined;
  if (!user || (user.role !== "ADMIN_GENERAL" && user.role !== "REVISION_FISCAL")) {
    return { error: "No autorizado" };
  }

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const sucursalId = formData.get("sucursalId") as string;
  const tipo = formData.get("tipo") as string;
  const severidad = (formData.get("severidad") as string) || "MEDIA";
  const titulo = (formData.get("titulo") as string)?.trim();
  const descripcion = (formData.get("descripcion") as string)?.trim();

  if (!sucursalId || !tipo || !titulo || !descripcion) {
    return { error: "Todos los campos son obligatorios" };
  }

  if (user.role === "REVISION_FISCAL" && !user.sucursalIds.includes(sucursalId)) {
    return { error: "No tienes acceso a esa sucursal" };
  }

  try {
    await prisma.hallazgo.create({
      data: {
        sucursalId,
        tipo: tipo as HallazgoTipo,
        severidad: severidad as HallazgoSeveridad,
        titulo,
        descripcion,
        userId: user.id,
      },
    });
    revalidatePath("/dashboard/auditoria");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al crear el hallazgo" };
  }
}

export async function resolverHallazgo(id: string) {
  const session = await auth();
  const user = session?.user as { id: string; role: string } | undefined;
  if (!user || user.role !== "ADMIN_GENERAL") {
    return { error: "Solo el administrador puede marcar hallazgos como resueltos" };
  }

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  try {
    await prisma.hallazgo.update({
      where: { id },
      data: { status: "RESUELTO", resolvedAt: new Date(), resolvedBy: user.id },
    });
    revalidatePath("/dashboard/auditoria");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "Error al resolver el hallazgo" };
  }
}

export async function generarReportePDF(hallazgoIds: string[]): Promise<string | { error: string }> {
  if (hallazgoIds.length === 0) return { error: "No hay hallazgos para incluir en el reporte" };

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const hallazgos = await prisma.hallazgo.findMany({
    where: { id: { in: hallazgoIds } },
    orderBy: { createdAt: "desc" },
    include: { sucursal: { select: { nombre: true } } },
  });

  const autorIds = Array.from(new Set(hallazgos.map((h) => h.userId)));
  const autores = autorIds.length > 0
    ? await prisma.usuario.findMany({ where: { id: { in: autorIds } }, select: { id: true, nombre: true } })
    : [];
  const autorPorId = new Map(autores.map((a) => [a.id, a.nombre]));

  try {
    const stream = await (renderToStream as (el: React.ReactElement) => ReturnType<typeof renderToStream>)(
      React.createElement(HallazgosReportePDF, {
        hallazgos: hallazgos.map((h) => ({
          sucursal: h.sucursal.nombre,
          tipo: h.tipo,
          severidad: h.severidad,
          titulo: h.titulo,
          descripcion: h.descripcion,
          status: h.status,
          autor: autorPorId.get(h.userId) ?? "—",
          createdAt: h.createdAt,
        })),
        generadoEn: new Date(),
      })
    );

    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const pdfBuffer = Buffer.concat(chunks);
    const base64 = pdfBuffer.toString("base64");
    return `data:application/pdf;base64,${base64}`;
  } catch {
    return { error: "Error al generar el reporte" };
  }
}
