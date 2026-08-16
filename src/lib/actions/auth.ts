"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  clientIpFromHeaders,
  rateLimit,
} from "@/lib/security/rate-limit";
import { passwordPolicyHint, passwordSchema } from "@/lib/security/safe";

const registerSchema = z.object({
  displayName: z.string().min(2).max(40).trim(),
  email: z.email().trim().toLowerCase(),
  password: passwordSchema,
  battleTag: z.string().max(40).trim().optional(),
});

export type AuthActionState = {
  error?: string;
  success?: string;
};

async function throttle(action: string, email?: string) {
  const h = await headers();
  const ip = clientIpFromHeaders(h);
  const ipHit = rateLimit(`auth:${action}:ip:${ip}`, 10, 15 * 60 * 1000);
  if (!ipHit.ok) {
    return `Trop de tentatives. Réessaie dans ${ipHit.retryAfterSec}s.`;
  }
  if (email) {
    const mailHit = rateLimit(
      `auth:${action}:email:${email}`,
      5,
      15 * 60 * 1000,
    );
    if (!mailHit.ok) {
      return `Trop de tentatives pour cet email. Réessaie dans ${mailHit.retryAfterSec}s.`;
    }
  }
  return null;
}

export async function register(
  _prev: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const emailRaw = String(formData.get("email") ?? "")
    .toLowerCase()
    .trim();
  const blocked = await throttle("register", emailRaw);
  if (blocked) return { error: blocked };

  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
    battleTag: formData.get("battleTag") || undefined,
  });

  if (!parsed.success) {
    return {
      error: `Vérifie les champs (${passwordPolicyHint()})`,
    };
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  });
  if (existing) {
    // Message volontairement générique (anti-énumération partielle)
    return { error: "Impossible de créer ce compte. Essayez un autre email." };
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
      return {
        error: "Compte créé, mais connexion automatique échouée. Connecte-toi.",
      };
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

  const blocked = await throttle("login", email || undefined);
  if (blocked) return { error: blocked };

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
