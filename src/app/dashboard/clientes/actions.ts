"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireWriteAccess } from "@/lib/authz";

function revalidateClientUsers() {
  revalidatePath("/dashboard/clientes");
  revalidatePath("/dashboard/pos");
  revalidatePath("/dashboard/apartados");
}

export async function createClient(formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const correo = (formData.get("correo") as string)?.trim() || null;
  const ciudad = (formData.get("ciudad") as string)?.trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio" };

  try {
    const client = await prisma.cliente.create({
      data: { nombre, telefono, correo, ciudad },
    });
    revalidateClientUsers();
    return { success: true, client };
  } catch {
    return { error: "Error al crear el cliente" };
  }
}

export async function updateCliente(id: string, formData: FormData) {
  const denied = await requireWriteAccess();
  if (denied) return denied;

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const telefono = (formData.get("telefono") as string)?.trim() || null;
  const correo = (formData.get("correo") as string)?.trim() || null;
  const ciudad = (formData.get("ciudad") as string)?.trim() || null;

  if (!nombre) return { error: "El nombre es obligatorio" };

  try {
    await prisma.cliente.update({
      where: { id },
      data: { nombre, telefono, correo, ciudad },
    });
    revalidateClientUsers();
    return { success: true };
  } catch {
    return { error: "Error al actualizar el cliente" };
  }
}
