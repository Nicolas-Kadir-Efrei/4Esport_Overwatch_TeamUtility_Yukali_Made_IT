import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { GlobalRole, TeamRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/dashboard");
  return user;
}

export function isCaptainOrAdmin(
  role: GlobalRole,
  teamRole?: TeamRole | null,
) {
  return role === "ADMIN" || teamRole === "CAPTAIN";
}

/** Admin ou capitaine de l'équipe donnée. */
export async function requireTeamManager(teamId: string) {
  const user = await requireUser();
  if (user.role === "ADMIN") {
    return {
      user,
      membership: null as Awaited<
        ReturnType<typeof prisma.teamMember.findUnique>
      >,
    };
  }

  const membership = await prisma.teamMember.findUnique({
    where: { userId: user.id },
  });
  if (
    !membership ||
    membership.teamId !== teamId ||
    membership.role !== "CAPTAIN"
  ) {
    redirect("/dashboard");
  }
  return { user, membership };
}

export async function canManageTeam(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;
  const membership = await prisma.teamMember.findUnique({
    where: { userId: session.user.id },
  });
  return (
    !!membership &&
    membership.teamId === teamId &&
    membership.role === "CAPTAIN"
  );
}

/** Contacts perso (Discord, réseaux) : admin ou membre de l'équipe. */
export async function canViewTeamContacts(teamId: string) {
  const session = await auth();
  if (!session?.user?.id) return false;
  if (session.user.role === "ADMIN") return true;
  const membership = await prisma.teamMember.findUnique({
    where: { userId: session.user.id },
    select: { teamId: true },
  });
  return membership?.teamId === teamId;
}
