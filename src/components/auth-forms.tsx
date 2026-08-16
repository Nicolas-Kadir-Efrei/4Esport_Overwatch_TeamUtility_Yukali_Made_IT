"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, register, type AuthActionState } from "@/lib/actions/auth";

const initial: AuthActionState = {};

function Feedback({ state }: { state: AuthActionState }) {
  if (!state.error) return null;
  return <p className="alert alert-error">{state.error}</p>;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <Feedback state={state} />
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Connexion..." : "Entrer dans le HQ"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Pas encore de compte ?{" "}
        <Link className="font-semibold text-[var(--accent)]" href="/register">
          S&apos;inscrire
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = useActionState(register, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="label" htmlFor="displayName">
          Pseudo
        </label>
        <input className="input" id="displayName" name="displayName" required />
      </div>
      <div>
        <label className="label" htmlFor="battleTag">
          BattleTag (optionnel)
        </label>
        <input
          className="input"
          id="battleTag"
          name="battleTag"
          placeholder="Pseudo#1234"
        />
      </div>
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input
          className="input"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Mot de passe
        </label>
        <input
          className="input"
          id="password"
          name="password"
          type="password"
          minLength={10}
          autoComplete="new-password"
          required
        />
        <p className="field-hint">Min. 10 caractères, avec lettre et chiffre.</p>
      </div>
      <Feedback state={state} />
      <button className="btn btn-primary w-full" disabled={pending} type="submit">
        {pending ? "Création..." : "Créer mon compte"}
      </button>
      <p className="text-center text-sm text-[var(--muted)]">
        Déjà inscrit ?{" "}
        <Link className="font-semibold text-[var(--accent)]" href="/login">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
