import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { MatchAvailabilityBoard } from "@/components/match-board";
import { MatchPlayerAvailabilityList } from "@/components/availability-views";
import { AdminMatchForm } from "@/components/admin-forms";
import {
  MatchScoreForm,
  OpponentLogoForm,
} from "@/components/captain-forms";
import { LineupBoard } from "@/components/lineup-board";
import { TeamLogo } from "@/components/team-logo";
import { adminDeleteMatch } from "@/lib/actions/admin";
import { formatMatchResult, formatMatchType } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { canManageTeam, canViewTeamContacts, requireUser } from "@/lib/session";

function statusLabel(status: string) {
  switch (status) {
    case "PRESENT":
      return "Présent";
    case "ABSENT":
      return "Absent";
    default:
      return "En attente";
  }
}

function statusClass(status: string) {
  switch (status) {
    case "PRESENT":
      return "avail-yes";
    case "ABSENT":
      return "avail-no";
    default:
      return "avail-maybe";
  }
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      team: true,
      createdBy: true,
      lineup: {
        include: {
          user: {
            include: { links: true },
          },
        },
        orderBy: { addedAt: "asc" },
      },
    },
  });
  if (!match) notFound();

  const members = await prisma.teamMember.findMany({
    where: { teamId: match.teamId },
    include: { user: { include: { availabilities: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const teams =
    user.role === "ADMIN"
      ? await prisma.team.findMany({ orderBy: { name: "asc" } })
      : [];

  const isManager = await canManageTeam(match.teamId);
  const showContacts = await canViewTeamContacts(match.teamId);
  const lineupByUser = new Map(match.lineup.map((l) => [l.userId, l]));

  const boardMembers = members.map((m) => ({
    id: m.user.id,
    displayName: m.user.displayName,
    avatarUrl: m.user.avatarUrl,
    battleTag: m.user.battleTag,
    smurfTags: showContacts ? m.user.smurfTags : [],
    playerRoles: m.user.playerRoles,
    role: m.role,
    teamRole: m.role,
    availabilities: showContacts ? m.user.availabilities : [],
  }));

  const lineupMembers = members.map((m) => {
    const entry = lineupByUser.get(m.userId);
    return {
      userId: m.userId,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      battleTag: m.user.battleTag,
      discord: showContacts ? m.user.discord : null,
      teamRole: m.role,
      playerRoles: m.user.playerRoles,
      playing: !!entry,
      status: (entry?.status ?? null) as
        | "PRESENT"
        | "ABSENT"
        | "PENDING"
        | null,
    };
  });

  return (
    <main className="shell max-w-5xl">
      <div className="mb-2 flex flex-wrap gap-4 text-sm text-[var(--muted)]">
        <Link href="/dashboard" className="hover:text-[var(--accent)]">
          ← Matches
        </Link>
        <Link href={`/teams/${match.teamId}`} className="hover:text-[var(--accent)]">
          Équipe [{match.team.tag}]
        </Link>
        <Link href="/matches/history" className="hover:text-[var(--accent)]">
          Historique
        </Link>
      </div>

      <article className="panel overflow-hidden fade-up">
        <div className="match-rail" style={{ background: match.team.color }} />
        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            <span className="chip avail-maybe">{formatMatchType(match.type)}</span>
            <span className={`chip ${statusClass(match.result === "WIN" ? "PRESENT" : match.result === "LOSS" ? "ABSENT" : "PENDING")}`}>
              {formatMatchResult(match.result)}
            </span>
            {match.score && <span className="chip">{match.score}</span>}
          </div>

          <div className="match-vs mt-5">
            <div className="match-vs-side">
              <TeamLogo
                src={match.team.logoUrl}
                name={match.team.name}
                tag={match.team.tag}
                color={match.team.color}
                size="xl"
              />
              <p className="match-vs-name">[{match.team.tag}] {match.team.name}</p>
            </div>
            <div className="match-vs-center">
              <p className="font-display text-3xl text-[var(--accent)]">VS</p>
              {match.score && (
                <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                  {match.score}
                </p>
              )}
            </div>
            <div className="match-vs-side">
              <TeamLogo
                src={match.opponentLogoUrl}
                name={match.opponent}
                tag={match.opponent.slice(0, 3)}
                size="xl"
              />
              <p className="match-vs-name">{match.opponent}</p>
            </div>
          </div>

          {match.title && <p className="mt-4 text-lg text-[var(--muted)]">{match.title}</p>}
          <p className="mt-4 font-medium">
            {format(match.scheduledAt, "EEEE d MMMM yyyy · HH:mm", { locale: fr })}
          </p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {match.createdBy ? `Créé par ${match.createdBy.displayName}` : ""}
          </p>
          {match.notes && (
            <p className="mt-4 text-sm text-[var(--muted)]">{match.notes}</p>
          )}
        </div>
      </article>

      {isManager && (
        <section className="panel mt-8 space-y-6 p-5">
          <div>
            <h2 className="font-display mb-3 text-2xl">Score (capitaine)</h2>
            <MatchScoreForm
              matchId={match.id}
              result={match.result}
              score={match.score}
            />
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="font-display mb-3 text-xl">Logo adversaire</h3>
            <OpponentLogoForm
              matchId={match.id}
              opponent={match.opponent}
              opponentLogoUrl={match.opponentLogoUrl}
            />
          </div>
        </section>
      )}

      {showContacts && (
      <section className="panel mt-8 p-5">
        <h2 className="font-display mb-2 text-3xl">Lineup</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Choisis qui joue et leur statut en un clic.
        </p>
        <LineupBoard
          matchId={match.id}
          members={lineupMembers}
          isManager={isManager}
          currentUserId={user.id}
        />
      </section>
      )}

      {showContacts && (
      <section className="mt-8">
        <h2 className="font-display mb-2 text-3xl">Disponibilités au créneau</h2>
        <MatchPlayerAvailabilityList
          members={boardMembers}
          scheduledAt={match.scheduledAt}
        />
      </section>
      )}

      {showContacts && match.result === "SCHEDULED" && (
        <section className="mt-8">
          <h2 className="font-display mb-4 text-3xl">Vue match</h2>
          <MatchAvailabilityBoard
            matches={[match]}
            members={boardMembers}
            linkToMatch={false}
          />
        </section>
      )}

      {!showContacts && (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Lineup et dispos réservés aux membres de l&apos;équipe.
        </p>
      )}

      {user.role === "ADMIN" && (
        <section className="panel mt-10 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-3xl">Admin · éditer</h2>
            <form action={adminDeleteMatch}>
              <input type="hidden" name="id" value={match.id} />
              <button className="btn btn-danger text-xs" type="submit">
                Supprimer le match
              </button>
            </form>
          </div>
          <AdminMatchForm
            teams={teams.map((t) => ({ id: t.id, name: t.name, tag: t.tag }))}
            match={match}
          />
        </section>
      )}
    </main>
  );
}
