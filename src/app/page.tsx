import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main>
      <section className="relative min-h-[calc(100vh-4.25rem)] overflow-hidden">
        <div
          className="absolute inset-0 scale-105"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(6,9,18,0.94) 0%, rgba(6,9,18,0.62) 42%, rgba(6,9,18,0.28) 100%), url('https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=2000&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="hero-scan" />
        <div className="relative mx-auto flex min-h-[calc(100vh-4.25rem)] max-w-6xl flex-col justify-end px-4 pb-16 pt-24 md:px-6 md:pb-24">
          <p className="fade-up mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--cyan)]">
            <span className="pulse-dot" />
            Org Overwatch · roster & planning
          </p>
          <h1 className="font-display fade-up-delay max-w-3xl text-6xl leading-[0.9] md:text-8xl">
            OW Roster
          </h1>
          <p className="fade-up-delay-2 mt-4 max-w-xl text-lg text-[var(--muted)] md:text-xl">
            Un seul endroit pour les matches, les dispos de l&apos;équipe et les
            candidatures.
          </p>
          <div className="fade-up-delay-2 mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="btn btn-primary">
              Créer mon compte
            </Link>
            <Link href="/login" className="btn btn-ghost">
              Se connecter
            </Link>
          </div>
        </div>
      </section>

      <section id="features" className="shell">
        <p className="eyebrow">Le HQ</p>
        <h2 className="font-display text-4xl text-[var(--accent)] md:text-5xl">
          Simple pour jouer, clair pour organiser
        </h2>
        <p className="page-desc">
          Profil, disponibilités, équipes et historique de matches — pensé pour
          une org esport, pas un dashboard générique.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Matches + dispos",
              text: "Vois en un coup d’œil qui est dispo au créneau du scrim.",
            },
            {
              title: "PFP & planning",
              text: "Photo (GIF ok), BattleTag et horaires par jour.",
            },
            {
              title: "Candidatures",
              text: "Postule à une équipe, l’admin valide, tu rejoins le roster.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="panel p-5 fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <h3 className="font-display text-2xl">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
