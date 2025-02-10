import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
 return new PrismaClient()
}

declare global {
 var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prismaGlobal = globalThis as { prisma?: ReturnType<typeof prismaClientSingleton> }
export const db = prismaGlobal.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') prismaGlobal.prisma = db