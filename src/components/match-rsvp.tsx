"use client";

import { useTransition } from "react";
import { setLineupStatus } from "@/lib/actions/captain";
import {
  LINEUP_STATUS_OPTIONS,
  formatLineupStatus,
} from "@/lib/constants";

export function MatchRsvpButtons({
  matchId,
  userId,
  status,
  disabled = false,
  fullWidth = false,
}: {
  matchId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "PENDING" | null;
  disabled?: boolean;
  fullWidth?: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const active = status ?? "PENDING";

  function choose(next: string) {
    if (disabled) return;
    const fd = new FormData();
    fd.set("matchId", matchId);
    fd.set("userId", userId);
    fd.set("status", next);
    startTransition(() => {
      void setLineupStatus(fd);
    });
  }

  return (
    <div
      className={`rsvp-bar ${fullWidth ? "rsvp-bar-full" : ""} ${pending ? "opacity-70" : ""}`}
      role="group"
      aria-label="Statut de présence"
    >
      {LINEUP_STATUS_OPTIONS.map((s) => {
        const selected = active === s.value;
        return (
          <button
            key={s.value}
            type="button"
            disabled={disabled || pending}
            onClick={() => choose(s.value)}
            className={`rsvp-btn ${selected ? `is-on ${s.className}` : ""}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function MatchRsvpCard({
  matchId,
  userId,
  status,
  opponent,
  locked = false,
}: {
  matchId: string;
  userId: string;
  status: "PRESENT" | "ABSENT" | "PENDING" | null;
  opponent: string;
  locked?: boolean;
}) {
  return (
    <section className="panel match-rsvp mt-8 p-5">
      <p className="eyebrow">Ta présence</p>
      <h2 className="section-title mb-1">Tu joues vs {opponent} ?</h2>
      <p className="mb-4 text-sm text-[var(--muted)]">
        {locked
          ? "Le match n’est plus ouvert — le statut est figé."
          : `Choisis Présent, Absent ou Indécis. Actuellement : ${formatLineupStatus(status)}.`}
      </p>
      <MatchRsvpButtons
        matchId={matchId}
        userId={userId}
        status={status}
        disabled={locked}
        fullWidth
      />
    </section>
  );
}
