// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

console.log('NextAuth route initialization');
const handler = NextAuth(authOptions);
console.log('NextAuth handler created');

export { handler as GET, handler as POST };