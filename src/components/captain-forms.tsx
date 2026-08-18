"use client";

import { useActionState } from "react";
import {
  createTeamLink,
  createMatchLink,
  updateMatchScore,
  updateMatchDetails,
  updateMatchContactTags,
  setTeamCaptain,
  kickTeamMember,
  deleteTeamLink,
  deleteMatchLink,
  uploadTeamLogo,
  uploadOpponentLogo,
  type CaptainActionState,
} from "@/lib/actions/captain";
import { TeamLogo } from "@/components/team-logo";
import { toDatetimeLocalValue } from "@/lib/constants";

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

export function MatchEditForm({
  match,
}: {
  match: {
    id: string;
    opponent: string;
    title: string | null;
    type: string;
    scheduledAt: Date;
    notes: string | null;
  };
}) {
  const [state, action, pending] = useActionState(updateMatchDetails, initial);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="matchId" value={match.id} />
      <div>
        <label className="label" htmlFor="edit-type">
          Type
        </label>
        <select
          className="input"
          id="edit-type"
          name="type"
          defaultValue={match.type}
        >
          <option value="SCRIM">Scrim</option>
          <option value="TOURNAMENT">Tournoi</option>
          <option value="RANKED">Ranked</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor="edit-when">
          Date & heure
        </label>
        <input
          className="input"
          id="edit-when"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={toDatetimeLocalValue(new Date(match.scheduledAt))}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="edit-opp">
          Adversaire
        </label>
        <input
          className="input"
          id="edit-opp"
          name="opponent"
          defaultValue={match.opponent}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="edit-title">
          Titre
        </label>
        <input
          className="input"
          id="edit-title"
          name="title"
          defaultValue={match.title ?? ""}
        />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="edit-notes">
          Notes
        </label>
        <input
          className="input"
          id="edit-notes"
          name="notes"
          defaultValue={match.notes ?? ""}
        />
      </div>
      <div className="md:col-span-2 flex flex-wrap items-center gap-3">
        <button className="btn btn-primary text-sm" disabled={pending} type="submit">
          {pending ? "…" : "Enregistrer le match"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function MatchLinkForm({ matchId }: { matchId: string }) {
  const [state, action, pending] = useActionState(createMatchLink, initial);

  return (
    <form action={action} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <label className="label" htmlFor="match-link-title">
          Titre
        </label>
        <input
          className="input"
          id="match-link-title"
          name="title"
          placeholder="VOD Twitch, replay…"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="match-link-url">
          URL
        </label>
        <input
          className="input"
          id="match-link-url"
          name="url"
          placeholder="https://www.twitch.tv/videos/…"
          required
        />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor="match-link-desc">
          Description
        </label>
        <input
          className="input"
          id="match-link-desc"
          name="description"
          placeholder="Map 1, POV Yukali, etc."
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

export function DeleteMatchLinkButton({ linkId }: { linkId: string }) {
  return (
    <form action={deleteMatchLink}>
      <input type="hidden" name="linkId" value={linkId} />
      <button className="btn btn-danger px-2 py-1 text-[10px]" type="submit">
        Suppr.
      </button>
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
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
          required
        />
        <p className="field-hint">PNG, JPG, WebP ou GIF · max 5 Mo</p>
        <Feedback state={state} />
        <button className="btn btn-primary text-sm" disabled={pending} type="submit">
          {pending ? "Upload…" : "Mettre à jour le logo"}
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
          accept="image/png,image/jpeg,image/jpg,image/webp,image/gif,.png,.jpg,.jpeg,.webp,.gif"
          required
        />
        <p className="field-hint">PNG, JPG, WebP ou GIF · max 5 Mo</p>
        <Feedback state={state} />
        <button className="btn btn-primary text-sm" disabled={pending} type="submit">
          {pending ? "Upload…" : "Mettre à jour"}
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

export function SetCaptainForm({
  teamId,
  members,
}: {
  teamId: string;
  members: { userId: string; displayName: string; role: string }[];
}) {
  const [state, action, pending] = useActionState(setTeamCaptain, initial);
  const current = members.find((m) => m.role === "CAPTAIN")?.userId ?? "";

  if (members.length === 0) {
    return (
      <p className="text-sm text-[var(--muted)]">
        Ajoute des joueurs avant de nommer un capitaine.
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="teamId" value={teamId} />
      <div className="min-w-[14rem] flex-1">
        <label className="label" htmlFor={`captain-${teamId}`}>
          Capitaine
        </label>
        <select
          className="input"
          id={`captain-${teamId}`}
          name="userId"
          defaultValue={current}
          required
        >
          {members.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.displayName}
              {m.role === "CAPTAIN" ? " (actuel)" : ""}
            </option>
          ))}
        </select>
      </div>
      <button className="btn btn-primary text-sm" disabled={pending} type="submit">
        {pending ? "…" : "Nommer capitaine"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

export function MatchContactTagsForm({
  matchId,
  contactBattleTags,
}: {
  matchId: string;
  contactBattleTags: string[];
}) {
  const [state, action, pending] = useActionState(
    updateMatchContactTags,
    initial,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="matchId" value={matchId} />
      <div>
        <label className="label" htmlFor="contactBattleTags">
          BattleTags à contacter
        </label>
        <textarea
          className="input min-h-20"
          id="contactBattleTags"
          name="contactBattleTags"
          defaultValue={contactBattleTags.join("\n")}
          placeholder={"Yukali#1234\nCoach#5678"}
        />
        <p className="field-hint">
          Un tag par ligne, ou séparés par des virgules. C’est le contact pour
          ce match (pas le BattleTag perso du joueur).
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary text-sm" disabled={pending} type="submit">
          {pending ? "…" : "Enregistrer les contacts"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
