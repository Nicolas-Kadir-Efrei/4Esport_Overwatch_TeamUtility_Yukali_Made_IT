"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { isUploadBlob, saveUploadedImage } from "@/lib/uploads";

export type AdminActionState = {
  error?: string;
  success?: string;
};

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/matches");
  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  revalidatePath("/teams");
  revalidatePath("/matches/history");
}

const teamSchema = z.object({
  name: z.string().min(2).max(60).trim(),
  tag: z
    .string()
    .min(2)
    .max(8)
    .trim()
    .transform((v) => v.toUpperCase()),
  description: z.string().max(400).trim().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .default("#FA9C1E"),
});

export async function adminCreateTeam(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || "#FA9C1E",
  });
  if (!parsed.success) return { error: "Données équipe invalides." };

  try {
    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        tag: parsed.data.tag,
        description: parsed.data.description || null,
        color: parsed.data.color,
      },
    });

    const logoFile = formData.get("logo");
    if (isUploadBlob(logoFile)) {
      const saved = await saveUploadedImage(logoFile, "teams", team.id);
      if ("error" in saved) return { error: saved.error };
      await prisma.team.update({
        where: { id: team.id },
        data: { logoUrl: saved.url },
      });
    }
  } catch {
    return { error: "Nom ou tag déjà utilisé." };
  }

  revalidateAll();
  return { success: "Équipe créée." };
}

export async function adminUpdateTeam(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Équipe manquante." };

  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    tag: formData.get("tag"),
    description: formData.get("description") || undefined,
    color: formData.get("color") || "#FA9C1E",
  });
  if (!parsed.success) return { error: "Données équipe invalides." };

  try {
    await prisma.team.update({
      where: { id },
      data: {
        name: parsed.data.name,
        tag: parsed.data.tag,
        description: parsed.data.description || null,
        color: parsed.data.color,
      },
    });

    const logoFile = formData.get("logo");
    if (isUploadBlob(logoFile)) {
      const saved = await saveUploadedImage(logoFile, "teams", id);
      if ("error" in saved) return { error: saved.error };
      await prisma.team.update({
        where: { id },
        data: { logoUrl: saved.url },
      });
    }
  } catch {
    return { error: "Impossible de modifier (nom/tag déjà pris ?)." };
  }

  revalidateAll();
  revalidatePath(`/teams/${id}`);
  return { success: "Équipe mise à jour." };
}

export async function adminDeleteTeam(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.team.delete({ where: { id } });
  revalidateAll();
  redirect("/admin/teams");
}

const matchSchema = z.object({
  teamId: z.string().min(1),
  opponent: z.string().min(2).max(80).trim(),
  title: z.string().max(80).trim().optional(),
  type: z.enum(["SCRIM", "TOURNAMENT", "RANKED", "OTHER"]),
  result: z.enum(["SCHEDULED", "WIN", "LOSS", "DRAW", "CANCELLED"]),
  score: z.string().max(40).trim().optional(),
  scheduledAt: z.string().min(1),
  notes: z.string().max(500).trim().optional(),
});

export async function adminCreateMatch(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const parsed = matchSchema.safeParse({
    teamId: formData.get("teamId"),
    opponent: formData.get("opponent"),
    title: formData.get("title") || undefined,
    type: formData.get("type") || "SCRIM",
    result: formData.get("result") || "SCHEDULED",
    score: formData.get("score") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "Formulaire match invalide." };

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) return { error: "Date invalide." };

  const match = await prisma.match.create({
    data: {
      teamId: parsed.data.teamId,
      opponent: parsed.data.opponent,
      title: parsed.data.title || null,
      type: parsed.data.type,
      result: parsed.data.result,
      score: parsed.data.score || null,
      scheduledAt: when,
      notes: parsed.data.notes || null,
      createdById: admin.id,
    },
  });

  const oppLogo = formData.get("opponentLogo");
  if (isUploadBlob(oppLogo)) {
    const saved = await saveUploadedImage(oppLogo, "opponents", match.id);
    if ("error" in saved) return { error: saved.error };
    await prisma.match.update({
      where: { id: match.id },
      data: { opponentLogoUrl: saved.url },
    });
  }

  revalidateAll();
  revalidatePath(`/matches/${match.id}`);
  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { success: "Match créé." };
}

