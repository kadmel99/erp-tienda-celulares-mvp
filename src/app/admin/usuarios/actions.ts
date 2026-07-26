"use server";

import { getPrisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";

export async function createUsuario(formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const rol = formData.get("rol") as string;
  const sucursalId = (formData.get("sucursalId") as string) || null;
  const sucursalIds = formData.getAll("sucursalIds") as string[];

  if (!nombre || !email || !password || !rol) {
    return { error: "Todos los campos obligatorios deben estar llenos" };
  }

  if (rol === "OPERADOR" && !sucursalId) {
    return { error: "Un operador debe tener una sucursal asignada" };
  }

  if (rol === "REVISION_FISCAL" && sucursalIds.length === 0) {
    return { error: "Un revisor fiscal debe tener al menos una sucursal asignada" };
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const usuario = await prisma.usuario.create({
      data: {
        nombre,
        email,
        passwordHash,
        rol: rol as "ADMIN_GENERAL" | "OPERADOR" | "REVISION_FISCAL",
        sucursalId: rol === "OPERADOR" ? sucursalId : null,
        debeCambiarPassword: true,
      },
    });

    if (rol === "REVISION_FISCAL") {
      await prisma.usuarioSucursal.createMany({
        data: sucursalIds.map((sId) => ({ usuarioId: usuario.id, sucursalId: sId })),
      });
    }

    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { error: "Ya existe un usuario con ese email" };
    }
    return { error: "Error al crear el usuario" };
  }
}

export async function updateUsuario(id: string, formData: FormData) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  const nombre = (formData.get("nombre") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const rol = formData.get("rol") as string;
  const sucursalId = (formData.get("sucursalId") as string) || null;
  const sucursalIds = formData.getAll("sucursalIds") as string[];
  const password = formData.get("password") as string;

  if (!nombre || !email || !rol) {
    return { error: "Nombre, email y rol son obligatorios" };
  }

  if (rol === "OPERADOR" && !sucursalId) {
    return { error: "Un operador debe tener una sucursal asignada" };
  }

  if (rol === "REVISION_FISCAL" && sucursalIds.length === 0) {
    return { error: "Un revisor fiscal debe tener al menos una sucursal asignada" };
  }

  try {
    const data: Record<string, unknown> = {
      nombre,
      email,
      rol: rol as "ADMIN_GENERAL" | "OPERADOR" | "REVISION_FISCAL",
      sucursalId: rol === "OPERADOR" ? sucursalId : null,
    };
    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
      data.debeCambiarPassword = true;
    }
    await prisma.$transaction(async (tx) => {
      await tx.usuario.update({ where: { id }, data });
      await tx.usuarioSucursal.deleteMany({ where: { usuarioId: id } });
      if (rol === "REVISION_FISCAL" && sucursalIds.length > 0) {
        await tx.usuarioSucursal.createMany({
          data: sucursalIds.map((sId) => ({ usuarioId: id, sucursalId: sId })),
        });
      }
    });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return { error: "Ya existe un usuario con ese email" };
    }
    return { error: "Error al actualizar el usuario" };
  }
}

export async function toggleUsuarioActivo(id: string, activo: boolean) {
  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexi\u00f3n" };

  try {
    await prisma.usuario.update({ where: { id }, data: { activo } });
    revalidatePath("/admin/usuarios");
    return { success: true };
  } catch {
    return { error: "Error al cambiar estado" };
  }
}
