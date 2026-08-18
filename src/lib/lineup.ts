import { prisma } from "@/lib/prisma";
import type { LineupStatus } from "@/generated/prisma/client";

export const LINEUP_STATUS_VALUES = [
  "PRESENT",
  "PENDING",
  "ABSENT",
] as const satisfies readonly LineupStatus[];

export type LineupStatusValue = (typeof LINEUP_STATUS_VALUES)[number];

export function isLineupStatus(value: string): value is LineupStatusValue {
  return (LINEUP_STATUS_VALUES as readonly string[]).includes(value);
}

/** Ajoute tout le roster d'une équipe à un match (statut indécis). */
export async function seedMatchLineup(matchId: string, teamId: string) {
  const members = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  });
  if (members.length === 0) return;

  await prisma.matchLineup.createMany({
    data: members.map((m) => ({
      matchId,
      userId: m.userId,
      status: "PENDING" as const,
    })),
    skipDuplicates: true,
  });
}

/** Ajoute un joueur aux matches encore planifiés de son équipe. */
export async function seedPlayerOnUpcomingMatches(
  userId: string,
  teamId: string,
) {
  const matches = await prisma.match.findMany({
    where: { teamId, result: "SCHEDULED" },
    select: { id: true },
  });
  if (matches.length === 0) return;

  await prisma.matchLineup.createMany({
    data: matches.map((m) => ({
      matchId: m.id,
      userId,
      status: "PENDING" as const,
    })),
    skipDuplicates: true,
  });
}