export async function adminUpdateMatch(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Match manquant." };

  const parsed = matchSchema.safeParse({
    teamId: formData.get("teamId"),
    opponent: formData.get("opponent"),
    title: formData.get("title") || undefined,
    type: formData.get("type") || "SCRIM",
    result: formData.get("result") || "SCHEDULED",
    score: formData.get("score") || undefined,
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "Formulaire match invalide." };

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) return { error: "Date invalide." };

  await prisma.match.update({
    where: { id },
    data: {
      teamId: parsed.data.teamId,
      opponent: parsed.data.opponent,
      title: parsed.data.title || null,
      type: parsed.data.type,
      result: parsed.data.result,
      score: parsed.data.score || null,
      scheduledAt: when,
      notes: parsed.data.notes || null,
    },
  });

  const oppLogo = formData.get("opponentLogo");
  if (isUploadBlob(oppLogo)) {
    const saved = await saveUploadedImage(oppLogo, "opponents", id);
    if ("error" in saved) return { error: saved.error };
    await prisma.match.update({
      where: { id },
      data: { opponentLogoUrl: saved.url },
    });
  }

  revalidateAll();
  revalidatePath(`/matches/${id}`);
  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { success: "Match mis à jour." };
}

export async function adminDeleteMatch(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const match = await prisma.match.findUnique({ where: { id } });
  await prisma.match.delete({ where: { id } });
  revalidateAll();
  if (match) revalidatePath(`/teams/${match.teamId}`);
  redirect("/admin/matches");
}

export async function adminUpdateUser(
  _prev: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Utilisateur manquant." };

  const displayName = String(formData.get("displayName") ?? "").trim();
  const battleTag = String(formData.get("battleTag") ?? "").trim();
  const role = String(formData.get("role") ?? "PLAYER");
  const teamId = String(formData.get("teamId") ?? "");
  const teamRole = String(formData.get("teamRole") ?? "PLAYER");
  const password = String(formData.get("password") ?? "");

  if (displayName.length < 2) return { error: "Pseudo trop court." };
  if (!["ADMIN", "PLAYER"].includes(role)) return { error: "Rôle invalide." };
  if (!["CAPTAIN", "PLAYER"].includes(teamRole)) {
    return { error: "Rôle d'équipe invalide." };
  }
  if (id === admin.id && role !== "ADMIN") {
    return { error: "Tu ne peux pas te retirer le rôle admin." };
  }

  const data: {
    displayName: string;
    battleTag: string | null;
    role: "ADMIN" | "PLAYER";
    passwordHash?: string;
  } = {
    displayName,
    battleTag: battleTag || null,
    role: role as "ADMIN" | "PLAYER",
  };

  if (password) {
    if (password.length < 8) return { error: "Mot de passe min. 8 caractères." };
    data.passwordHash = await bcrypt.hash(password, 12);
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id }, data });

    const existing = await tx.teamMember.findUnique({ where: { userId: id } });

    if (!teamId) {
      if (existing) {
        await tx.teamMember.delete({ where: { userId: id } });
      }
    } else if (existing) {
      await tx.teamMember.update({
        where: { userId: id },
        data: {
          teamId,
          role: teamRole as "CAPTAIN" | "PLAYER",
        },
      });
    } else {
      await tx.teamMember.create({
        data: {
          userId: id,
          teamId,
          role: teamRole as "CAPTAIN" | "PLAYER",
        },
      });
    }
  });

  revalidateAll();
  return { success: "Utilisateur mis à jour." };
}

export async function adminDeleteUser(formData: FormData) {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id || id === admin.id) return;
  await prisma.user.delete({ where: { id } });
  revalidateAll();
  redirect("/admin/users");
}

export async function adminRemoveMember(formData: FormData) {
  await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const teamId = String(formData.get("teamId") ?? "");
  if (!userId) return;
  await prisma.teamMember.delete({ where: { userId } }).catch(() => null);
  revalidateAll();
  if (teamId) revalidatePath(`/teams/${teamId}`);
}
