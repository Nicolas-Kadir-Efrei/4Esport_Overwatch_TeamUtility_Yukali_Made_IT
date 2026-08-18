import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CreateMatchForm, JoinTeamForm } from "@/components/team-forms";
import { TeamAvailabilityOverview } from "@/components/availability-views";
import { MatchAvailabilityBoard } from "@/components/match-board";
import {
  DeleteTeamLinkButton,
  SetCaptainForm,
  TeamLinkForm,
  TeamLogoForm,
} from "@/components/captain-forms";
import { TeamRoster } from "@/components/team-roster";
import { TeamLogo } from "@/components/team-logo";
import {
  formatMatchResult,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { canManageTeam, canViewTeamContacts, requireUser } from "@/lib/session";
import { PageHeader } from "@/components/ui";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      links: { orderBy: { createdAt: "desc" } },
      members: {
        include: {
          user: {
            include: {
              availabilities: true,
              links: true,
            },
          },
        },
        orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
      },
    },
  });
  if (!team) notFound();

  const now = new Date();
  const [upcoming, history, membership, myRequest, isManager, showContacts] =
    await Promise.all([
    prisma.match.findMany({
      where: {
        teamId: team.id,
        scheduledAt: { gte: now },
        result: "SCHEDULED",
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
      include: {
        lineup: {
          select: { userId: true, status: true, matchId: true },
        },
      },
    }),
    prisma.match.findMany({
      where: {
        teamId: team.id,
        OR: [
          { scheduledAt: { lt: now } },
          { result: { in: ["WIN", "LOSS", "DRAW", "CANCELLED"] } },
        ],
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    prisma.teamMember.findUnique({ where: { userId: user.id } }),
    prisma.joinRequest.findUnique({
      where: { userId_teamId: { userId: user.id, teamId: team.id } },
    }),
    canManageTeam(team.id),
    canViewTeamContacts(team.id),
  ]);

  const historyIds = new Set(upcoming.map((m) => m.id));
  const historyClean = history.filter((m) => !historyIds.has(m.id));
  const canApply = !membership;
  const isOnThisTeam = membership?.teamId === team.id;
  const myMatchStatuses = Object.fromEntries(
    upcoming.flatMap((m) =>
      m.lineup
        .filter((l) => l.userId === user.id)
        .map((l) => [l.matchId, l.status]),
    ),
  ) as Record<string, "PRESENT" | "ABSENT" | "PENDING">;

  const presenceByMatch: Record<
    string,
    Record<string, "PRESENT" | "ABSENT" | "PENDING">
  > = {};
  for (const m of upcoming) {
    presenceByMatch[m.id] = Object.fromEntries(
      m.lineup.map((l) => [l.userId, l.status]),
    );
  }

  const availabilityMembers = team.members.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    battleTag: m.user.battleTag,
    smurfTags: m.user.smurfTags,
    playerRoles: m.user.playerRoles,
    teamRole: m.role,
    availabilities: m.user.availabilities,
  }));

  return (
    <main className="shell">
      <div className="mb-2">
        <Link href="/teams" className="text-sm text-[var(--muted)] hover:text-[var(--accent)]">
          ← Toutes les équipes
        </Link>
      </div>

      <div className="panel mb-8 overflow-hidden fade-up">
        <div className="match-rail" style={{ background: team.color }} />
        <div className="p-6">
          <div className="flex flex-wrap items-start gap-4">
            <TeamLogo
              src={team.logoUrl}
              name={team.name}
              tag={team.tag}
              color={team.color}
              size="xl"
            />
            <div className="min-w-0 flex-1">
              <PageHeader
                eyebrow={`[${team.tag}]`}
                title={team.name}
                description={team.description ?? undefined}
                actions={
                  user.role === "ADMIN" ? (
                    <Link href="/admin/teams" className="btn btn-ghost text-xs">
                      Admin équipes
                    </Link>
                  ) : isManager ? (
                    <span className="chip avail-maybe">Capitaine</span>
                  ) : undefined
                }
              />
            </div>
          </div>
          {isManager && (
            <div className="mt-5 border-t border-[var(--line)] pt-5">
              <TeamLogoForm
                teamId={team.id}
                logoUrl={team.logoUrl}
                name={team.name}
                tag={team.tag}
                color={team.color}
              />
            </div>
          )}
        </div>
      </div>

      <TeamRoster
        teamId={team.id}
        members={team.members}
        accentColor={team.color}
        isManager={isManager}
        currentUserId={user.id}
        isAdmin={user.role === "ADMIN"}
        showProfileHint={isOnThisTeam}
        showContacts={showContacts}
      />

      {isManager && (
        <section className="panel mb-10 p-5">
          <h2 className="section-title mb-1">Capitaine</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            Un seul capitaine par équipe. Il peut planifier les matches, les
            scores et les liens VOD.
          </p>
          <SetCaptainForm
            teamId={team.id}
            members={team.members.map((m) => ({
              userId: m.userId,
              displayName: m.user.displayName,
              role: m.role,
            }))}
          />
        </section>
      )}

      <section className="mb-10">
        <h2 className="section-title mb-2">Disponibilités</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Vue hebdo des créneaux de tout le roster.
        </p>
        <TeamAvailabilityOverview members={availabilityMembers} />
      </section>

      <section className="mb-10">
        <h2 className="section-title mb-2">Liens de l&apos;équipe</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Discord, docs, brackets… ajoutés par le capitaine ou l&apos;admin.
        </p>
        <ul className="mb-4 space-y-2">
          {team.links.map((l) => (
            <li
              key={l.id}
              className="panel flex flex-wrap items-start justify-between gap-3 px-4 py-3"
            >
              <div>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[var(--accent)] hover:underline"
                >
                  {l.title}
                </a>
                {l.description && (
                  <p className="mt-1 text-sm text-[var(--muted)]">{l.description}</p>
                )}
                <p className="mt-1 break-all text-xs text-[var(--muted)]">{l.url}</p>
              </div>
              {isManager && <DeleteTeamLinkButton linkId={l.id} />}
            </li>
          ))}
          {team.links.length === 0 && (
            <li className="text-sm text-[var(--muted)]">Aucun lien pour l&apos;instant.</li>
          )}
        </ul>
        {isManager && (
          <div className="panel p-5">
            <h3 className="section-title mb-3">Ajouter un lien</h3>
            <TeamLinkForm teamId={team.id} />
          </div>
        )}
      </section>

      {canApply && (
        <section className="panel mb-10 p-5">
          <h2 className="section-title mb-3">Rejoindre</h2>
          {myRequest?.status === "PENDING" ? (
            <p className="alert alert-ok">Demande en attente.</p>
          ) : (
            <>
              {myRequest?.status === "REJECTED" && (
                <p className="mb-2 alert alert-error">
                  Demande précédente refusée — tu peux repostuler.
                </p>
              )}
              <JoinTeamForm teamId={team.id} teamName={team.name} />
            </>
          )}
        </section>
      )}

      {isManager && (
        <section className="panel mb-10 p-5">
          <h2 className="section-title mb-1">Planifier un match</h2>
          <p className="mb-4 text-sm text-[var(--muted)]">
            {user.role === "ADMIN"
              ? `Planifie un match pour [${team.tag}] ${team.name}.`
              : `En tant que capitaine, tu ne planifies que pour [${team.tag}] ${team.name}.`}
          </p>
          <CreateMatchForm
            teams={[{ id: team.id, name: team.name, tag: team.tag }]}
            defaultTeamId={team.id}
            lockTeam
          />
        </section>
      )}

      <section className="mb-10">
        <h2 className="section-title mb-4">Matches à venir</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Rien de planifié.</p>
        ) : (
          <div className="space-y-4">
            {upcoming.map((m) => (
              <MatchAvailabilityBoard
                key={m.id}
                matches={[{ ...m, team }]}
                members={availabilityMembers.map((mem) => ({
                  ...mem,
                  role: mem.teamRole ?? "PLAYER",
                }))}
                currentUserId={isOnThisTeam ? user.id : undefined}
                myStatuses={myMatchStatuses}
                rsvpTeamId={isOnThisTeam ? team.id : undefined}
                presenceByMatch={presenceByMatch}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="section-title">Historique</h2>
          <Link
            href={`/matches/history?team=${team.id}`}
            className="text-sm text-[var(--accent)]"
          >
            Voir tout →
          </Link>
        </div>
        <ul className="space-y-2">
          {historyClean.map((m) => (
            <li key={m.id}>
              <Link
                href={`/matches/${m.id}`}
                className="panel flex flex-wrap items-center justify-between gap-2 px-4 py-3 hover:border-[var(--line-strong)]"
              >
                <span className="flex items-center gap-2">
                  <TeamLogo
                    src={m.opponentLogoUrl}
                    name={m.opponent}
                    tag={m.opponent.slice(0, 3)}
                    size="sm"
                  />
                  vs {m.opponent}
                  {m.score ? ` · ${m.score}` : ""}
                </span>
                <span
                  className={`text-sm ${
                    m.result === "WIN"
                      ? "text-[var(--ok)]"
                      : m.result === "LOSS"
                        ? "text-[var(--danger)]"
                        : "text-[var(--muted)]"
                  }`}
                >
                  {formatMatchResult(m.result)} ·{" "}
                  {format(m.scheduledAt, "d MMM yyyy", { locale: fr })}
                </span>
              </Link>
            </li>
          ))}
          {historyClean.length === 0 && (
            <li className="text-sm text-[var(--muted)]">Pas encore d&apos;historique.</li>
          )}
        </ul>
      </section>
    </main>
  );
}
