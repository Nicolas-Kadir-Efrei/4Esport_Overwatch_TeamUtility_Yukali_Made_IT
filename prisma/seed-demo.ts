/**
 * Seed démo : joueurs, dispos, équipes, matches.
 * Usage: npm run db:demo
 *
 * Comptes (mot de passe: DemoOW2026!)
 *  - joueur1@owroster.local … joueur12@owroster.local
 *  - captain.storm@owroster.local, captain.payld@…, etc.
 */
import { PrismaClient } from "../src/generated/prisma/client";
import type { PlayerRole, TeamRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

if (process.env.VERCEL || process.env.NODE_ENV === "production") {
  throw new Error(
    "db:demo interdit en production (mots de passe démo hardcodés).",
  );
}

const DEMO_PASSWORD = "DemoOW2026!";

type Slot = { dayOfWeek: number; startTime: string; endTime: string };

const teamsSeed = [
  {
    name: "Storm Watch",
    tag: "STORM",
    description: "Équipe principale — focus tournois et scrims sérieux.",
    color: "#FA9C1E",
  },
  {
    name: "Payload Runners",
    tag: "PAYLD",
    description: "Line-up agressive, spécialisée contrôle et escorte.",
    color: "#00C2FF",
  },
  {
    name: "Point Holders",
    tag: "POINT",
    description: "Défense et clutchs — composition tank-heavy.",
    color: "#E74C3C",
  },
  {
    name: "Ult Economy",
    tag: "ULT",
    description: "Macro et timings — pour joueurs stratégiques.",
    color: "#2ECC71",
  },
] as const;

const players: {
  email: string;
  displayName: string;
  battleTag: string;
  smurfTags: string[];
  playerRoles: PlayerRole[];
  teamTag: (typeof teamsSeed)[number]["tag"];
  teamRole: TeamRole;
  availabilities: Slot[];
}[] = [
  {
    email: "captain.storm@owroster.local",
    displayName: "Nova",
    battleTag: "Nova#1111",
    smurfTags: ["NovaSmurf#2222"],
    playerRoles: ["DPS_HITSCAN", "DPS_FLEX"],
    teamTag: "STORM",
    teamRole: "CAPTAIN",
    availabilities: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 2, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 3, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "17:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "14:00", endTime: "22:00" },
    ],
  },
  {
    email: "joueur1@owroster.local",
    displayName: "Brick",
    battleTag: "Brick#1001",
    smurfTags: [],
    playerRoles: ["TANK"],
    teamTag: "STORM",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 1, startTime: "20:00", endTime: "23:00" },
      { dayOfWeek: 3, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "15:00", endTime: "21:00" },
    ],
  },
  {
    email: "joueur2@owroster.local",
    displayName: "Luma",
    battleTag: "Luma#1002",
    smurfTags: ["LumaAlt#9002"],
    playerRoles: ["SUPPORT_MAIN"],
    teamTag: "STORM",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 2, startTime: "18:00", endTime: "22:00" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 0, startTime: "16:00", endTime: "21:00" },
    ],
  },
  {
    email: "joueur3@owroster.local",
    displayName: "Raze",
    battleTag: "Raze#1003",
    smurfTags: [],
    playerRoles: ["SUPPORT_OFF", "DPS_FLEX"],
    teamTag: "STORM",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "22:00" },
      { dayOfWeek: 5, startTime: "19:00", endTime: "23:30" },
      { dayOfWeek: 6, startTime: "14:00", endTime: "20:00" },
    ],
  },
  {
    email: "captain.payld@owroster.local",
    displayName: "Echo",
    battleTag: "Echo#2001",
    smurfTags: [],
    playerRoles: ["DPS_FLEX"],
    teamTag: "PAYLD",
    teamRole: "CAPTAIN",
    availabilities: [
      { dayOfWeek: 2, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "13:00", endTime: "22:00" },
    ],
  },
  {
    email: "joueur4@owroster.local",
    displayName: "Kite",
    battleTag: "Kite#2002",
    smurfTags: ["KiteSmurf#88"],
    playerRoles: ["TANK"],
    teamTag: "PAYLD",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 2, startTime: "20:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "22:00" },
    ],
  },
  {
    email: "joueur5@owroster.local",
    displayName: "Mend",
    battleTag: "Mend#2003",
    smurfTags: [],
    playerRoles: ["SUPPORT_MAIN", "SUPPORT_OFF"],
    teamTag: "PAYLD",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 3, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "18:00", endTime: "22:00" },
    ],
  },
  {
    email: "captain.point@owroster.local",
    displayName: "Bastion",
    battleTag: "Bastion#3001",
    smurfTags: [],
    playerRoles: ["TANK"],
    teamTag: "POINT",
    teamRole: "CAPTAIN",
    availabilities: [
      { dayOfWeek: 3, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 0, startTime: "15:00", endTime: "21:00" },
    ],
  },
  {
    email: "joueur6@owroster.local",
    displayName: "Trace",
    battleTag: "Trace#3002",
    smurfTags: [],
    playerRoles: ["DPS_HITSCAN"],
    teamTag: "POINT",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 3, startTime: "20:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "16:00", endTime: "22:00" },
    ],
  },
  {
    email: "joueur7@owroster.local",
    displayName: "Soft",
    battleTag: "Soft#3003",
    smurfTags: ["SoftAlt#1"],
    playerRoles: ["SUPPORT_OFF"],
    teamTag: "POINT",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 2, startTime: "18:00", endTime: "22:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 0, startTime: "14:00", endTime: "20:00" },
    ],
  },
  {
    email: "captain.ult@owroster.local",
    displayName: "Tempo",
    battleTag: "Tempo#4001",
    smurfTags: [],
    playerRoles: ["SUPPORT_MAIN"],
    teamTag: "ULT",
    teamRole: "CAPTAIN",
    availabilities: [
      { dayOfWeek: 1, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "15:00", endTime: "21:00" },
    ],
  },
  {
    email: "joueur8@owroster.local",
    displayName: "Pivot",
    battleTag: "Pivot#4002",
    smurfTags: [],
    playerRoles: ["DPS_FLEX", "DPS_HITSCAN"],
    teamTag: "ULT",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 1, startTime: "18:00", endTime: "22:00" },
      { dayOfWeek: 4, startTime: "20:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "17:00", endTime: "22:00" },
    ],
  },
  {
    email: "joueur9@owroster.local",
    displayName: "Anchor",
    battleTag: "Anchor#4003",
    smurfTags: [],
    playerRoles: ["TANK"],
    teamTag: "ULT",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 3, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 4, startTime: "18:00", endTime: "23:00" },
      { dayOfWeek: 6, startTime: "14:00", endTime: "20:00" },
    ],
  },
  {
    email: "joueur10@owroster.local",
    displayName: "FreeAgent",
    battleTag: "Free#5001",
    smurfTags: ["FreeSmurf#2"],
    playerRoles: ["DPS_HITSCAN", "SUPPORT_OFF"],
    teamTag: "STORM",
    teamRole: "PLAYER",
    availabilities: [
      { dayOfWeek: 2, startTime: "19:00", endTime: "23:00" },
      { dayOfWeek: 5, startTime: "18:00", endTime: "23:00" },
    ],
  },
];

