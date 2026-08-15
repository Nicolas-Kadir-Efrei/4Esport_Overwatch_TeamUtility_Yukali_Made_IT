import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const teams = [
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
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL manquant");

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

  for (const team of teams) {
    await prisma.team.upsert({
      where: { tag: team.tag },
      update: {
        name: team.name,
        description: team.description,
        color: team.color,
      },
      create: team,
    });
  }

  const email = process.env.ADMIN_EMAIL ?? "admin@owroster.local";
  const password = process.env.ADMIN_PASSWORD ?? "AdminOW2026!";
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "ADMIN",
      displayName: "Admin",
    },
    create: {
      email,
      passwordHash,
      displayName: "Admin",
      role: "ADMIN",
      battleTag: "Admin#0001",
    },
  });

  const storm = await prisma.team.findUniqueOrThrow({ where: { tag: "STORM" } });
  const existingMatch = await prisma.match.findFirst({
    where: { teamId: storm.id, opponent: "Rival Esports" },
  });
  if (!existingMatch) {
    await prisma.match.create({
      data: {
        teamId: storm.id,
        opponent: "Rival Esports",
        title: "Scrim midweek",
        type: "SCRIM",
        scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        notes: "Maps à définir — disponibilité à confirmer.",
      },
    });
  }

  console.log("Seed OK — 4 équipes + admin");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
