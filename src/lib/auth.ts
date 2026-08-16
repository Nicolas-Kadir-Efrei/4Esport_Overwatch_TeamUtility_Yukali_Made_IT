import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { GlobalRole, TeamRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface User {
    role: GlobalRole;
    teamId?: string | null;
    teamRole?: TeamRole | null;
    teamTag?: string | null;
    avatarUrl?: string | null;
    displayName: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      role: GlobalRole;
      teamId?: string | null;
      teamRole?: TeamRole | null;
      teamTag?: string | null;
      avatarUrl?: string | null;
      displayName: string;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    role?: GlobalRole;
    teamId?: string | null;
    teamRole?: TeamRole | null;
    teamTag?: string | null;
    avatarUrl?: string | null;
    displayName?: string;
    refreshedAt?: number;
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours
const JWT_REFRESH_MS = 60 * 60 * 1000; // 1h — évite une query Neon à chaque requête

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          include: {
            membership: { include: { team: true } },
          },
        });

        const hash =
          user?.passwordHash ??
          "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !ok) return null;

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          teamId: user.membership?.teamId ?? null,
          teamRole: user.membership?.role ?? null,
          teamTag: user.membership?.team.tag ?? null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.email = user.email!;
        token.role = user.role;
        token.displayName = user.displayName;
        token.avatarUrl = user.avatarUrl;
        token.teamId = user.teamId;
        token.teamRole = user.teamRole;
        token.teamTag = user.teamTag;
        token.refreshedAt = Date.now();
        return token;
      }

      if (!token.id) {
        return {};
      }

      // Réutilise les claims JWT sauf refresh horaire (perf)
      if (
        token.refreshedAt &&
        Date.now() - token.refreshedAt < JWT_REFRESH_MS &&
        token.role &&
        token.displayName
      ) {
        return token;
      }

      const fresh = await prisma.user.findUnique({
        where: { id: token.id },
        select: {
          id: true,
          email: true,
          role: true,
          displayName: true,
          avatarUrl: true,
          membership: {
            select: {
              teamId: true,
              role: true,
              team: { select: { tag: true } },
            },
          },
        },
      });

      if (!fresh) {
        return {};
      }

      token.role = fresh.role;
      token.displayName = fresh.displayName;
      token.avatarUrl = fresh.avatarUrl;
      token.email = fresh.email;
      token.teamId = fresh.membership?.teamId ?? null;
      token.teamRole = fresh.membership?.role ?? null;
      token.teamTag = fresh.membership?.team.tag ?? null;
      token.refreshedAt = Date.now();
      return token;
    },
    async session({ session, token }) {
      if (!token.id || !token.role || !token.displayName) {
        return { ...session, user: undefined as unknown as typeof session.user };
      }

      session.user = {
        ...session.user,
        id: token.id,
        email: (token.email as string) ?? "",
        role: token.role,
        displayName: token.displayName,
        avatarUrl: token.avatarUrl,
        teamId: token.teamId,
        teamRole: token.teamRole,
        teamTag: token.teamTag,
      };
      return session;
    },
  },
  trustHost: true,
});
