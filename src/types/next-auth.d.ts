import type { DefaultSession } from "next-auth";
import type { UserRole } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface User {
    role: UserRole;
    sucursalId: string | null;
    sucursalIds: string[];
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      sucursalId: string | null;
      sucursalIds: string[];
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    sucursalId: string | null;
    sucursalIds: string[];
  }
}