function nextWeekday(dayOfWeek: number, hour: number, minute = 0) {
  const d = new Date();
  const delta = (dayOfWeek - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysAgo(n: number, hour = 20) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquant");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  console.log("→ Équipes…");
  for (const team of teamsSeed) {
    await prisma.team.upsert({
      where: { tag: team.tag },
      update: {
        name: team.name,
        description: team.description,
        color: team.color,
      },
      create: { ...team },
    });
  }

  const teamByTag = Object.fromEntries(
    (await prisma.team.findMany()).map((t) => [t.tag, t]),
  ) as Record<string, { id: string; tag: string }>;

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@owroster.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "AdminOW2026!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: await bcrypt.hash(adminPassword, 10),
      role: "ADMIN",
      displayName: "Admin",
    },
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      displayName: "Admin",
      role: "ADMIN",
      battleTag: "Admin#0001",
      playerRoles: [],
    },
  });

  console.log("→ Joueurs + dispos + memberships…");
  for (const p of players) {
    const team = teamByTag[p.teamTag];
    if (!team) throw new Error(`Équipe ${p.teamTag} introuvable`);

    const user = await prisma.user.upsert({
      where: { email: p.email },
      update: {
        passwordHash,
        displayName: p.displayName,
        battleTag: p.battleTag,
        smurfTags: p.smurfTags,
        playerRoles: p.playerRoles,
        role: "PLAYER",
      },
      create: {
        email: p.email,
        passwordHash,
        displayName: p.displayName,
        battleTag: p.battleTag,
        smurfTags: p.smurfTags,
        playerRoles: p.playerRoles,
        role: "PLAYER",
      },
    });

    await prisma.availability.deleteMany({ where: { userId: user.id } });
    if (p.availabilities.length > 0) {
      await prisma.availability.createMany({
        data: p.availabilities.map((s) => ({
          userId: user.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })),
      });
    }

    const existingMember = await prisma.teamMember.findUnique({
      where: { userId: user.id },
    });
    if (existingMember) {
      await prisma.teamMember.update({
        where: { userId: user.id },
        data: { teamId: team.id, role: p.teamRole },
      });
    } else {
      await prisma.teamMember.create({
        data: { userId: user.id, teamId: team.id, role: p.teamRole },
      });
    }
  }

  console.log("→ Matches (à venir + historique)…");
  const storm = teamByTag.STORM;
  const payld = teamByTag.PAYLD;
  const point = teamByTag.POINT;
  const ult = teamByTag.ULT;

  const matchDefs = [
    {
      key: "demo-storm-rival",
      teamId: storm.id,
      opponent: "Rival Esports",
      title: "Scrim midweek",
      type: "SCRIM" as const,
      result: "SCHEDULED" as const,
      scheduledAt: nextWeekday(3, 20, 0), // mercredi 20h
      notes: "Maps à définir — check dispos du roster.",
    },
    {
      key: "demo-storm-friday",
      teamId: storm.id,
      opponent: "Night Owls",
      title: "Block vendredi",
      type: "SCRIM" as const,
      result: "SCHEDULED" as const,
      scheduledAt: nextWeekday(5, 19, 0),
      notes: null,
    },
    {
      key: "demo-payld-thu",
      teamId: payld.id,
      opponent: "Cart Pushers",
      title: "Scrim Payload",
      type: "SCRIM" as const,
      result: "SCHEDULED" as const,
      scheduledAt: nextWeekday(4, 20, 0),
      notes: null,
    },
    {
      key: "demo-point-fri",
      teamId: point.id,
      opponent: "Hold Fast",
      title: "Prep tournoi",
      type: "TOURNAMENT" as const,
      result: "SCHEDULED" as const,
      scheduledAt: nextWeekday(5, 20, 0),
      notes: "BO3",
    },
    {
      key: "demo-ult-mon",
      teamId: ult.id,
      opponent: "Macro Kings",
      title: "Scrim timings",
      type: "SCRIM" as const,
      result: "SCHEDULED" as const,
      scheduledAt: nextWeekday(1, 20, 0),
      notes: null,
    },
    {
      key: "demo-storm-past-win",
      teamId: storm.id,
      opponent: "Old Guard",
      title: "Dernier scrim",
      type: "SCRIM" as const,
      result: "WIN" as const,
      score: "2-1",
      scheduledAt: daysAgo(5, 20),
      notes: "Bonne coms",
    },
    {
      key: "demo-payld-past-loss",
      teamId: payld.id,
      opponent: "Blue Team",
      title: "Scrim perdu",
      type: "SCRIM" as const,
      result: "LOSS" as const,
      score: "0-2",
      scheduledAt: daysAgo(8, 21),
      notes: null,
    },
  ];

  for (const m of matchDefs) {
    const existing = await prisma.match.findFirst({
      where: {
        teamId: m.teamId,
        opponent: m.opponent,
        title: m.title,
      },
    });
    if (existing) {
      await prisma.match.update({
        where: { id: existing.id },
        data: {
          type: m.type,
          result: m.result,
          score: "score" in m ? m.score ?? null : null,
          scheduledAt: m.scheduledAt,
          notes: m.notes,
        },
      });
    } else {
      await prisma.match.create({
        data: {
          teamId: m.teamId,
          opponent: m.opponent,
          title: m.title,
          type: m.type,
          result: m.result,
          score: "score" in m ? m.score ?? null : null,
          scheduledAt: m.scheduledAt,
          notes: m.notes,
        },
      });
    }
  }

  console.log("\n✅ Démo prête");
  console.log(`   Mot de passe joueurs : ${DEMO_PASSWORD}`);
  console.log(`   Admin : ${adminEmail} / ${adminPassword}`);
  console.log("   Exemples : captain.storm@owroster.local, joueur1@owroster.local");
  console.log(`   ${players.length} joueurs · matches à venir + historique`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
