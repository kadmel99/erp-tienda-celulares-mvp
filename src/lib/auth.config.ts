import type { NextAuthConfig } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

type SessionUser = {
  id: string;
  role: UserRole;
  sucursalId: string | null;
  sucursalIds: string[];
};

export const authConfig = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      const isOnAdmin = nextUrl.pathname.startsWith("/admin");
      const isOnAuth = nextUrl.pathname.startsWith("/login");

      if (isOnAdmin) {
        if (!isLoggedIn) return false;
        if ((auth?.user as SessionUser)?.role !== "ADMIN_GENERAL") {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      if (isOnDashboard) {
        return isLoggedIn;
      }

      if (isOnAuth && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        const u = user as SessionUser;
        token.id = u.id;
        token.role = u.role;
        token.sucursalId = u.sucursalId;
        token.sucursalIds = u.sucursalIds;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.sucursalId = (token.sucursalId as string | null) ?? null;
        session.user.sucursalIds = (token.sucursalIds as string[] | undefined) ?? [];
      }
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
