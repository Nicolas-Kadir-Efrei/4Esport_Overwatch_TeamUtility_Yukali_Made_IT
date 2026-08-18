import { AdminUserForm } from "@/components/admin-forms";
import { AdminNav } from "@/components/admin-nav";
import { CaptainCrown } from "@/components/captain-crown";
import { adminDeleteUser } from "@/lib/actions/admin";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const [users, teams] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { membership: { include: { team: true } } },
    }),
    prisma.team.findMany({ orderBy: { name: "asc" } }),
  ]);

  const teamOpts = teams.map((t) => ({ id: t.id, name: t.name, tag: t.tag }));

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
      <h1 className="page-title">Joueurs</h1>
      <p className="mt-2 text-[var(--muted)]">
        Modifier comptes, équipe, mot de passe — le capitaine se choisit dans Équipes.
      </p>
      <AdminNav current="/admin/users" />

      <section className="space-y-4">
        {users.map((user) => (
          <article key={user.id} className="panel p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="avatar-frame h-12 w-12 object-cover" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-lg border border-[var(--line)] bg-[var(--bg-elevated)] font-semibold">
                    {user.displayName.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="section-title inline-flex items-center gap-1.5">
                    {user.displayName}
                    {user.membership?.role === "CAPTAIN" ? (
                      <CaptainCrown className="h-4 w-4" />
                    ) : null}
                  </p>
                  <p className="text-sm text-[var(--muted)]">
                    {user.email}
                    {user.membership
                      ? ` · [${user.membership.team.tag}]`
                      : " · sans équipe"}
                    {user.role === "ADMIN" ? " · ADMIN" : ""}
                  </p>
                </div>
              </div>
              {user.id !== admin.id && (
                <form action={adminDeleteUser}>
                  <input type="hidden" name="id" value={user.id} />
                  <button className="btn btn-danger text-xs" type="submit">
                    Supprimer
                  </button>
                </form>
              )}
            </div>
            <AdminUserForm
              user={{
                id: user.id,
                displayName: user.displayName,
                battleTag: user.battleTag,
                role: user.role,
                membership: user.membership
                  ? { teamId: user.membership.teamId, role: user.membership.role }
                  : null,
              }}
              teams={teamOpts}
            />
          </article>
        ))}
      </section>
    </main>
  );
}
