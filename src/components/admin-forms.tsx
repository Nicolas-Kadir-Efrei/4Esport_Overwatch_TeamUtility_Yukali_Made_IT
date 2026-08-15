"use client";

import { useActionState } from "react";
import {
  adminCreateMatch,
  adminCreateTeam,
  adminUpdateMatch,
  adminUpdateTeam,
  adminUpdateUser,
  type AdminActionState,
} from "@/lib/actions/admin";
import { toDatetimeLocalValue } from "@/lib/constants";

const initial: AdminActionState = {};

function Feedback({ state }: { state: AdminActionState }) {
  if (state.error) return <p className="text-sm text-[var(--danger)]">{state.error}</p>;
  if (state.success) return <p className="text-sm text-[var(--ok)]">{state.success}</p>;
  return null;
}

export function AdminTeamForm({
  team,
}: {
  team?: {
    id: string;
    name: string;
    tag: string;
    description: string | null;
    color: string;
    logoUrl?: string | null;
  };
}) {
  const action = team ? adminUpdateTeam : adminCreateTeam;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      {team && <input type="hidden" name="id" value={team.id} />}
      <div>
        <label className="label" htmlFor={`name-${team?.id ?? "new"}`}>
          Nom
        </label>
        <input
          className="input"
          id={`name-${team?.id ?? "new"}`}
          name="name"
          defaultValue={team?.name}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor={`tag-${team?.id ?? "new"}`}>
          Tag
        </label>
        <input
          className="input"
          id={`tag-${team?.id ?? "new"}`}
          name="tag"
          defaultValue={team?.tag}
          maxLength={8}
          required
        />
      </div>
      <div className="md:col-span-2">
        <label className="label" htmlFor={`desc-${team?.id ?? "new"}`}>
          Description
        </label>
        <textarea
          className="input min-h-20"
          id={`desc-${team?.id ?? "new"}`}
          name="description"
          defaultValue={team?.description ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor={`color-${team?.id ?? "new"}`}>
          Couleur
        </label>
        <input
          className="input h-11"
          id={`color-${team?.id ?? "new"}`}
          name="color"
          type="color"
          defaultValue={team?.color ?? "#FA9C1E"}
        />
      </div>
      <div>
        <label className="label" htmlFor={`logo-${team?.id ?? "new"}`}>
          Logo
        </label>
        <input
          className="input"
          id={`logo-${team?.id ?? "new"}`}
          name="logo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        />
        {team?.logoUrl && (
          <p className="field-hint mt-1">Logo actuel en place — laisse vide pour le garder.</p>
        )}
      </div>
      <div className="flex items-end md:col-span-2">
        <button className="btn btn-primary w-full md:w-auto" disabled={pending} type="submit">
          {pending ? "..." : team ? "Enregistrer" : "Créer l'équipe"}
        </button>
      </div>
      <div className="md:col-span-2">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function AdminMatchForm({
  teams,
  match,
}: {
  teams: { id: string; name: string; tag: string }[];
  match?: {
    id: string;
    teamId: string;
    opponent: string;
    opponentLogoUrl?: string | null;
    title: string | null;
    type: string;
    result: string;
    score: string | null;
    scheduledAt: Date;
    notes: string | null;
  };
}) {
  const action = match ? adminUpdateMatch : adminCreateMatch;
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      {match && <input type="hidden" name="id" value={match.id} />}
      <div>
        <label className="label" htmlFor={`team-${match?.id ?? "new"}`}>
          Équipe
        </label>
        <select
          className="input"
          id={`team-${match?.id ?? "new"}`}
          name="teamId"
          defaultValue={match?.teamId ?? teams[0]?.id}
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
        <label className="label" htmlFor={`type-${match?.id ?? "new"}`}>
          Type
        </label>
        <select
          className="input"
          id={`type-${match?.id ?? "new"}`}
          name="type"
          defaultValue={match?.type ?? "SCRIM"}
        >
          <option value="SCRIM">Scrim</option>
          <option value="TOURNAMENT">Tournoi</option>
          <option value="RANKED">Ranked</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`opp-${match?.id ?? "new"}`}>
          Adversaire
        </label>
        <input
          className="input"
          id={`opp-${match?.id ?? "new"}`}
          name="opponent"
          defaultValue={match?.opponent}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor={`opp-logo-${match?.id ?? "new"}`}>
          Logo adversaire
        </label>
        <input
          className="input"
          id={`opp-logo-${match?.id ?? "new"}`}
          name="opponentLogo"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
        />
        {match?.opponentLogoUrl && (
          <p className="field-hint mt-1">Logo actuel en place — laisse vide pour le garder.</p>
        )}
      </div>
      <div>
        <label className="label" htmlFor={`title-${match?.id ?? "new"}`}>
          Titre
        </label>
        <input
          className="input"
          id={`title-${match?.id ?? "new"}`}
          name="title"
          defaultValue={match?.title ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor={`when-${match?.id ?? "new"}`}>
          Date & heure
        </label>
        <input
          className="input"
          id={`when-${match?.id ?? "new"}`}
          name="scheduledAt"
          type="datetime-local"
          defaultValue={
            match ? toDatetimeLocalValue(new Date(match.scheduledAt)) : undefined
          }
          required
        />
      </div>
      <div>
        <label className="label" htmlFor={`result-${match?.id ?? "new"}`}>
          Résultat
        </label>
        <select
          className="input"
          id={`result-${match?.id ?? "new"}`}
          name="result"
          defaultValue={match?.result ?? "SCHEDULED"}
        >
          <option value="SCHEDULED">Planifié</option>
          <option value="WIN">Victoire</option>
          <option value="LOSS">Défaite</option>
          <option value="DRAW">Égalité</option>
          <option value="CANCELLED">Annulé</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`score-${match?.id ?? "new"}`}>
          Score
        </label>
        <input
          className="input"
          id={`score-${match?.id ?? "new"}`}
          name="score"
          placeholder="2-1"
          defaultValue={match?.score ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor={`notes-${match?.id ?? "new"}`}>
          Notes
        </label>
        <input
          className="input"
          id={`notes-${match?.id ?? "new"}`}
          name="notes"
          defaultValue={match?.notes ?? ""}
        />
      </div>
      <div className="md:col-span-2">
        <Feedback state={state} />
        <button className="btn btn-primary mt-2" disabled={pending} type="submit">
          {pending ? "..." : match ? "Enregistrer le match" : "Créer le match"}
        </button>
      </div>
    </form>
  );
}

export function AdminUserForm({
  user,
  teams,
}: {
  user: {
    id: string;
    displayName: string;
    battleTag: string | null;
    role: string;
    membership: { teamId: string; role: string } | null;
  };
  teams: { id: string; name: string; tag: string }[];
}) {
  const [state, formAction, pending] = useActionState(adminUpdateUser, initial);

  return (
    <form action={formAction} className="grid gap-3 md:grid-cols-2">
      <input type="hidden" name="id" value={user.id} />
      <div>
        <label className="label" htmlFor={`dn-${user.id}`}>
          Pseudo
        </label>
        <input
          className="input"
          id={`dn-${user.id}`}
          name="displayName"
          defaultValue={user.displayName}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor={`bt-${user.id}`}>
          BattleTag
        </label>
        <input
          className="input"
          id={`bt-${user.id}`}
          name="battleTag"
          defaultValue={user.battleTag ?? ""}
        />
      </div>
      <div>
        <label className="label" htmlFor={`role-${user.id}`}>
          Rôle global
        </label>
        <select
          className="input"
          id={`role-${user.id}`}
          name="role"
          defaultValue={user.role}
        >
          <option value="PLAYER">Joueur</option>
          <option value="ADMIN">Admin</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`team-${user.id}`}>
          Équipe
        </label>
        <select
          className="input"
          id={`team-${user.id}`}
          name="teamId"
          defaultValue={user.membership?.teamId ?? ""}
        >
          <option value="">Aucune</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              [{t.tag}] {t.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`tr-${user.id}`}>
          Rôle équipe
        </label>
        <select
          className="input"
          id={`tr-${user.id}`}
          name="teamRole"
          defaultValue={user.membership?.role ?? "PLAYER"}
        >
          <option value="PLAYER">Joueur</option>
          <option value="CAPTAIN">Capitaine</option>
        </select>
      </div>
      <div>
        <label className="label" htmlFor={`pw-${user.id}`}>
          Nouveau mot de passe
        </label>
        <input
          className="input"
          id={`pw-${user.id}`}
          name="password"
          type="password"
          placeholder="Laisser vide = inchangé"
        />
      </div>
      <div className="md:col-span-2">
        <Feedback state={state} />
        <button className="btn btn-primary mt-2" disabled={pending} type="submit">
          {pending ? "..." : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}
