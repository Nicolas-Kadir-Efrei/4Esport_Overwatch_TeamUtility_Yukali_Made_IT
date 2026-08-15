"use client";

import { useActionState } from "react";
import {
  createTeamLink,
  updateMatchScore,
  kickTeamMember,
  deleteTeamLink,
  uploadTeamLogo,
  uploadOpponentLogo,
  type CaptainActionState,
} from "@/lib/actions/captain";
import { TeamLogo } from "@/components/team-logo";

const initial: CaptainActionState = {};

function Feedback({ state }: { state: CaptainActionState }) {
  if (state.error) return <p className="alert alert-error">{state.error}</p>;
  if (state.success) return <p className="alert alert-ok">{state.success}</p>;
  return null;
}

export function MatchScoreForm({
  matchId,
  result,
  score,
}: {
  matchId: string;
  result: string;
  score: string | null;
}) {
  const [state, action, pending] = useActionState(updateMatchScore, initial);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <label className="label" htmlFor="result">
          Résultat
        </label>
        <select className="input" id="result" name="result" defaultValue={result}>
          <option value="SCHEDULED">Planifié</option>
          <option value="WIN">Victoire</option>
          <option value="LOSS">Défaite</option>
          <option value="DRAW">Égalité</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="score">
          Score
        </label>
        <input
          className="input"
          id="score"
          name="score"
          defaultValue={score ?? ""}
          placeholder="2-1"
        />
      </div>
      <div className="flex items-end">
        <button className="btn btn-primary w-full" disabled={pending} type="submit">
          {pending ? "…" : "Enregistrer"}
        </button>
      </div>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function TeamLogoForm({
  teamId,
  logoUrl,
  name,
  tag,
  color,
}: {
  teamId: string;
  logoUrl?: string | null;
  name: string;
  tag: string;
  color: string;
}) {
  const [state, action, pending] = useActionState(uploadTeamLogo, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="teamId" value={teamId} />
      <TeamLogo src={logoUrl} name={name} tag={tag} color={color} size="lg" />
      <div className="min-w-[14rem] flex-1 space-y-2">
        <label className="label" htmlFor="team-logo">
          Logo d&apos;équipe
        </label>
        <input
          className="input"
          id="team-logo"
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
        />
        <p className="field-hint">PNG, JPG, WebP ou GIF · max 5 Mo</p>
        <Feedback state={state} />
        <button className="btn btn-ghost text-sm" disabled={pending} type="submit">
          {pending ? "…" : "Mettre à jour le logo"}
        </button>
      </div>
    </form>
  );
}

export function OpponentLogoForm({
  matchId,
  opponent,
  opponentLogoUrl,
}: {
  matchId: string;
  opponent: string;
  opponentLogoUrl?: string | null;
}) {
  const [state, action, pending] = useActionState(uploadOpponentLogo, initial);

  return (
    <form action={action} className="flex flex-wrap items-center gap-4">
      <input type="hidden" name="matchId" value={matchId} />
      <TeamLogo
        src={opponentLogoUrl}
        name={opponent}
        tag={opponent.slice(0, 3)}
        size="lg"
      />
      <div className="min-w-[14rem] flex-1 space-y-2">
        <label className="label" htmlFor="opp-logo">
          Logo adversaire
        </label>
        <input
          className="input"
          id="opp-logo"
          name="opponentLogo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          required
        />
        <Feedback state={state} />
        <button className="btn btn-ghost text-sm" disabled={pending} type="submit">
          {pending ? "…" : "Mettre à jour"}
        </button>
      </div>
    </form>
  );
}

export function TeamLinkForm({ teamId }: { teamId: string }) {
  const [state, action, pending] = useActionState(createTeamLink, initial);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="teamId" value={teamId} />
      <div>
        <label className="label" htmlFor="title">
          Titre
        </label>
        <input
          className="input"
          id="title"
          name="title"
          placeholder="Discord équipe"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="url">
          URL
        </label>
        <input
          className="input"
          id="url"
          name="url"
          placeholder="https://discord.gg/…"
          required
        />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="description">
          Description
        </label>
        <input
          className="input"
          id="description"
          name="description"
          placeholder="Salon #scrims, règles, etc."
        />
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary text-sm" disabled={pending} type="submit">
          {pending ? "…" : "Ajouter le lien"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DeleteTeamLinkButton({ linkId }: { linkId: string }) {
  return (
    <form action={deleteTeamLink}>
      <input type="hidden" name="linkId" value={linkId} />
      <button className="btn btn-danger px-2 py-1 text-[10px]" type="submit">
        Suppr.
      </button>
    </form>
  );
}

export function KickMemberButton({
  teamId,
  userId,
}: {
  teamId: string;
  userId: string;
}) {
  return (
    <form action={kickTeamMember}>
      <input type="hidden" name="teamId" value={teamId} />
      <input type="hidden" name="userId" value={userId} />
      <button className="btn btn-danger px-2 py-1 text-[10px]" type="submit">
        Virer
      </button>
    </form>
  );
}
