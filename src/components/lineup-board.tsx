"use client";

import { useTransition } from "react";
import { setLineupPlayer } from "@/lib/actions/captain";
import { Avatar } from "@/components/avatar";
import { PlayerName } from "@/components/captain-crown";
import { MatchRsvpButtons } from "@/components/match-rsvp";
import { formatPlayerRole } from "@/lib/constants";

type LineupMember = {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  battleTag: string | null;
  discord: string | null;
  teamRole: string;
  playerRoles: string[];
  playing: boolean;
  status: "PRESENT" | "ABSENT" | "PENDING" | null;
};

export function LineupBoard({
  matchId,
  members,
  isManager,
  currentUserId,
  locked = false,
}: {
  matchId: string;
  members: LineupMember[];
  isManager: boolean;
  currentUserId: string;
  locked?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  const playingCount = members.filter((m) => m.playing).length;
  const presentCount = members.filter(
    (m) => m.playing && m.status === "PRESENT",
  ).length;

  function togglePlaying(member: LineupMember) {
    if (!isManager || locked) return;
    const nextPlaying = !member.playing;
    const fd = new FormData();
    fd.set("matchId", matchId);
    fd.set("userId", member.userId);
    fd.set("playing", nextPlaying ? "1" : "0");
    fd.set("status", member.status ?? "PENDING");
    startTransition(() => {
      void setLineupPlayer(fd);
    });
  }

  return (
    <div className={`space-y-4 ${pending ? "opacity-80" : ""}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="chip avail-maybe">
          {playingCount} dans la lineup
        </span>
        <span className="chip avail-yes">{presentCount} présents</span>
        {isManager ? (
          <span className="text-[var(--muted)]">
            Coche « Joue » pour la lineup. Chaque joueur peut aussi poser son
            statut.
          </span>
        ) : (
          <span className="text-[var(--muted)]">
            Change ton statut : Présent, Absent ou Indécis.
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          const canSetStatus = !locked && (isManager || isSelf);

          return (
            <li
              key={m.userId}
              className={`panel px-4 py-3 ${
                m.playing || isSelf ? "border-[var(--line-strong)]" : ""
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  {isManager ? (
                    <label className="flex cursor-pointer items-center gap-2 shrink-0">
                      <input
                        type="checkbox"
                        className="h-5 w-5 accent-[var(--accent)]"
                        checked={m.playing}
                        disabled={locked}
                        onChange={() => togglePlaying(m)}
                        aria-label={`${m.displayName} joue`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Joue
                      </span>
                    </label>
                  ) : (
                    <span
                      className={`chip ${
                        m.status === "PRESENT"
                          ? "avail-yes"
                          : m.status === "ABSENT"
                            ? "avail-no"
                            : "avail-maybe"
                      }`}
                    >
                      {m.status === "PRESENT"
                        ? "Présent"
                        : m.status === "ABSENT"
                          ? "Absent"
                          : "Indécis"}
                    </span>
                  )}

                  <Avatar src={m.avatarUrl} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      <PlayerName
                        name={m.displayName}
                        captain={m.teamRole === "CAPTAIN"}
                      />
                      {isSelf ? " (toi)" : ""}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {m.battleTag ?? "—"}
                      {m.discord ? ` · ${m.discord}` : ""}
                    </p>
                    {m.playerRoles.length > 0 && (
                      <p className="truncate text-xs text-[var(--muted)]">
                        {m.playerRoles.map(formatPlayerRole).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-auto">
                  <MatchRsvpButtons
                    matchId={matchId}
                    userId={m.userId}
                    status={m.status}
                    disabled={!canSetStatus}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
