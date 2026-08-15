"use client";

import { useActionState } from "react";
import {
  createMatch,
  requestJoinTeam,
  reviewJoinRequest,
  type TeamActionState,
} from "@/lib/actions/teams";

const initial: TeamActionState = {};

export function JoinTeamForm({
  teamId,
  teamName,
  disabled,
}: {
  teamId: string;
  teamName: string;
  disabled?: boolean;
}) {
  const [state, action, pending] = useActionState(requestJoinTeam, initial);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label className="label" htmlFor={`msg-${teamId}`}>
          Message (optionnel)
        </label>
        <textarea
          className="input min-h-20"
          id={`msg-${teamId}`}
          name="message"
          placeholder={`Pourquoi rejoindre ${teamName} ?`}
          disabled={disabled}
        />
      </div>
      {state.error && <p className="alert alert-error">{state.error}</p>}
      {state.success && <p className="alert alert-ok">{state.success}</p>}
      <button
        className="btn btn-primary text-xs"
        type="submit"
        disabled={disabled || pending}
      >
        {disabled ? "Indisponible" : pending ? "Envoi..." : "Postuler"}
      </button>
    </form>
  );
}

export function ReviewRequestForm({ requestId }: { requestId: string }) {
  const [state, action, pending] = useActionState(reviewJoinRequest, initial);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <form action={action}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="decision" value="ACCEPTED" />
          <button className="btn btn-primary text-xs" disabled={pending} type="submit">
            Accepter
          </button>
        </form>
        <form action={action}>
          <input type="hidden" name="requestId" value={requestId} />
          <input type="hidden" name="decision" value="REJECTED" />
          <button className="btn btn-danger text-xs" disabled={pending} type="submit">
            Refuser
          </button>
        </form>
      </div>
      {state.error && <p className="text-sm text-[var(--danger)]">{state.error}</p>}
      {state.success && <p className="text-sm text-[var(--ok)]">{state.success}</p>}
    </div>
  );
}

export function CreateMatchForm({
  teams,
  defaultTeamId,
}: {
  teams: { id: string; name: string; tag: string }[];
  defaultTeamId?: string | null;
}) {
  const [state, action, pending] = useActionState(createMatch, initial);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <div>
        <label className="label" htmlFor="teamId">
          Équipe
        </label>
        <select
          className="input"
          id="teamId"
          name="teamId"
          defaultValue={defaultTeamId ?? teams[0]?.id}
          required
        >
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.tag}] {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor="type">
          Type
        </label>
        <select className="input" id="type" name="type" defaultValue="SCRIM">
          <option value="SCRIM">Scrim</option>
          <option value="TOURNAMENT">Tournoi</option>
          <option value="RANKED">Ranked</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="opponent">
          Adversaire
        </label>
        <input className="input" id="opponent" name="opponent" required />
      </div>
      <div>
        <label className="label" htmlFor="opponentLogo">
          Logo adversaire
        </label>
        <input
          className="input"
          id="opponentLogo"
          name="opponentLogo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        />
      </div>
      <div>
        <label className="label" htmlFor="title">
          Titre (optionnel)
        </label>
        <input className="input" id="title" name="title" />
      </div>
      <div>
        <label className="label" htmlFor="scheduledAt">
          Date & heure
        </label>
        <input
          className="input"
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="notes">
          Notes
        </label>
        <input className="input" id="notes" name="notes" />
      </div>
      <div className="md:col-span-2">
        {state.error && <p className="mb-2 text-sm text-[var(--danger)]">{state.error}</p>}
        {state.success && <p className="mb-2 text-sm text-[var(--ok)]">{state.success}</p>}
        <button className="btn btn-primary" disabled={pending} type="submit">
          {pending ? "Ajout..." : "Planifier le match"}
        </button>
      </div>
    </form>
  );
}
