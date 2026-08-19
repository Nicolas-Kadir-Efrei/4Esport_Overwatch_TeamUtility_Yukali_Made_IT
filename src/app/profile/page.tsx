import Link from "next/link";
import {
  AvatarForm,
  AvailabilityEditor,
  ProfileForm,
} from "@/components/profile-forms";
import { Avatar } from "@/components/avatar";
import { PageHeader } from "@/components/ui";
import { formatPlayerRole } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const sessionUser = await requireUser();
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: sessionUser.id },
    include: {
      availabilities: true,
      membership: { include: { team: true } },
      links: true,
    },
  });

  return (
    <main className="shell max-w-3xl">
      <PageHeader
        eyebrow="Ton espace"
        title="Profil"
        description="BattleTag, Discord, liens, rôles, PFP et disponibilités."
      />

      <section className="panel fade-up mb-5 overflow-hidden">
        <div className="flex flex-wrap items-center gap-4 border-b border-[var(--line)] bg-black/15 px-5 py-4">
          <Avatar src={user.avatarUrl} name={user.displayName} size="lg" />
          <div>
            <p className="section-title">{user.displayName}</p>
            <p className="text-sm text-[var(--muted)]">
              {user.role === "ADMIN" ? "Admin" : "Joueur"}
              {user.membership
                ? ` · ${user.membership.role === "CAPTAIN" ? "Capitaine" : "Membre"} de [${user.membership.team.tag}]`
                : " · Pas encore d’équipe"}
            </p>
            {user.discord && (
              <p className="mt-1 text-sm text-[var(--muted)]">Discord · {user.discord}</p>
            )}
            {user.battleTag && (
              <p className="mt-1 text-sm text-[var(--cyan)]">{user.battleTag}</p>
            )}
            {user.playerRoles.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {user.playerRoles.map((r) => (
                  <span key={r} className="chip avail-maybe">
                    {formatPlayerRole(r)}
                  </span>
                ))}
              </div>
            )}
            {!user.membership && (
              <Link href="/teams" className="mt-2 inline-block text-sm text-[var(--accent)]">
                Postuler à une équipe →
              </Link>
            )}
          </div>
        </div>
        <div className="p-5">
          <h2 className="section-title mb-4">Identité & rôles</h2>
          <ProfileForm
            displayName={user.displayName}
            battleTag={user.battleTag}
            discord={user.discord}
            smurfTags={user.smurfTags}
            playerRoles={user.playerRoles}
            links={user.links.map((l) => ({ label: l.label, url: l.url }))}
          />
        </div>
      </section>

      <section className="panel fade-up mb-5 p-5">
        <h2 className="section-title mb-1">Photo de profil</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          PNG, JPG, WebP ou GIF animé — jusqu’à 5 Mo.
        </p>
        <AvatarForm
          userId={user.id}
          avatarUrl={user.avatarUrl}
          displayName={user.displayName}
        />
      </section>

      <section className="panel fade-up p-5">
        <h2 className="section-title mb-1">Disponibilités</h2>
        <p className="mb-4 text-sm text-[var(--muted)]">
          Ajoute tes créneaux, puis enregistre. Clique un créneau pour le retirer.
        </p>
        <AvailabilityEditor
          initialSlots={user.availabilities.map((a) => ({
            dayOfWeek: a.dayOfWeek,
            startTime: a.startTime,
            endTime: a.endTime,
          }))}
        />
      </section>
    </main>
  );
}
