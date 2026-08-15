import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/** Incrémente après un changement de schéma pour invalider le client global en dev. */
const PRISMA_CLIENT_VERSION = "v5-vercel-lazy";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion?: string;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL manquant. Ajoute-le dans .env (local) ou dans les variables d’environnement Vercel.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

if (globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION) {
  globalForPrisma.prisma = undefined;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
}

/**
 * Proxy lazy : n’instancie Prisma qu’au premier accès DB.
 * Évite de faire planter `next build` sur Vercel tant qu’aucune query n’est lancée.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const client = globalForPrisma.prisma;
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
