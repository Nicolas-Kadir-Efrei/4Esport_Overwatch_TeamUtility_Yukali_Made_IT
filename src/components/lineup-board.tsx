"use client";

import { useTransition } from "react";
import { setLineupPlayer, setLineupStatus } from "@/lib/actions/captain";
import { Avatar } from "@/components/avatar";
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

const STATUSES = [
  { value: "PRESENT", label: "Présent", className: "avail-yes" },
  { value: "PENDING", label: "Indécis", className: "avail-maybe" },
  { value: "ABSENT", label: "Absent", className: "avail-no" },
] as const;

export function LineupBoard({
  matchId,
  members,
  isManager,
  currentUserId,
}: {
  matchId: string;
  members: LineupMember[];
  isManager: boolean;
  currentUserId: string;
}) {
  const [pending, startTransition] = useTransition();

  const playingCount = members.filter((m) => m.playing).length;
  const presentCount = members.filter(
    (m) => m.playing && m.status === "PRESENT",
  ).length;

  function togglePlaying(member: LineupMember) {
    if (!isManager) return;
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

  function setStatus(member: LineupMember, status: string) {
    const canEdit =
      isManager || member.userId === currentUserId;
    if (!canEdit) return;

    // Joueur : doit déjà être en lineup
    if (!isManager && !member.playing) return;

    if (isManager) {
      const fd = new FormData();
      fd.set("matchId", matchId);
      fd.set("userId", member.userId);
      fd.set("playing", "1");
      fd.set("status", status);
      startTransition(() => {
        void setLineupPlayer(fd);
      });
      return;
    }

    const fd = new FormData();
    fd.set("matchId", matchId);
    fd.set("userId", member.userId);
    fd.set("status", status);
    startTransition(() => {
      void setLineupStatus(fd);
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
            Coche « Joue », puis choisis Présent / Indécis / Absent.
          </span>
        ) : (
          <span className="text-[var(--muted)]">
            Si tu es dans la lineup, mets ton statut ci-dessous.
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {members.map((m) => {
          const isSelf = m.userId === currentUserId;
          const canSetStatus = isManager || (isSelf && m.playing);
          const activeStatus = m.playing ? m.status ?? "PENDING" : null;

          return (
            <li
              key={m.userId}
              className={`panel px-4 py-3 transition ${
                m.playing
                  ? "border-[var(--line-strong)]"
                  : "opacity-75"
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
                        onChange={() => togglePlaying(m)}
                        aria-label={`${m.displayName} joue`}
                      />
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                        Joue
                      </span>
                    </label>
                  ) : (
                    <span
                      className={`chip text-[10px] ${
                        m.playing ? "avail-yes" : "avail-no"
                      }`}
                    >
                      {m.playing ? "Lineup" : "Banc"}
                    </span>
                  )}

                  <Avatar src={m.avatarUrl} name={m.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">
                      {m.displayName}
                      {m.teamRole === "CAPTAIN" ? " ★" : ""}
                      {isSelf ? " (toi)" : ""}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {m.battleTag ?? "—"}
                      {m.discord ? ` · ${m.discord}` : ""}
                    </p>
                    {m.playerRoles.length > 0 && (
                      <p className="truncate text-[11px] text-[var(--cyan)]">
                        {m.playerRoles.map(formatPlayerRole).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 sm:justify-end">
                  {STATUSES.map((s) => {
                    const selected = activeStatus === s.value;
                    const disabled = !canSetStatus;
                    return (
                      <button
                        key={s.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => setStatus(m, s.value)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                          selected
                            ? s.className
                            : "border-[var(--line)] bg-transparent text-[var(--muted)]"
                        } ${disabled ? "cursor-not-allowed opacity-40" : "hover:border-[var(--line-strong)]"}`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
