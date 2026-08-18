import Link from "next/link";
import { MatchAvailabilityBoard } from "@/components/match-board";
import { CreateMatchForm } from "@/components/team-forms";
import { EmptyState, PageHeader } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function DashboardPage() {
  const user = await requireUser();

  const matches = await prisma.match.findMany({
    where: {
      scheduledAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
      result: { in: ["SCHEDULED"] },
      ...(user.role === "ADMIN"
        ? {}
        : user.teamId
          ? { teamId: user.teamId }
          : { teamId: "__none__" }),
    },
    include: { team: true },
    orderBy: { scheduledAt: "asc" },
    take: 20,
  });

  const membership =
    user.role === "ADMIN"
      ? null
      : await prisma.teamMember.findUnique({
          where: { userId: user.id },
          select: { teamId: true, role: true },
        });
  const isCaptain = membership?.role === "CAPTAIN";
  const canCreate = user.role === "ADMIN" || isCaptain;

  const teams =
    user.role === "ADMIN"
      ? await prisma.team.findMany({ orderBy: { name: "asc" } })
      : membership?.teamId
        ? await prisma.team.findMany({ where: { id: membership.teamId } })
        : [];

  const teamIds = [...new Set(matches.map((m) => m.teamId))];
  const matchIds = matches.map((m) => m.id);
  const [allMembers, allLineups] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: { in: teamIds } },
      include: { user: true },
    }),
    matchIds.length > 0
      ? prisma.matchLineup.findMany({
          where: { matchId: { in: matchIds } },
          select: { matchId: true, userId: true, status: true },
        })
      : Promise.resolve([]),
  ]);

  const myStatuses = Object.fromEntries(
    allLineups
      .filter((l) => l.userId === user.id)
      .map((l) => [l.matchId, l.status]),
  ) as Record<string, "PRESENT" | "ABSENT" | "PENDING">;

  const presenceByMatch: Record<
    string,
    Record<string, "PRESENT" | "ABSENT" | "PENDING">
  > = {};
  for (const entry of allLineups) {
    if (!presenceByMatch[entry.matchId]) presenceByMatch[entry.matchId] = {};
    presenceByMatch[entry.matchId][entry.userId] = entry.status;
  }

  const byTeam = new Map<
    string,
    {
      id: string;
      displayName: string;
      avatarUrl: string | null;
      battleTag: string | null;
      playerRoles: string[];
      role: string;
    }[]
  >();

  for (const m of allMembers) {
    const list = byTeam.get(m.teamId) ?? [];
    list.push({
      id: m.user.id,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      battleTag: m.user.battleTag,
      playerRoles: m.user.playerRoles,
      role: m.role,
    });
    byTeam.set(m.teamId, list);
  }

  return (
    <main className="shell">
      <PageHeader
        eyebrow="Planning"
        title="Matches à venir"
        description={`Salut ${user.displayName}${
          user.teamTag ? ` · [${user.teamTag}]` : " · sans équipe"
        }${user.role === "ADMIN" ? " · Admin" : ""}${
          user.teamRole === "CAPTAIN" ? " · Capitaine" : ""
        }. Qui est présent pour le prochain scrim ?`}
        actions={
          <div className="flex flex-wrap gap-2">
            {user.teamId && (
              <Link href={`/teams/${user.teamId}`} className="btn btn-primary text-sm">
                Voir mon équipe
              </Link>
            )}
            <Link href="/matches/history" className="btn btn-ghost text-sm">
              Historique
            </Link>
          </div>
        }
      />

      {!user.teamId && user.role !== "ADMIN" && (
        <div className="panel mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4 fade-up">
          <p className="text-sm text-[var(--muted)]">
            Tu n&apos;as pas encore d&apos;équipe — postule pour apparaître sur
            les matches.
          </p>
          <Link href="/teams" className="btn btn-primary text-sm">
            Voir les équipes
          </Link>
        </div>
      )}

      <section className="space-y-4">
        {matches.length === 0 ? (
          <EmptyState
            title="Rien de planifié"
            description="Dès qu’un match est ajouté, tu verras ici qui est présent."
            actionHref={canCreate ? undefined : "/teams"}
            actionLabel={canCreate ? undefined : "Rejoindre une équipe"}
          />
        ) : (
          matches.map((match) => (
            <MatchAvailabilityBoard
              key={match.id}
              matches={[match]}
              members={byTeam.get(match.teamId) ?? []}
              currentUserId={user.id}
              myStatuses={myStatuses}
              rsvpTeamId={user.teamId}
              presenceByMatch={presenceByMatch}
            />
          ))
        )}
      </section>

      {canCreate && teams.length > 0 && (
        <section className="panel mt-10 p-5 fade-up">
          <h2 className="section-title mb-1">Planifier un match</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            {user.role === "ADMIN"
              ? "Admin : tu peux planifier pour n’importe quelle équipe."
              : "En tant que capitaine, tu ne planifies que les matches de ton équipe."}
          </p>
          <CreateMatchForm
            teams={teams.map((t) => ({ id: t.id, name: t.name, tag: t.tag }))}
            defaultTeamId={user.teamId}
            lockTeam={user.role !== "ADMIN"}
          />
        </section>
      )}
    </main>
  );
}
