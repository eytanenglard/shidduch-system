// app/api/user/delete/route.ts

import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth'; // Assuming authOptions is in this path

const prisma = new PrismaClient(); // Or import from '@/lib/prisma'

// Using the same LogMetadata and logger from your register route, now with 'warn'
type LogMetadata = {
  userId?: string;
  email?: string;
  errorObject?: unknown;
  errorMessage?: string;
  errorName?: string;
  errorCode?: string;
  errorMeta?: unknown;
  errorStack?: string;
  errorContext?: string;
  timestamp?: string;
  sessionId?: string;
};

const logger = {
  info: (message: string, meta?: LogMetadata) => {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      ...meta
    }));
  },
  warn: (message: string, meta?: LogMetadata) => { // Added warn function
    console.warn(JSON.stringify({ // Using console.warn
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      ...meta
    }));
  },
  error: (message: string, meta?: LogMetadata) => {
    const loggableMeta = { ...meta };
    if (loggableMeta.errorObject && process.env.NODE_ENV !== 'development') {
      // Consider removing or sanitizing errorObject in production
    }
    console.error(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      ...loggableMeta
    }));
  }
};

function handleError(error: unknown, userId?: string): { message: string; status: number } {
    const logMeta: LogMetadata = {
        userId,
        errorContext: "Inside handleError (delete user) before processing",
        timestamp: new Date().toISOString(),
        errorObject: error
    };

    if (error instanceof Error) {
        logMeta.errorName = error.name;
        logMeta.errorMessage = error.message;
        if (process.env.NODE_ENV === 'development') {
            logMeta.errorStack = error.stack;
        }
    } else {
        logMeta.errorMessage = String(error);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        logMeta.errorCode = error.code;
        logMeta.errorMeta = error.meta;
        logger.error(`Prisma error during user deletion: ${error.code}`, logMeta); // Still log as error for Prisma issues
        return { message: `שגיאת מסד נתונים בעת מחיקת המשתמש (קוד: ${error.code}).`, status: 500 };
    } else if (typeof error === 'object' && error !== null && 'code' in error) {
        logMeta.errorCode = String((error as { code: unknown }).code);
    }
    
    logger.error("Error received in handleError (delete user)", logMeta); // General errors logged as error

    if (error instanceof Error) {
      return { message: error.message || 'שגיאה במחיקת החשבון.', status: 400 };
    }

    return { message: 'אירעה שגיאה בלתי צפויה במחיקת החשבון.', status: 500 };
}

export async function DELETE() {
  const initialLogMeta: LogMetadata = { timestamp: new Date().toISOString() };
  logger.info('Attempting to delete user account', initialLogMeta);

  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    logger.warn('Unauthorized: No active session found for delete operation', { ...initialLogMeta }); // Changed to warn
    return NextResponse.json(
      { success: false, error: 'אינך מורשה לבצע פעולה זו. לא זוהתה סשן פעיל.' },
      { status: 401 }
    );
  }

  const userId = session.user.id;
  const userEmail = session.user.email || 'N/A';

  logger.info(`User deletion initiated by user: ${userId}`, { userId, email: userEmail, ...initialLogMeta });

  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    logger.info(`User account ${userId} (${userEmail}) deleted successfully`, { userId, email: userEmail, ...initialLogMeta });
    return NextResponse.json(
      { success: true, message: 'החשבון נמחק בהצלחה.' },
      { status: 200 }
    );

  } catch (error: unknown) {
    const logMetaForCatch: LogMetadata = {
        userId,
        email: userEmail,
        errorContext: "Main catch block in DELETE /api/user/delete",
        timestamp: new Date().toISOString(),
        errorObject: error
    };

    if (error instanceof Error) {
        logMetaForCatch.errorName = error.name;
        logMetaForCatch.errorMessage = error.message;
        if (process.env.NODE_ENV === 'development') {
            logMetaForCatch.errorStack = error.stack;
        }
    } else {
        logMetaForCatch.errorMessage = String(error);
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        logger.warn(`Attempted to delete non-existent user: ${userId}`, { ...logMetaForCatch, errorCode: error.code, errorMeta: error.meta });
        return NextResponse.json(
            { success: false, error: 'המשתמש המבוקש למחיקה לא נמצא.'},
            { status: 404 }
        );
    }
    
    logger.error('User account deletion failed', logMetaForCatch);
    const { message, status } = handleError(error, userId); // handleError will also log the error

    const responseErrorDetails = process.env.NODE_ENV === 'development' ? {
        name: logMetaForCatch.errorName,
        message: logMetaForCatch.errorMessage,
        code: logMetaForCatch.errorCode,
        meta: logMetaForCatch.errorMeta,
        stack: logMetaForCatch.errorStack
    } : undefined;

    return NextResponse.json(
      {
        success: false,
        error: message,
        details: responseErrorDetails
      },
      { status }
    );
  }
  // No finally block with prisma.$disconnect() needed if using a global/managed Prisma client
}