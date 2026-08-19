import { LoginForm } from "@/components/auth-forms";

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 py-14">
      <div className="panel auth-card">
        <p className="eyebrow">Bienvenue</p>
        <h1 className="font-display text-4xl text-[var(--accent)]">Connexion</h1>
        <p className="mb-6 mt-2 text-sm text-[var(--muted)]">
          Accède au QG 4Esport pour voir matches et disponibilités.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
