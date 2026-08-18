"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireTeamManager, requireUser } from "@/lib/session";
import { isUploadBlob, saveUploadedImage } from "@/lib/uploads";
import { isLineupStatus } from "@/lib/lineup";
import { sanitizeHttpUrl } from "@/lib/security/safe";
import { unstable_update } from "@/lib/auth";

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

/** Capitaine / admin : nommer un membre capitaine (un seul par équipe). */
export async function setTeamCaptain(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const teamId = String(formData.get("teamId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  if (!teamId || !userId) return { error: "Équipe ou joueur manquant." };

  const { user } = await requireTeamManager(teamId);
  const target = await prisma.teamMember.findUnique({ where: { userId } });
  if (!target || target.teamId !== teamId) {
    return { error: "Ce joueur n’est pas dans l’équipe." };
  }

  await prisma.$transaction([
    prisma.teamMember.updateMany({
      where: { teamId, role: "CAPTAIN" },
      data: { role: "PLAYER" },
    }),
    prisma.teamMember.update({
      where: { userId },
      data: { role: "CAPTAIN" },
    }),
  ]);

  await unstable_update({
    user: {
      teamRole:
        user.role === "ADMIN"
          ? user.teamRole
          : userId === user.id
            ? "CAPTAIN"
            : "PLAYER",
    },
  });

  revalidatePath("/", "layout");
  revalidateTeamAndMatch(teamId);
  return { success: "Capitaine mis à jour." };
}

function parseBattleTags(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 3 && s.length <= 40)
    .slice(0, 8);
}

/** Capitaine / admin : BattleTags à contacter pour le match. */
export async function updateMatchContactTags(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { error: "Match manquant." };

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return { error: "Match introuvable." };

  const tags = parseBattleTags(String(formData.get("contactBattleTags") ?? ""));

  await prisma.match.update({
    where: { id: matchId },
    data: { contactBattleTags: tags },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
  return { success: "BattleTags de contact enregistrés." };
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

const matchEditSchema = z.object({
  opponent: z.string().min(2).max(80).trim(),
  title: z.string().max(80).trim().optional(),
  type: z.enum(["SCRIM", "TOURNAMENT", "RANKED", "OTHER"]),
  scheduledAt: z.string().min(1),
  notes: z.string().max(500).trim().optional(),
});

/** Capitaine / admin : modifier un match de son équipe (pas le teamId). */
export async function updateMatchDetails(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { error: "Match manquant." };

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return { error: "Match introuvable." };

  const parsed = matchEditSchema.safeParse({
    opponent: formData.get("opponent"),
    title: formData.get("title") || undefined,
    type: formData.get("type") || "SCRIM",
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) return { error: "Formulaire match invalide." };

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) return { error: "Date / heure invalide." };

  await prisma.match.update({
    where: { id: matchId },
    data: {
      opponent: parsed.data.opponent,
      title: parsed.data.title || null,
      type: parsed.data.type,
      scheduledAt: when,
      notes: parsed.data.notes || null,
    },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
  return { success: "Match mis à jour." };
}

const matchLinkSchema = z.object({
  title: z.string().min(2).max(60).trim(),
  url: z.string().url().max(500),
  description: z.string().max(300).trim().optional(),
});

/** Capitaine / admin : VOD, Twitch, replay… liés au match. */
export async function createMatchLink(
  _prev: CaptainActionState,
  formData: FormData,
): Promise<CaptainActionState> {
  const matchId = String(formData.get("matchId") ?? "");
  if (!matchId) return { error: "Match manquant." };

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return { error: "Match introuvable." };

  const { user } = await requireTeamManager(match.teamId);
  const url = sanitizeHttpUrl(String(formData.get("url") ?? ""));
  if (!url) {
    return { error: "URL invalide (https://… uniquement)." };
  }

  const parsed = matchLinkSchema.safeParse({
    title: formData.get("title"),
    url,
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { error: "Lien invalide (titre + URL https://…)." };
  }

  await prisma.matchLink.create({
    data: {
      matchId,
      title: parsed.data.title,
      url: parsed.data.url,
      description: parsed.data.description || null,
      createdById: user.id,
    },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
  return { success: "Lien ajouté." };
}

export async function deleteMatchLink(formData: FormData) {
  const linkId = String(formData.get("linkId") ?? "");
  if (!linkId) return;
  const link = await prisma.matchLink.findUnique({
    where: { id: linkId },
    include: { match: { select: { teamId: true, id: true } } },
  });
  if (!link) return;
  await requireTeamManager(link.match.teamId);
  await prisma.matchLink.delete({ where: { id: linkId } });
  revalidateTeamAndMatch(link.match.teamId, link.match.id);
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

  try {
    const saved = await saveUploadedImage(file, "teams", teamId);
    if ("error" in saved) return { error: saved.error };

    await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl: saved.url },
    });
  } catch (e) {
    console.error("uploadTeamLogo", e);
    return { error: "Échec de l’upload. Réessaie avec un fichier plus léger." };
  }

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
  const url = sanitizeHttpUrl(String(formData.get("url") ?? ""));
  if (!url) {
    return { error: "URL invalide (https://… uniquement)." };
  }

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
  if (!isLineupStatus(status)) return;

  const match = await assertCaptainOrAdminForMatch(matchId);
  if (!match) return;
  if (match.result !== "SCHEDULED") return;

  const member = await prisma.teamMember.findUnique({ where: { userId } });
  if (!member || member.teamId !== match.teamId) return;

  if (!playing) {
    await prisma.matchLineup.deleteMany({ where: { matchId, userId } });
  } else {
    await prisma.matchLineup.upsert({
      where: { matchId_userId: { matchId, userId } },
      update: { status },
      create: {
        matchId,
        userId,
        status: status,
      },
    });
  }

  revalidateTeamAndMatch(match.teamId, matchId);
}

/** Joueur de l'équipe : son propre statut. Capitaine/admin : n'importe quel membre. */
export async function setLineupStatus(formData: FormData) {
  const sessionUser = await requireUser();
  const matchId = String(formData.get("matchId") ?? "");
  const targetUserId = String(formData.get("userId") ?? sessionUser.id);
  const status = String(formData.get("status") ?? "");
  if (!matchId || !isLineupStatus(status)) return;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) return;
  if (match.result !== "SCHEDULED") return;

  const isSelf = targetUserId === sessionUser.id;
  if (!isSelf) {
    await requireTeamManager(match.teamId);
  } else if (sessionUser.role !== "ADMIN") {
    const membership = await prisma.teamMember.findUnique({
      where: { userId: sessionUser.id },
      select: { teamId: true },
    });
    if (!membership || membership.teamId !== match.teamId) return;
  }

  const targetMember = await prisma.teamMember.findUnique({
    where: { userId: targetUserId },
    select: { teamId: true },
  });
  if (!targetMember || targetMember.teamId !== match.teamId) return;

  await prisma.matchLineup.upsert({
    where: { matchId_userId: { matchId, userId: targetUserId } },
    update: { status },
    create: { matchId, userId: targetUserId, status },
  });

  revalidateTeamAndMatch(match.teamId, matchId);
}
