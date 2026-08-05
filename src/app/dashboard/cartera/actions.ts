"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import type { PaymentMethod, CashMovementType } from "@/generated/prisma/enums";

export async function registrarAbonoVenta(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const saleId = formData.get("saleId") as string;
  const userId = formData.get("userId") as string;
  const monto = Number(formData.get("monto")) || 0;
  const metodoPago = (formData.get("metodoPago") as string) || "EFECTIVO";

  if (!saleId || !userId || !monto) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.findUnique({ where: { id: saleId } });
      if (!sale) throw new Error("Venta no encontrada");
      if (Number(sale.saldoPendiente) <= 0) throw new Error("Esta venta ya está saldada");
      if (monto > Number(sale.saldoPendiente)) throw new Error("El abono no puede ser mayor al saldo pendiente");

      const nuevoSaldo = Number(sale.saldoPendiente) - monto;

      await tx.saleAbono.create({
        data: { saleId, monto, metodoPago: metodoPago as PaymentMethod, userId },
      });

      await tx.sale.update({
        where: { id: saleId },
        data: {
          saldoPendiente: nuevoSaldo,
          montoPagado: Number(sale.montoPagado) + monto,
        },
      });

      const session = await tx.cashRegisterSession.findFirst({
        where: { sucursalId: sale.sucursalId, cerradaEn: null },
      });
      if (session) {
        await tx.cashMovement.create({
          data: {
            sessionId: session.id,
            tipo: "INGRESO_ABONO" as CashMovementType,
            monto,
            concepto: `Abono - Venta #${saleId.slice(0, 8)}`,
            referenceId: saleId,
          },
        });
      }
    });

    revalidatePath("/dashboard/cartera");
    revalidatePath("/dashboard/caja");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al registrar el abono" };
  }
}
