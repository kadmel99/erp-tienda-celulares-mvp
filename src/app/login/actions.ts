"use server";
import { signIn } from "@/lib/auth";

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    const err = error as { type?: string; digest?: string };
    if (err?.digest?.startsWith("NEXT_REDIRECT")) throw error;
    if (err?.type === "CredentialsSignin") return "Credenciales inválidas";
    return "Error al iniciar sesión";
  }
}
