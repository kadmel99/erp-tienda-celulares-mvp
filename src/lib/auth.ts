import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { getPrisma } from "./prisma";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string };
        if (!email || !password) return null;

        const prisma = getPrisma();
        if (!prisma) return null;

        const usuario = await prisma.usuario.findUnique({ where: { email } });
        if (!usuario || !usuario.activo) return null;

        const isValid = await bcrypt.compare(password, usuario.passwordHash);
        if (!isValid) return null;

        let sucursalIds: string[] = [];
        if (usuario.rol === "REVISION_FISCAL") {
          const asignaciones = await prisma.usuarioSucursal.findMany({
            where: { usuarioId: usuario.id },
            select: { sucursalId: true },
          });
          sucursalIds = asignaciones.map((a) => a.sucursalId);
        }

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nombre,
          role: usuario.rol,
          sucursalId: usuario.sucursalId,
          sucursalIds,
        };
      },
    }),
  ],
});
