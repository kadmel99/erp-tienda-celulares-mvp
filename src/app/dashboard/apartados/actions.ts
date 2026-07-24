"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import type { PaymentMethod, CashMovementType, ApartadoStatus } from "@/generated/prisma/enums";

export async function createApartado(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const sucursalId = formData.get("sucursalId") as string;
  const userId = formData.get("userId") as string;
  const clienteId = formData.get("clienteId") as string;
  const productId = formData.get("productId") as string;
  const valorTotal = Number(formData.get("valorTotal"));
  const abonoInicial = Number(formData.get("abonoInicial")) || 0;
  const metodoPago = formData.get("metodoPago") as string || "EFECTIVO";

  if (!sucursalId || !userId || !clienteId || !productId || !valorTotal) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const producto = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        select: { cantidad: true },
      });
      if (producto.cantidad < 1) {
        throw new Error("Sin stock disponible para apartar");
      }

      const apartado = await tx.apartado.create({
        data: {
          sucursalId,
          clienteId,
          productId,
          valorTotal,
          saldoPendiente: valorTotal - abonoInicial,
          userId,
        },
      });

      // Un apartado reserva exactamente 1 unidad — descuenta del stock en vez de
      // ocultar toda la fila, para que productos de lote (forros, cargadores, etc.)
      // sigan mostrando el resto disponible.
      const nuevaCantidad = producto.cantidad - 1;
      await tx.product.update({
        where: { id: productId },
        data: { cantidad: nuevaCantidad, disponible: nuevaCantidad > 0 },
      });

      await tx.inventoryMovement.create({
        data: {
          productId,
          tipo: "SALIDA",
          cantidad: 1,
          motivo: `Apartado #${apartado.id.slice(0, 8)}`,
          referenceType: "APARTADO",
          referenceId: apartado.id,
          userId,
        },
      });

      if (abonoInicial > 0) {
        await tx.abono.create({
          data: {
            apartadoId: apartado.id,
            monto: abonoInicial,
            metodoPago: metodoPago as PaymentMethod,
            userId,
          },
        });

        const session = await tx.cashRegisterSession.findFirst({
          where: { sucursalId, cerradaEn: null },
        });
        if (session) {
          await tx.cashMovement.create({
            data: {
              sessionId: session.id,
              tipo: "INGRESO_ABONO" as CashMovementType,
              monto: abonoInicial,
              concepto: `Abono inicial - Apartado #${apartado.id.slice(0, 8)}`,
              referenceId: apartado.id,
            },
          });
        }
      }
    });

    revalidatePath("/dashboard/apartados");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al crear el apartado" };
  }
}

export async function registrarAbono(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const apartadoId = formData.get("apartadoId") as string;
  const userId = formData.get("userId") as string;
  const monto = Number(formData.get("monto")) || 0;
  const metodoPago = formData.get("metodoPago") as string || "EFECTIVO";

  if (!apartadoId || !userId || !monto) {
    return { error: "Todos los campos son obligatorios" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const apartado = await tx.apartado.findUnique({
        where: { id: apartadoId },
      });
      if (!apartado) throw new Error("Apartado no encontrado");
      if (apartado.status !== "ACTIVO") throw new Error("El apartado no est\u00e1 activo");

      const nuevoSaldo = Number(apartado.saldoPendiente) - monto;

      await tx.abono.create({
        data: {
          apartadoId,
          monto,
          metodoPago: metodoPago as PaymentMethod,
          userId,
        },
      });

      if (nuevoSaldo <= 0) {
        await tx.apartado.update({
          where: { id: apartadoId },
          data: {
            saldoPendiente: 0,
            status: "SALDADO" as ApartadoStatus,
          },
        });

        const lastInvoice = await tx.invoice.findFirst({
          where: { sucursalId: apartado.sucursalId },
          orderBy: { numero: "desc" },
          select: { numero: true },
        });
        const nextNumero = (lastInvoice?.numero ?? 0) + 1;

        await tx.invoice.create({
          data: {
            sucursalId: apartado.sucursalId,
            saleId: "", // Will be linked when delivered
            numero: nextNumero,
            pdfUrl: "",
          },
        });
      } else {
        await tx.apartado.update({
          where: { id: apartadoId },
          data: { saldoPendiente: nuevoSaldo },
        });
      }

      const session = await tx.cashRegisterSession.findFirst({
        where: { sucursalId: apartado.sucursalId, cerradaEn: null },
      });
      if (session) {
        await tx.cashMovement.create({
          data: {
            sessionId: session.id,
            tipo: "INGRESO_ABONO" as CashMovementType,
            monto,
            concepto: `Abono - Apartado #${apartadoId.slice(0, 8)}`,
            referenceId: apartadoId,
          },
        });
      }
    });

    revalidatePath("/dashboard/apartados");
    return { success: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Error al registrar abono" };
  }
}

export async function registrarSeguimiento(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const apartadoId = formData.get("apartadoId") as string;
  const userId = formData.get("userId") as string;
  const nota = (formData.get("nota") as string)?.trim();
  const proximaAccion = (formData.get("proximaAccion") as string)?.trim() || null;

  if (!apartadoId || !userId || !nota) {
    return { error: "Nota es obligatoria" };
  }

  try {
    await prisma.carteraSeguimiento.create({
      data: { apartadoId, nota, proximaAccion, userId },
    });
    revalidatePath("/dashboard/apartados");
    return { success: true };
  } catch {
    return { error: "Error al registrar seguimiento" };
  }
}
