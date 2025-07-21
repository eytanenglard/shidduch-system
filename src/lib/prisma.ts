// src/lib/prisma.ts - גרסה מותאמת ל-Heroku
import { PrismaClient } from '@prisma/client'

// הגדרות אופטימליות ל-Heroku
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    },
    // הגדרות connection pool מתאימות ל-Heroku
    // Heroku Postgres מגביל ל-20 connections ב-hobby plan
    // ו-120 ב-standard plans
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

// חשוב: מניעת memory leaks ב-development
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// פונקציה לניתוק בטוח (אופציונלי)
export async function disconnectPrisma() {
  try {
    await prisma.$disconnect()
  } catch (error) {
    console.error('Error disconnecting Prisma:', error)
  }
}

// פונקציה לבדיקת connection health
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`
    return { healthy: true }
  } catch (error) {
    console.error('Database health check failed:', error)
    return { healthy: false, error }
  }
}

export default prisma