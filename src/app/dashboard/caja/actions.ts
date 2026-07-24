"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import type { CashMovementType } from "@/generated/prisma/enums";

export async function abrirCaja(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const sucursalId = formData.get("sucursalId") as string;
  const userId = formData.get("userId") as string;
  const saldoInicial = Number(formData.get("saldoInicial")) || 0;

  if (!sucursalId || !userId) {
    return { error: "Datos incompletos" };
  }

  try {
    const existing = await prisma.cashRegisterSession.findFirst({
      where: { sucursalId, cerradaEn: null },
    });
    if (existing) {
      return { error: "Ya hay una sesi\u00f3n de caja abierta" };
    }

    await prisma.cashRegisterSession.create({
      data: { sucursalId, userId, saldoInicial },
    });
    revalidatePath("/dashboard/caja");
    return { success: true };
  } catch {
    return { error: "Error al abrir caja" };
  }
}

export async function cerrarCaja(sessionId: string, formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const saldoFinalContado = Number(formData.get("saldoFinalContado")) || 0;

  try {
    const session = await prisma.cashRegisterSession.findUnique({
      where: { id: sessionId },
      include: {
        movimientos: {
          select: { tipo: true, monto: true },
        },
      },
    });

    if (!session) return { error: "Sesi\u00f3n no encontrada" };
    if (session.cerradaEn) return { error: "La sesi\u00f3n ya est\u00e1 cerrada" };

    const totalIngresos = session.movimientos
      .filter((m) => m.tipo.startsWith("INGRESO"))
      .reduce((s, m) => s + Number(m.monto), 0);
    const totalEgresos = session.movimientos
      .filter((m) => m.tipo === "EGRESO_CAJA_MENOR" || m.tipo === "OTRO")
      .reduce((s, m) => s + Number(m.monto), 0);

    const saldoFinalEsperado = Number(session.saldoInicial) + totalIngresos - totalEgresos;
    const diferencia = saldoFinalContado - saldoFinalEsperado;

    await prisma.cashRegisterSession.update({
      where: { id: sessionId },
      data: {
        saldoFinalEsperado,
        saldoFinalContado,
        diferencia,
        cerradaEn: new Date(),
      },
    });
    revalidatePath("/dashboard/caja");
    return { success: true };
  } catch {
    return { error: "Error al cerrar caja" };
  }
}

export async function registrarMovimiento(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const sessionId = formData.get("sessionId") as string;
  const tipo = formData.get("tipo") as string;
  const monto = Number(formData.get("monto")) || 0;
  const concepto = (formData.get("concepto") as string)?.trim() || null;

  if (!sessionId || !tipo || !monto) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    await prisma.cashMovement.create({
      data: {
        sessionId,
        tipo: tipo as CashMovementType,
        monto,
        concepto,
      },
    });
    revalidatePath("/dashboard/caja");
    return { success: true };
  } catch {
    return { error: "Error al registrar movimiento" };
  }
}
