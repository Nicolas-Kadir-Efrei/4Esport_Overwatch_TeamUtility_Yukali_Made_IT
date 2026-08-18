import Link from "next/link";
import { notFound } from "next/navigation";
import { MatchDateBlock } from "@/components/match-board";
import { AdminMatchForm } from "@/components/admin-forms";
import {
  DeleteMatchLinkButton,
  MatchContactTagsForm,
  MatchEditForm,
  MatchLinkForm,
  MatchScoreForm,
  OpponentLogoForm,
} from "@/components/captain-forms";
import { LineupBoard } from "@/components/lineup-board";
import { MatchRsvpCard } from "@/components/match-rsvp";
import { MatchMediaLink } from "@/components/match-media-link";
import { TeamLogo } from "@/components/team-logo";
import { adminDeleteMatch } from "@/lib/actions/admin";
import {
  formatMatchResult,
  formatMatchType,
  lineupStatusClass,
} from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { canManageTeam, canViewTeamContacts, requireUser } from "@/lib/session";

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
      links: { orderBy: { createdAt: "desc" } },
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
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  const teams =
    user.role === "ADMIN"
      ? await prisma.team.findMany({ orderBy: { name: "asc" } })
      : [];

  const isManager = await canManageTeam(match.teamId);
  const showContacts = await canViewTeamContacts(match.teamId);
  const lineupByUser = new Map(match.lineup.map((l) => [l.userId, l]));
  const isOnThisTeam = members.some((m) => m.userId === user.id);
  const myLineup = lineupByUser.get(user.id);
  const matchOpen = match.result === "SCHEDULED";

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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              <span className="chip avail-maybe">{formatMatchType(match.type)}</span>
              <span className={`chip ${lineupStatusClass(match.result === "WIN" ? "PRESENT" : match.result === "LOSS" ? "ABSENT" : "PENDING")}`}>
                {formatMatchResult(match.result)}
              </span>
              {match.score && <span className="chip">{match.score}</span>}
            </div>
            <MatchDateBlock date={match.scheduledAt} large />
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
              <p className="section-title text-[var(--muted)]">VS</p>
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
          {match.contactBattleTags.length > 0 && (
            <div className="mt-4">
              <p className="label">BattleTags à contacter</p>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {match.contactBattleTags.map((tag) => (
                  <span key={tag} className="chip avail-maybe">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="mt-1 text-sm text-[var(--muted)]">
            {match.createdBy ? `Créé par ${match.createdBy.displayName}` : ""}
          </p>
          {match.links.length > 0 && (
            <ul className="mt-4 space-y-2">
              {match.links.map((l) => (
                <li key={l.id}>
                  <MatchMediaLink
                    title={l.title}
                    url={l.url}
                    description={l.description}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </article>

      {isOnThisTeam && (
        <MatchRsvpCard
          matchId={match.id}
          userId={user.id}
          status={(myLineup?.status ?? "PENDING") as "PRESENT" | "ABSENT" | "PENDING"}
          opponent={match.opponent}
          locked={!matchOpen}
        />
      )}

      {isManager && (
        <section className="panel mt-8 space-y-6 p-5">
          {user.role !== "ADMIN" && (
            <div>
              <h2 className="section-title mb-3">Modifier le match</h2>
              <MatchEditForm match={match} />
            </div>
          )}
          <div className={user.role !== "ADMIN" ? "border-t border-[var(--line)] pt-5" : ""}>
            <h2 className="section-title mb-3">Score</h2>
            <MatchScoreForm
              matchId={match.id}
              result={match.result}
              score={match.score}
            />
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="section-title mb-3">Logo adversaire</h3>
            <OpponentLogoForm
              matchId={match.id}
              opponent={match.opponent}
              opponentLogoUrl={match.opponentLogoUrl}
            />
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="section-title mb-1">Contact match</h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              BattleTag(s) à ajouter / contacter pour ce scrim.
            </p>
            <MatchContactTagsForm
              matchId={match.id}
              contactBattleTags={match.contactBattleTags}
            />
          </div>
          <div className="border-t border-[var(--line)] pt-5">
            <h3 className="section-title mb-1">Liens du match</h3>
            <p className="mb-4 text-sm text-[var(--muted)]">
              VOD, Twitch, replay — visibles par l’équipe.
            </p>
            {match.links.length > 0 && (
              <ul className="mb-4 space-y-2">
                {match.links.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <MatchMediaLink
                        title={l.title}
                        url={l.url}
                        description={l.description}
                      />
                    </div>
                    <DeleteMatchLinkButton linkId={l.id} />
                  </li>
                ))}
              </ul>
            )}
            <MatchLinkForm matchId={match.id} />
          </div>
        </section>
      )}

      {showContacts && (
      <section className="panel mt-8 p-5">
        <h2 className="section-title mb-2">Présence</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          {matchOpen
            ? "Indique ta présence. Le capitaine choisit qui joue."
            : "Match clos — les statuts ne peuvent plus être changés."}
        </p>
        <LineupBoard
          matchId={match.id}
          members={lineupMembers}
          isManager={isManager}
          currentUserId={user.id}
          locked={!matchOpen}
        />
      </section>
      )}

      {!showContacts && (
        <p className="mt-8 text-sm text-[var(--muted)]">
          Présence réservée aux membres de l&apos;équipe.
        </p>
      )}

      {user.role === "ADMIN" && (
        <section className="panel mt-10 p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">Admin · éditer</h2>
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
