"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { isUploadBlob, saveUploadedImage } from "@/lib/uploads";
import { seedMatchLineup, seedPlayerOnUpcomingMatches } from "@/lib/lineup";

export type TeamActionState = {
  error?: string;
  success?: string;
};

export async function requestJoinTeam(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireUser();
  const teamId = String(formData.get("teamId") ?? "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 300);

  if (!teamId) return { error: "Équipe manquante." };

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
  });
  if (membership) {
    return { error: "Tu es déjà dans une équipe." };
  }

  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) return { error: "Équipe introuvable." };

  const existing = await prisma.joinRequest.findUnique({
    where: { userId_teamId: { userId: user.id, teamId } },
  });

  if (existing?.status === "PENDING") {
    return { error: "Demande déjà en attente pour cette équipe." };
  }
  if (existing?.status === "ACCEPTED") {
    return { error: "Tu as déjà été accepté dans cette équipe." };
  }

  if (existing) {
    await prisma.joinRequest.update({
      where: { id: existing.id },
      data: {
        status: "PENDING",
        message: message || null,
        reviewedAt: null,
        reviewedById: null,
      },
    });
  } else {
    await prisma.joinRequest.create({
      data: {
        userId: user.id,
        teamId,
        message: message || null,
      },
    });
  }

  revalidatePath("/teams");
  revalidatePath("/admin");
  return { success: `Demande envoyée pour rejoindre ${team.name}.` };
}

export async function reviewJoinRequest(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const admin = await requireAdmin();
  const requestId = String(formData.get("requestId") ?? "");
  const decision = String(formData.get("decision") ?? "");

  if (!requestId || !["ACCEPTED", "REJECTED"].includes(decision)) {
    return { error: "Action invalide." };
  }

  const request = await prisma.joinRequest.findUnique({
    where: { id: requestId },
    include: { user: true, team: true },
  });
  if (!request || request.status !== "PENDING") {
    return { error: "Demande introuvable ou déjà traitée." };
  }

  if (decision === "REJECTED") {
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/teams");
    return { success: "Demande refusée." };
  }

  const alreadyInTeam = await prisma.teamMember.findUnique({
    where: { userId: request.userId },
  });
  if (alreadyInTeam) {
    await prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    });
    return { error: "Ce joueur est déjà dans une équipe." };
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        userId: request.userId,
        teamId: request.teamId,
        role: "PLAYER",
      },
    }),
    prisma.joinRequest.update({
      where: { id: requestId },
      data: {
        status: "ACCEPTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    }),
    prisma.joinRequest.updateMany({
      where: {
        userId: request.userId,
        status: "PENDING",
        id: { not: requestId },
      },
      data: {
        status: "REJECTED",
        reviewedAt: new Date(),
        reviewedById: admin.id,
      },
    }),
  ]);

  await seedPlayerOnUpcomingMatches(request.userId, request.teamId);

  revalidatePath("/admin");
  revalidatePath("/teams");
  revalidatePath("/dashboard");
  return {
    success: `${request.user.displayName} a rejoint ${request.team.name}.`,
  };
}

const matchSchema = z.object({
  teamId: z.string().min(1),
  opponent: z.string().min(2).max(80).trim(),
  title: z.string().max(80).trim().optional(),
  type: z.enum(["SCRIM", "TOURNAMENT", "RANKED", "OTHER"]),
  scheduledAt: z.string().min(1),
  notes: z.string().max(500).trim().optional(),
});

export async function createMatch(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  const user = await requireUser();
  const membership =
    user.role === "ADMIN"
      ? null
      : await prisma.teamMember.findUnique({
          where: { userId: user.id },
          select: { teamId: true, role: true },
        });

  if (user.role !== "ADMIN" && membership?.role !== "CAPTAIN") {
    return { error: "Seuls le capitaine de l’équipe (ou un admin) peuvent créer un match." };
  }

  const parsed = matchSchema.safeParse({
    teamId: formData.get("teamId"),
    opponent: formData.get("opponent"),
    title: formData.get("title") || undefined,
    type: formData.get("type") || "SCRIM",
    scheduledAt: formData.get("scheduledAt"),
    notes: formData.get("notes") || undefined,
  });
  if (!parsed.success) {
    return { error: "Formulaire match invalide." };
  }

  if (user.role !== "ADMIN") {
    if (!membership || parsed.data.teamId !== membership.teamId) {
      return { error: "Tu ne peux créer un match que pour ton équipe." };
    }
  }

  const when = new Date(parsed.data.scheduledAt);
  if (Number.isNaN(when.getTime())) {
    return { error: "Date/heure invalide." };
  }

  const match = await prisma.match.create({
    data: {
      teamId: parsed.data.teamId,
      opponent: parsed.data.opponent,
      title: parsed.data.title || null,
      type: parsed.data.type,
      scheduledAt: when,
      notes: parsed.data.notes || null,
      createdById: user.id,
    },
  });

  await seedMatchLineup(match.id, parsed.data.teamId);

  const oppLogo = formData.get("opponentLogo");
  if (isUploadBlob(oppLogo)) {
    const saved = await saveUploadedImage(oppLogo, "opponents", match.id);
    if ("error" in saved) return { error: saved.error };
    await prisma.match.update({
      where: { id: match.id },
      data: { opponentLogoUrl: saved.url },
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/matches/history");
  revalidatePath("/admin/matches");
  revalidatePath(`/matches/${match.id}`);
  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { success: "Match ajouté." };
}
