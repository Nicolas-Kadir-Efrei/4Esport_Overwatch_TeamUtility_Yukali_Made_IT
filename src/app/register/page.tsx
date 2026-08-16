import { RegisterForm } from "@/components/auth-forms";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex w-full flex-1 flex-col items-center justify-center px-4 py-14">
      <div className="panel auth-card">
        <p className="eyebrow">Rejoins l&apos;org</p>
        <h1 className="font-display text-4xl text-[var(--accent)]">Inscription</h1>
        <p className="mb-6 mt-2 text-sm text-[var(--muted)]">
          Crée ton compte, puis postule à une des équipes.
        </p>
        <RegisterForm />
      </div>
    </main>
  );
}
