import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/** Incrémente après un changement de schéma pour invalider le client global en dev. */
const PRISMA_CLIENT_VERSION = "v7-captain-contact-tags";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
  prismaClientVersion?: string;
};

/** Évite le warning pg v8 sur sslmode=require (Neon). */
function normalizeDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    if (
      url.searchParams.has("sslmode") &&
      !url.searchParams.has("uselibpqcompat")
    ) {
      url.searchParams.set("uselibpqcompat", "true");
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function getPool() {
  if (!globalForPrisma.pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        "DATABASE_URL manquant. Ajoute-le dans .env (local) ou dans les variables d’environnement Vercel.",
      );
    }
    globalForPrisma.pgPool = new Pool({
      connectionString: normalizeDatabaseUrl(connectionString),
      max: 1,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
    });
  }
  return globalForPrisma.pgPool;
}

function createPrismaClient() {
  const adapter = new PrismaPg(getPool());
  return new PrismaClient({ adapter });
}

if (globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION) {
  globalForPrisma.prisma = undefined;
  if (globalForPrisma.pgPool) {
    void globalForPrisma.pgPool.end().catch(() => undefined);
    globalForPrisma.pgPool = undefined;
  }
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
}

/**
 * Proxy lazy : n’instancie Prisma qu’au premier accès DB.
 * Pool pg réutilisé (évite d’ouvrir une connexion TCP à chaque cold path).
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
