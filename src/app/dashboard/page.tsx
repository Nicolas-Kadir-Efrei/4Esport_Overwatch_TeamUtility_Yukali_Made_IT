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

  const teams =
    user.role === "ADMIN"
      ? await prisma.team.findMany({ orderBy: { name: "asc" } })
      : user.teamId
        ? await prisma.team.findMany({ where: { id: user.teamId } })
        : [];

  const canCreate = user.role === "ADMIN" || user.teamRole === "CAPTAIN";

  const teamIds = [...new Set(matches.map((m) => m.teamId))];
  const allMembers = await prisma.teamMember.findMany({
    where: { teamId: { in: teamIds } },
    include: { user: { include: { availabilities: true } } },
  });

  const byTeam = new Map<
    string,
    {
      id: string;
      displayName: string;
      avatarUrl: string | null;
      battleTag: string | null;
      smurfTags: string[];
      playerRoles: string[];
      role: string;
      availabilities: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
      }[];
    }[]
  >();

  for (const m of allMembers) {
    const list = byTeam.get(m.teamId) ?? [];
    list.push({
      id: m.user.id,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      battleTag: m.user.battleTag,
      smurfTags: m.user.smurfTags,
      playerRoles: m.user.playerRoles,
      role: m.role,
      availabilities: m.user.availabilities,
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
        }. Qui est dispo pour le prochain scrim ?`}
        actions={
          <Link href="/matches/history" className="btn btn-ghost text-sm">
            Historique
          </Link>
        }
      />

      {!user.teamId && user.role !== "ADMIN" && (
        <div className="panel mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4 fade-up">
          <p className="text-sm text-[var(--muted)]">
            Tu n&apos;as pas encore d&apos;équipe — postule pour apparaître sur
            les dispos.
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
            description="Dès qu’un match est ajouté, tu verras ici les dispos de chaque joueur."
            actionHref={canCreate ? undefined : "/teams"}
            actionLabel={canCreate ? undefined : "Rejoindre une équipe"}
          />
        ) : (
          matches.map((match) => (
            <MatchAvailabilityBoard
              key={match.id}
              matches={[match]}
              members={byTeam.get(match.teamId) ?? []}
            />
          ))
        )}
      </section>

      {canCreate && teams.length > 0 && (
        <section className="panel mt-10 p-5 fade-up">
          <h2 className="font-display mb-1 text-3xl">Planifier un match</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Scrim, tournoi ou ranked — les dispos s’affichent automatiquement.
          </p>
          <CreateMatchForm
            teams={teams.map((t) => ({ id: t.id, name: t.name, tag: t.tag }))}
            defaultTeamId={user.teamId}
          />
        </section>
      )}
    </main>
  );
}
