"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeamManager, requireUser } from "@/lib/session";
import { isUploadBlob, saveUploadedImage } from "@/lib/uploads";

export type CaptainActionState = {
  error?: string;
  success?: string;
};

function revalidateTeamAndMatch(teamId: string, matchId?: string) {
  revalidatePath(`/teams/${teamId}`);
  revalidatePath("/teams");
  revalidatePath("/dashboard");
  revalidatePath("/matches/history");
  if (matchId) revalidatePath(`/matches/${matchId}`);
}

async function assertCaptainOrAdminForMatch(matchId: string) {
  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return null;
  await requireTeamManager(match.teamId);
  return match;
}

/** Capitaine / admin : virer un joueur de l'équipe. */
export async function kickTeamMember(formData: FormData) {
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!teamId || !userId) return;

  const { user } = await requireTeamManager(teamId);
  if (userId === user.id) return;

  const target = await prisma.teamMember.findUnique({
    where: { userId },
  });
  if (!target || target.teamId !== teamId) return;

  if (target.role === "CAPTAIN" && user.role !== "ADMIN") return;

  await prisma.teamMember.delete({ where: { userId } });
  await prisma.matchLineup.deleteMany({
    where: {
      userId,
      match: { teamId },
    },
  });

  revalidateTeamAndMatch(teamId);
}

/** Capitaine / admin : score + résultat d'un match. */
export async function updateMatchScore(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  const result = String(formData.get("result") ?? "SCHEDULED");
  const score = String(formData.get("score") ?? "").trim().slice(0, 40);

  if (!["SCHEDULED", "WIN", "LOSS", "DRAW", "CANCELLED"].includes(result)) {
    return { error: "Résultat invalide." };
  }

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return { error: "Match introuvable." };

  await prisma.match.update({
    where: { id: matchId },
    data: {
      result: result as "SCHEDULED" | "WIN" | "LOSS" | "DRAW" | "CANCELLED",
      score: score || null,
    },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
  return { success: "Score / résultat enregistré." };
}

/** Capitaine / admin : logo de l'équipe. */
export async function uploadTeamLogo(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) return { error: "Équipe manquante." };

  await requireTeamManager(teamId);
  const file = formData.get("logo");
  if (!isUploadBlob(file)) {
    return { error: "Choisis une image (PNG, JPG, WebP ou GIF)." };
  }

  const saved = await saveUploadedImage(file, "teams", teamId);
  if ("error" in saved) return { error: saved.error };

  await prisma.team.update({
    where: { id: teamId },
    data: { logoUrl: saved.url },
  });

  revalidateTeamAndMatch(teamId);
  return { success: "Logo d'équipe mis à jour." };
}

/** Capitaine / admin : logo de l'adversaire sur un match. */
export async function uploadOpponentLogo(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { error: "Match manquant." };

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return { error: "Match introuvable." };

  const file = formData.get("opponentLogo");
  if (!isUploadBlob(file)) {
    return { error: "Choisis une image (PNG, JPG, WebP ou GIF)." };
  }

  const saved = await saveUploadedImage(file, "opponents", matchId);
  if ("error" in saved) return { error: saved.error };

  await prisma.match.update({
    where: { id: matchId },
    data: { opponentLogoUrl: saved.url },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
  return { success: "Logo adversaire mis à jour." };
}

const linkSchema = z.object({
  title: z.string().min(2).max(60).trim(),
  url: z.string().url().max(500),
  description: z.string().max(300).trim().optional(),
});

/** Capitaine / admin : ajouter un lien d'équipe. */
export async function createTeamLink(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) return { error: "Équipe manquante." };

  const { user } = await requireTeamManager(teamId);
  const rawUrl = String(formData.get("url") ?? "").trim();
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;

  const parsed = linkSchema.safeParse({
    title: formData.get("title"),
    url,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: "Lien invalide (titre + URL https://…)." };
  }

  await prisma.teamLink.create({
    data: {
      teamId,
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      createdById: user.id,
    },
  });

  revalidateTeamAndMatch(teamId);
  return { success: "Lien ajouté." };
}

export async function deleteTeamLink(formData: FormData) {
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return;
  const link = await prisma.teamLink.findUnique({ where: { id: linkId } });
  if (!link) return;
  await requireTeamManager(link.teamId);
  await prisma.teamLink.delete({ where: { id: linkId } });
  revalidateTeamAndMatch(link.teamId);
}

/** Capitaine / admin : ajouter ou retirer + statut en une action. */
export async function setLineupPlayer(formData: FormData) {
  const matchId = String(formData.get("matchId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const playing = String(formData.get("playing") ?? "") === "1";
  const status = String(formData.get("status") ?? "PENDING");

  if (!matchId || !userId) return;
  if (!["PRESENT", "ABSENT", "PENDING"].includes(status)) return;

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return;

  const member = await prisma.teamMember.findUnique({ where: { userId } });
  if (!member || member.teamId !== match.teamId) return;

  if (!playing) {
    await prisma.matchLineup.deleteMany({ where: { matchId, userId } });
  } else {
    await prisma.matchLineup.upsert({
      where: { matchId_userId: { matchId, userId } },
      update: { status: status as "PRESENT" | "ABSENT" | "PENDING" },
      create: {
        matchId,
        userId,
        status: status as "PRESENT" | "ABSENT" | "PENDING",
      },
    });
  }

  revalidateTeamAndMatch(match.teamId, matchId);
}

/** Joueur : son propre statut — ou capitaine pour n'importe quel joueur déjà en lineup. */
export async function setLineupStatus(formData: FormData) {
  const sessionUser = await requireUser();
  const matchId = String(formData.get("matchId") ?? "");
  const targetUserId = String(formData.get("userId") ?? sessionUser.id);
  const status = String(formData.get("status") ?? "");
  if (!matchId || !["PRESENT", "ABSENT", "PENDING"].includes(status)) return;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;

  const isSelf = targetUserId === sessionUser.id;
  if (!isSelf) {
    await requireTeamManager(match.teamId);
  }

  const entry = await prisma.matchLineup.findUnique({
    where: { matchId_userId: { matchId, userId: targetUserId } },
  });
  if (!entry) return;

  await prisma.matchLineup.update({
    where: { id: entry.id },
    data: { status: status as "PRESENT" | "ABSENT" | "PENDING" },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
}
