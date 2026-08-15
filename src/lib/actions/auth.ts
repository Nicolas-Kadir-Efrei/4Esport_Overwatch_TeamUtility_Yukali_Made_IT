"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

const registerSchema = z.object({
  displayName: z.string().min(2).max(40).trim(),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(100),
  battleTag: z.string().max(40).trim().optional(),
});

export type AuthActionState = {
  error?: string;
  success?: string;
};

export async function register(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    battleTag: formData.get("battleTag") || undefined,
  });

  if (!parsed.success) {
    return { error: "Vérifie les champs (mot de passe min. 8 caractères)." };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (existing) {
    return { error: "Cet email est déjà utilisé." };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      passwordHash,
      battleTag: parsed.data.battleTag || null,
    },
  });

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Compte créé, mais connexion automatique échouée. Connecte-toi." };
    }
    throw e;
  }

  redirect("/dashboard");
}

export async function login(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Identifiants incorrects." };
    }
    throw e;
  }

  redirect("/dashboard");
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
