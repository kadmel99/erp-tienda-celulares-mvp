"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import type { PaymentMethod, CashMovementType, InventoryMovementType } from "@/generated/prisma/enums";

export async function createSale(formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const sucursalId = formData.get("sucursalId") as string;
  const userId = formData.get("userId") as string;
  const metodoPago = formData.get("metodoPago") as string;
  const total = Number(formData.get("total"));
  const clienteId = (formData.get("clienteId") as string) || null;
  const itemsJson = formData.get("items") as string;

  if (!sucursalId || !userId || !metodoPago || !total || !itemsJson) {
    return { error: "Datos incompletos" };
  }

  const items = JSON.parse(itemsJson) as { productId: string; price: number }[];

  try {
    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          sucursalId,
          clienteId,
          userId,
          total,
          metodoPago: metodoPago as PaymentMethod,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              precioUnit: item.price,
            })),
          },
        },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { disponible: false },
        });
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            tipo: "SALIDA" as InventoryMovementType,
            cantidad: 1,
            userId,
            referenceType: "sale",
            referenceId: sale.id,
          },
        });
      }

      const session = await tx.cashRegisterSession.findFirst({
        where: { sucursalId, cerradaEn: null },
      });
      if (session) {
        await tx.cashMovement.create({
          data: {
            sessionId: session.id,
            tipo: "INGRESO_VENTA" as CashMovementType,
            monto: total,
            concepto: `Venta #${sale.id.slice(0, 8)}`,
            referenceId: sale.id,
          },
        });
      }

      const lastInvoice = await tx.invoice.findFirst({
        where: { sucursalId },
        orderBy: { numero: "desc" },
        select: { numero: true },
      });
      const nextNumero = (lastInvoice?.numero ?? 0) + 1;

      await tx.invoice.create({
        data: {
          sucursalId,
          saleId: sale.id,
          numero: nextNumero,
          pdfUrl: "",
        },
      });

      return { id: sale.id, numero: nextNumero };
    });

    revalidatePath("/dashboard/inventario");
    revalidatePath("/dashboard/pos");
    return { success: true, saleId: result.id, numero: result.numero };
  } catch {
    return { error: "Error al procesar la venta" };
  }
}

export async function searchClients(query: string) {
  const prisma = getPrisma();
  if (!prisma || !query.trim()) return [];

  const clients = await prisma.cliente.findMany({
    where: {
      OR: [
        { nombre: { contains: query.trim(), mode: "insensitive" } },
        { telefono: { contains: query.trim(), mode: "insensitive" } },
        { correo: { contains: query.trim(), mode: "insensitive" } },
      ],
    },
    take: 10,
    orderBy: { nombre: "asc" },
  });

  return clients;
}

export async function createClient(formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const correo = (formData.get("correo") as string)?.trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio" };

  try {
    const client = await prisma.cliente.create({
      data: { nombre, telefono, correo },
    });
    revalidatePath("/dashboard/pos");
    return { success: true, client };
  } catch {
    return { error: "Error al crear el cliente" };
  }
}
