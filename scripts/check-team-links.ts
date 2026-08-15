import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

async function main() {
  const p = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  const t = await p.team.findFirst({
    include: {
      links: true,
      members: { include: { user: { include: { links: true } } } },
    },
  });
  console.log("ok", t?.tag, "teamLinks", t?.links.length, "members", t?.members.length);
  await p.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
