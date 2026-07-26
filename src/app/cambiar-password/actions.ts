"use server";

import { getPrisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

export async function cambiarPassword(formData: FormData) {
  const session = await auth();
  if (!session?.user) return { error: "Sesión inválida, vuelve a iniciar sesión" };

  const userId = (session.user as { id: string }).id;

  const passwordActual = formData.get("passwordActual") as string;
  const passwordNueva = formData.get("passwordNueva") as string;
  const passwordConfirmar = formData.get("passwordConfirmar") as string;

  if (!passwordActual || !passwordNueva || !passwordConfirmar) {
    return { error: "Todos los campos son obligatorios" };
  }
  if (passwordNueva.length < 8) {
    return { error: "La nueva contraseña debe tener al menos 8 caracteres" };
  }
  if (passwordNueva !== passwordConfirmar) {
    return { error: "Las contraseñas nuevas no coinciden" };
  }
  if (passwordNueva === passwordActual) {
    return { error: "La nueva contraseña debe ser distinta a la actual" };
  }

  const prisma = getPrisma();
  if (!prisma) return { error: "Error de conexión" };

  try {
    const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
    if (!usuario) return { error: "Usuario no encontrado" };

    const esValida = await bcrypt.compare(passwordActual, usuario.passwordHash);
    if (!esValida) return { error: "La contraseña actual es incorrecta" };

    const passwordHash = await bcrypt.hash(passwordNueva, 10);
    await prisma.usuario.update({
      where: { id: userId },
      data: { passwordHash, debeCambiarPassword: false },
    });
  } catch {
    return { error: "Error al actualizar la contraseña" };
  }

  redirect("/dashboard");
}
