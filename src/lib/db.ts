import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

declare global {
  // Using interface instead of var for global augmentation
  interface Global {
    prisma: PrismaClientSingleton | undefined
  }
}

const prismaGlobal = global as { prisma?: PrismaClientSingleton }
export const db = prismaGlobal.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') prismaGlobal.prisma = db