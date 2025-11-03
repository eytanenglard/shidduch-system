"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectPrisma = disconnectPrisma;
exports.checkDatabaseHealth = checkDatabaseHealth;
// src/lib/prisma.ts - גרסה מותאמת ל-Heroku
const client_1 = require("@prisma/client");
// הגדרות אופטימליות ל-Heroku
const prismaClientSingleton = () => {
    return new client_1.PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
            db: {
                url: process.env.DATABASE_URL
            }
        },
        // הגדרות connection pool מתאימות ל-Heroku
        // Heroku Postgres מגביל ל-20 connections ב-hobby plan
        // ו-120 ב-standard plans
    });
};
const globalForPrisma = globalThis;
const prisma = (_a = globalForPrisma.prisma) !== null && _a !== void 0 ? _a : prismaClientSingleton();
// חשוב: מניעת memory leaks ב-development
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
// פונקציה לניתוק בטוח (אופציונלי)
async function disconnectPrisma() {
    try {
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('Error disconnecting Prisma:', error);
    }
}
// פונקציה לבדיקת connection health
async function checkDatabaseHealth() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return { healthy: true };
    }
    catch (error) {
        console.error('Database health check failed:', error);
        return { healthy: false, error };
    }
}
exports.default = prisma;
