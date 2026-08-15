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
    id: string;
    role: GlobalRole;
    teamId?: string | null;
    teamRole?: TeamRole | null;
    teamTag?: string | null;
    avatarUrl?: string | null;
    displayName: string;
  }
}

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
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
        if (!user) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

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
      }
      return token;
    },
    async session({ session, token }) {
      let role = token.role;
      let displayName = token.displayName;
      let avatarUrl = token.avatarUrl;
      let teamId = token.teamId;
      let teamRole = token.teamRole;
      let teamTag = token.teamTag;

      if (token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          include: { membership: { include: { team: true } } },
        });
        if (fresh) {
          role = fresh.role;
          displayName = fresh.displayName;
          avatarUrl = fresh.avatarUrl;
          teamId = fresh.membership?.teamId ?? null;
          teamRole = fresh.membership?.role ?? null;
          teamTag = fresh.membership?.team.tag ?? null;
        }
      }

      session.user = {
        ...session.user,
        id: token.id,
        email: (token.email as string) ?? "",
        role,
        displayName,
        avatarUrl,
        teamId,
        teamRole,
        teamTag,
      };
      return session;
    },
  },
  trustHost: true,
});
