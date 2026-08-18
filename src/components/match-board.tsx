import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  formatLineupStatus,
  formatMatchType,
  formatPlayerRole,
  lineupStatusClass,
} from "@/lib/constants";
import { Avatar } from "@/components/avatar";
import { PlayerName } from "@/components/captain-crown";
import { TeamLogo } from "@/components/team-logo";
import { MatchRsvpButtons } from "@/components/match-rsvp";

type Member = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  battleTag: string | null;
  playerRoles?: string[];
  role: string;
};

type MatchItem = {
  id: string;
  opponent: string;
  opponentLogoUrl?: string | null;
  title: string | null;
  type: string;
  scheduledAt: Date;
  notes: string | null;
  team: {
    id?: string;
    name: string;
    tag: string;
    color: string;
    logoUrl?: string | null;
  };
};

type PresenceStatus = "PRESENT" | "ABSENT" | "PENDING";

export function MatchDateBlock({
  date,
  large = false,
}: {
  date: Date;
  large?: boolean;
}) {
  const d = new Date(date);
  return (
    <div
      className={`match-date ${large ? "match-date-lg" : ""}`}
      aria-label={format(d, "EEEE d MMMM yyyy HH:mm", { locale: fr })}
    >
      <p className="match-date-weekday">{format(d, "EEE", { locale: fr })}</p>
      <p className="match-date-day">{format(d, "d")}</p>
      <p className="match-date-month">{format(d, "MMM", { locale: fr })}</p>
      <p className="match-date-time">{format(d, "HH:mm")}</p>
    </div>
  );
}

export function MatchAvailabilityBoard({
  matches,
  members,
  linkToMatch = true,
  currentUserId,
  myStatuses,
  rsvpTeamId,
  presenceByMatch,
}: {
  matches: MatchItem[];
  members: Member[];
  linkToMatch?: boolean;
  currentUserId?: string;
  myStatuses?: Record<string, PresenceStatus>;
  rsvpTeamId?: string | null;
  presenceByMatch?: Record<string, Record<string, PresenceStatus>>;
}) {
  if (matches.length === 0) {
    return (
      <div className="panel p-6 text-[var(--muted)]">
        Aucun match à venir.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const presence = presenceByMatch?.[match.id] ?? {};
        const presentCount = members.filter(
          (m) => presence[m.id] === "PRESENT",
        ).length;
        const myStatus = myStatuses?.[match.id] ?? presence[currentUserId ?? ""] ?? null;
        const canRsvp = Boolean(
          currentUserId && rsvpTeamId && match.team.id === rsvpTeamId,
        );

        return (
          <article key={match.id} className="panel overflow-hidden fade-up">
            <div
              className="match-rail"
              style={{ background: match.team.color }}
            />
            <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_1.35fr]">
              <div>
                <div className="match-card-head">
                  <MatchDateBlock date={match.scheduledAt} large />
                  <div className="match-card-meta">
                    <div className="match-card-chips">
                      <span className="chip avail-maybe text-sm">
                        {formatMatchType(match.type)}
                      </span>
                      {match.team.id ? (
                        <Link
                          href={`/teams/${match.team.id}`}
                          className="text-sm font-semibold text-[var(--muted)] hover:text-[var(--accent)]"
                        >
                          [{match.team.tag}] {match.team.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-[var(--muted)]">
                          [{match.team.tag}] {match.team.name}
                        </span>
                      )}
                    </div>
                    <div className="match-card-vs">
                      <TeamLogo
                        src={match.opponentLogoUrl}
                        name={match.opponent}
                        tag={match.opponent.slice(0, 3)}
                        size="xl"
                      />
                      <div className="match-card-vs-text">
                        <p className="match-vs-kicker">versus</p>
                        <h3 className="match-heading match-heading-lg">
                          {linkToMatch ? (
                            <Link
                              href={`/matches/${match.id}`}
                              className="hover:text-[var(--accent)]"
                            >
                              {match.opponent}
                            </Link>
                          ) : (
                            match.opponent
                          )}
                        </h3>
                        {match.title && (
                          <p className="mt-1 text-base text-[var(--muted)]">
                            {match.title}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {(canRsvp || linkToMatch) && (
                  <div className="match-card-actions">
                    {canRsvp && currentUserId && (
                      <>
                        <p className="label">
                          Ton statut · {formatLineupStatus(myStatus)}
                        </p>
                        <MatchRsvpButtons
                          matchId={match.id}
                          userId={currentUserId}
                          status={myStatus}
                          fullWidth
                        />
                      </>
                    )}
                    {linkToMatch && (
                      <Link
                        href={`/matches/${match.id}`}
                        className="btn btn-ghost match-open-btn"
                      >
                        Ouvrir le match
                      </Link>
                    )}
                  </div>
                )}
              </div>

              <div className="flex min-h-full flex-col">
                <p className="label mb-3">Présence</p>
                {members.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Aucun membre dans cette équipe pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {members.map((m) => {
                      const status = presence[m.id] ?? "PENDING";
                      return (
                        <li key={m.id} className="member-row">
                          <Avatar
                            src={m.avatarUrl}
                            name={m.displayName}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              <PlayerName
                                name={m.displayName}
                                captain={m.role === "CAPTAIN"}
                              />
                            </p>
                            <p className="truncate text-xs text-[var(--muted)]">
                              {m.battleTag ?? ""}
                            </p>
                            {(m.playerRoles?.length ?? 0) > 0 && (
                              <p className="truncate text-xs text-[var(--muted)]">
                                {m.playerRoles!.map(formatPlayerRole).join(" · ")}
                              </p>
                            )}
                          </div>
                          <span className={`chip ${lineupStatusClass(status)}`}>
                            {formatLineupStatus(status)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {members.length > 0 && (
                  <p className="mt-auto pt-4 text-right text-sm text-[var(--cyan)]">
                    {presentCount}/{members.length} présents
                  </p>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
