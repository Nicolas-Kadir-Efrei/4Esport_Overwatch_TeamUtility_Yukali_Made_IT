import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { EmptyState, PageHeader } from "@/components/ui";
import { TeamLogo } from "@/components/team-logo";
import { formatMatchResult, formatMatchType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function MatchHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ team?: string }>;
}) {
  const user = await requireUser();
  const { team: teamFilter } = await searchParams;
  const now = new Date();

  const teams =
    user.role === "ADMIN"
      ? await prisma.team.findMany({ orderBy: { name: "asc" } })
      : user.teamId
        ? await prisma.team.findMany({ where: { id: user.teamId } })
        : [];

  const scopedTeamId =
    user.role === "ADMIN"
      ? teamFilter
      : user.teamId ?? "__none__";

  const matches = await prisma.match.findMany({
    where: {
      ...(scopedTeamId ? { teamId: scopedTeamId } : {}),
      OR: [
        { scheduledAt: { lt: now } },
        { result: { in: ["WIN", "LOSS", "DRAW", "CANCELLED"] } },
      ],
    },
    include: { team: true },
    orderBy: { scheduledAt: "desc" },
    take: 100,
  });

  const history = matches.filter(
    (m) => m.scheduledAt < now || m.result !== "SCHEDULED",
  );

  return (
    <main className="shell max-w-5xl">
      <PageHeader
        eyebrow="Archives"
        title="Historique"
        description="Matches passés et résultats enregistrés, filtrables par équipe."
        actions={
          <Link href="/dashboard" className="btn btn-ghost text-sm">
            Matches à venir
          </Link>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/matches/history"
          className={`btn text-xs ${!teamFilter ? "btn-primary" : "btn-ghost"}`}
        >
          Toutes
        </Link>
        {teams.map((t) => (
          <Link
            key={t.id}
            href={`/matches/history?team=${t.id}`}
            className={`btn text-xs ${
              teamFilter === t.id ? "btn-primary" : "btn-ghost"
            }`}
          >
            [{t.tag}]
          </Link>
        ))}
      </div>

      {history.length === 0 ? (
        <EmptyState
          title="Aucun match archivé"
          description="Dès qu’un match est passé ou qu’un résultat est saisi, il apparaît ici."
          actionHref="/dashboard"
          actionLabel="Retour au planning"
        />
      ) : (
        <ul className="space-y-2">
          {history.map((m) => (
            <li key={m.id}>
              <Link
                href={`/matches/${m.id}`}
                className="panel flex flex-wrap items-center justify-between gap-3 px-4 py-4 transition hover:border-[var(--line-strong)]"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <TeamLogo
                    src={m.opponentLogoUrl}
                    name={m.opponent}
                    tag={m.opponent.slice(0, 3)}
                    size="md"
                  />
                  <div>
                    <p className="match-heading">vs {m.opponent}</p>
                    <p className="text-sm text-[var(--muted)]">
                      [{m.team.tag}] {m.team.name} · {formatMatchType(m.type)}
                      {m.title ? ` · ${m.title}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p
                    className={
                      m.result === "WIN"
                        ? "text-[var(--ok)]"
                        : m.result === "LOSS"
                          ? "text-[var(--danger)]"
                          : "text-[var(--muted)]"
                    }
                  >
                    {formatMatchResult(m.result)}
                    {m.score ? ` · ${m.score}` : ""}
                  </p>
                  <p className="text-[var(--muted)]">
                    {format(m.scheduledAt, "d MMM yyyy · HH:mm", { locale: fr })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
