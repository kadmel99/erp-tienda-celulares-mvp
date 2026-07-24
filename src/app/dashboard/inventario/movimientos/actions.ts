"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";
import type { InventoryMovementType } from "@/generated/prisma/enums";

export async function createMovement(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const productId = formData.get("productId") as string;
  const tipo = formData.get("tipo") as string;
  const cantidad = Number(formData.get("cantidad")) || 1;
  const motivo = (formData.get("motivo") as string)?.trim() || null;
  const userId = formData.get("userId") as string;

  if (!productId || !tipo || !userId) {
    return { error: "Producto, tipo y usuario son obligatorios" };
  }

  try {
    await prisma.inventoryMovement.create({
      data: { productId, tipo: tipo as InventoryMovementType, cantidad, motivo, userId },
    });
    revalidatePath("/dashboard/inventario/movimientos");
    return { success: true };
  } catch {
    return { error: "Error al registrar el movimiento" };
  }
}
