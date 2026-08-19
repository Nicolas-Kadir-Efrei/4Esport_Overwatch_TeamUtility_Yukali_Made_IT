import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { HomeMatchBoard, type HomeTeamMatch } from "@/components/home-match-board";
import { prisma } from "@/lib/prisma";

async function loadHomeMatches(): Promise<HomeTeamMatch[]> {
  const now = new Date(Date.now() - 60 * 60 * 1000);
  const teams = await prisma.team.findMany({
    orderBy: { name: "asc" },
    include: {
      members: {
        select: { userId: true, role: true },
      },
      matches: {
        where: {
          result: "SCHEDULED",
          scheduledAt: { gte: now },
        },
        orderBy: { scheduledAt: "asc" },
        take: 1,
        include: {
          lineup: {
            include: {
              user: {
                select: {
                  id: true,
                  displayName: true,
                  avatarUrl: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return teams.map((team) => {
    const next = team.matches[0] ?? null;
    const captains = new Set(
      team.members.filter((m) => m.role === "CAPTAIN").map((m) => m.userId),
    );

    if (!next) {
      return {
        team: {
          id: team.id,
          name: team.name,
          tag: team.tag,
          color: team.color,
          logoUrl: team.logoUrl,
        },
        match: null,
      };
    }

    const present = next.lineup.filter((l) => l.status === "PRESENT");

    return {
      team: {
        id: team.id,
        name: team.name,
        tag: team.tag,
        color: team.color,
        logoUrl: team.logoUrl,
      },
      match: {
        opponent: next.opponent,
        opponentLogoUrl: next.opponentLogoUrl,
        type: next.type,
        scheduledAt: next.scheduledAt,
        present: present.length,
        absent: next.lineup.filter((l) => l.status === "ABSENT").length,
        pending: next.lineup.filter((l) => l.status === "PENDING").length,
        lineup: present.map((l) => ({
          id: l.user.id,
          displayName: l.user.displayName,
          avatarUrl: l.user.avatarUrl,
          captain: captains.has(l.user.id),
        })),
      },
    };
  });
}

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const teams = await loadHomeMatches();

  return (
    <main>
      <section className="home-hero">
        <div className="relative mx-auto grid max-w-6xl items-start gap-10 px-4 py-16 lg:grid-cols-[0.92fr_1.08fr] md:px-6 md:py-24">
          <div>
            <p className="fade-up mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--cyan)]">
              <span className="pulse-dot" />
              Overwatch Competitive
            </p>
            <h1 className="home-brand fade-up-delay">
              <span className="home-brand-mark" aria-hidden>
                4E
              </span>
              4Esport
            </h1>
            <p className="fade-up-delay-2 mt-5 max-w-lg text-lg leading-relaxed text-[var(--muted)]">
              L&apos;org Overwatch. Un seul QG pour les équipes, les scrims et
              la lineup — plus de Discord perdu, plus de tableur oublié.
            </p>

            <dl className="home-stats fade-up-delay-2">
              <div>
                <dt>Org</dt>
                <dd>4Esport · Overwatch</dd>
              </div>
              <div>
                <dt>Lineup</dt>
                <dd>Présence &amp; roster</dd>
              </div>
              <div>
                <dt>Calendrier</dt>
                <dd>Scrims &amp; tournois</dd>
              </div>
            </dl>
          </div>

          <HomeMatchBoard teams={teams} />
        </div>
      </section>
    </main>
  );
}
