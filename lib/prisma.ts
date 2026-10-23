import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaRead: PrismaClient | undefined;
};

// Primary Database Client (Writes and default reads)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

// Read-Replica Client (For analytics, leaderboards, CSV exports)
// Automatically falls back to primary client if DATABASE_READ_URL is not set
export const prismaRead =
  globalForPrisma.prismaRead ??
  (process.env.DATABASE_READ_URL
    ? new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_READ_URL,
          },
        },
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      })
    : prisma);

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaRead = prismaRead;
}

