// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

// הסר את הלוגים או הפעל אותם רק בסביבת פיתוח
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };