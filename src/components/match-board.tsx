import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { DAY_SHORT, formatMatchType, formatPlayerRole, overlapsSlot } from "@/lib/constants";
import { Avatar } from "@/components/avatar";
import { TeamLogo } from "@/components/team-logo";

type Slot = { dayOfWeek: number; startTime: string; endTime: string };

type Member = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  battleTag: string | null;
  smurfTags?: string[];
  playerRoles?: string[];
  role: string;
  availabilities: Slot[];
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

export function MatchAvailabilityBoard({
  matches,
  members,
  linkToMatch = true,
}: {
  matches: MatchItem[];
  members: Member[];
  linkToMatch?: boolean;
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
        const d = new Date(match.scheduledAt);
        const dayOfWeek = d.getDay();
        const hour = d.getHours();
        const minute = d.getMinutes();
        const availableCount = members.filter((m) =>
          overlapsSlot(dayOfWeek, hour, minute, m.availabilities),
        ).length;

        return (
          <article key={match.id} className="panel overflow-hidden fade-up">
            <div
              className="match-rail"
              style={{ background: match.team.color }}
            />
            <div className="grid gap-5 p-5 lg:grid-cols-[1.05fr_1.35fr]">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="chip avail-maybe">
                    {formatMatchType(match.type)}
                  </span>
                  {match.team.id ? (
                    <Link
                      href={`/teams/${match.team.id}`}
                      className="text-xs text-[var(--muted)] hover:text-[var(--accent)]"
                    >
                      [{match.team.tag}] {match.team.name}
                    </Link>
                  ) : (
                    <span className="text-xs text-[var(--muted)]">
                      [{match.team.tag}] {match.team.name}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-3xl leading-none">
                  {linkToMatch ? (
                    <Link
                      href={`/matches/${match.id}`}
                      className="inline-flex items-center gap-3 hover:text-[var(--accent)]"
                    >
                      <TeamLogo
                        src={match.opponentLogoUrl}
                        name={match.opponent}
                        tag={match.opponent.slice(0, 3)}
                        size="md"
                      />
                      vs {match.opponent}
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-3">
                      <TeamLogo
                        src={match.opponentLogoUrl}
                        name={match.opponent}
                        tag={match.opponent.slice(0, 3)}
                        size="md"
                      />
                      vs {match.opponent}
                    </span>
                  )}
                </h3>
                {match.title && (
                  <p className="mt-1.5 text-sm text-[var(--muted)]">{match.title}</p>
                )}
                <p className="mt-3 text-sm font-medium">
                  {format(d, "EEEE d MMMM · HH:mm", { locale: fr })}
                </p>
                {match.notes && (
                  <p className="mt-2 text-sm text-[var(--muted)]">{match.notes}</p>
                )}
                {members.length > 0 && (
                  <p className="mt-4 text-sm text-[var(--cyan)]">
                    {availableCount}/{members.length} joueurs dispo
                  </p>
                )}
                {linkToMatch && (
                  <Link
                    href={`/matches/${match.id}`}
                    className="btn btn-ghost mt-4 text-xs"
                  >
                    Ouvrir le match
                  </Link>
                )}
              </div>

              <div>
                <p className="label mb-3">
                  Dispos · {DAY_SHORT[dayOfWeek]}{" "}
                  {String(hour).padStart(2, "0")}:
                  {String(minute).padStart(2, "0")}
                </p>
                {members.length === 0 ? (
                  <p className="text-sm text-[var(--muted)]">
                    Aucun membre dans cette équipe pour l&apos;instant.
                  </p>
                ) : (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {members.map((m) => {
                      const available = overlapsSlot(
                        dayOfWeek,
                        hour,
                        minute,
                        m.availabilities,
                      );
                      return (
                        <li key={m.id} className="member-row">
                          <Avatar
                            src={m.avatarUrl}
                            name={m.displayName}
                            size="sm"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {m.displayName}
                            </p>
                            <p className="truncate text-xs text-[var(--muted)]">
                              {m.role === "CAPTAIN" ? "Capitaine" : "Joueur"}
                              {m.battleTag ? ` · ${m.battleTag}` : ""}
                            </p>
                            {(m.playerRoles?.length ?? 0) > 0 && (
                              <p className="truncate text-[11px] text-[var(--cyan)]">
                                {m.playerRoles!.map(formatPlayerRole).join(" · ")}
                              </p>
                            )}
                          </div>
                          <span
                            className={`chip ${available ? "avail-yes" : "avail-no"}`}
                          >
                            {available ? "Dispo" : "Absent"}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
