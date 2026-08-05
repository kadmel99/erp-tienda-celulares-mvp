"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import type { PaymentMethod, CashMovementType, InventoryMovementType } from "@/generated/prisma/enums";

export async function createSale(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const sucursalId = formData.get("sucursalId") as string;
  const userId = formData.get("userId") as string;
  const metodoPago = formData.get("metodoPago") as string;
  const total = Number(formData.get("total"));
  const clienteId = (formData.get("clienteId") as string) || null;
  const itemsJson = formData.get("items") as string;
  const montoPagadoRaw = formData.get("montoPagado") as string;
  const montoPagado = montoPagadoRaw ? Number(montoPagadoRaw) : total;

  if (!sucursalId || !userId || !metodoPago || !total || !itemsJson) {
    return { error: "Datos incompletos" };
  }
  if (montoPagado < 0 || montoPagado > total) {
    return { error: "El monto pagado no puede ser negativo ni mayor al total" };
  }
  if (montoPagado < total && !clienteId) {
    return { error: "Una venta a crédito necesita un cliente asociado" };
  }

  const saldoPendiente = total - montoPagado;
  const items = JSON.parse(itemsJson) as { productId: string; price: number; qty?: number }[];

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          sucursalId,
          clienteId,
          userId,
          total,
          montoPagado,
          saldoPendiente,
          metodoPago: metodoPago as PaymentMethod,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              precioUnit: item.price,
              cantidad: item.qty && item.qty > 0 ? item.qty : 1,
            })),
          },
        },
      });

      for (const item of items) {
        const qty = item.qty && item.qty > 0 ? item.qty : 1;
        const producto = await tx.product.findUniqueOrThrow({
          where: { id: item.productId },
          select: { cantidad: true },
        });
        if (producto.cantidad < qty) {
          throw new Error(`Stock insuficiente para ${item.productId}`);
        }
        const nuevaCantidad = producto.cantidad - qty;
        await tx.product.update({
          where: { id: item.productId },
          data: { cantidad: nuevaCantidad, disponible: nuevaCantidad > 0 },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            tipo: "SALIDA" as InventoryMovementType,
            cantidad: qty,
            userId,
            referenceType: "sale",
            referenceId: sale.id,
          },
        });
      }

      if (montoPagado > 0) {
        const session = await tx.cashRegisterSession.findFirst({
          where: { sucursalId, cerradaEn: null },
        });
        if (session) {
          await tx.cashMovement.create({
            data: {
              sessionId: session.id,
              tipo: "INGRESO_VENTA" as CashMovementType,
              monto: montoPagado,
              concepto: saldoPendiente > 0
                ? `Venta #${sale.id.slice(0, 8)} (abono inicial)`
                : `Venta #${sale.id.slice(0, 8)}`,
              referenceId: sale.id,
            },
          });
        }
      }

      const lastInvoice = await tx.invoice.findFirst({
        where: { sucursalId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const nextNumero = (lastInvoice?.numero ?? 0) + 1;

      const invoice = await tx.invoice.create({
        data: {
          sucursalId,
          saleId: sale.id,
          numero: nextNumero,
          pdfUrl: "",
        },
      });

      return { id: sale.id, numero: nextNumero, invoiceId: invoice.id };
    });

    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/cartera");
    return {
      success: true,
      saleId: result.id,
      numero: result.numero,
      invoiceId: result.invoiceId,
      saldoPendiente,
    };
  } catch {
    return { error: "Error al procesar la venta" };
  }
}

