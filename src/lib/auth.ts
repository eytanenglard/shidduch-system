import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import type { JWT } from "next-auth/jwt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { 
            email: credentials.email 
          },
          include: {
            profile: true,
            images: true,
            questionnaireResponses: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            }
          }
        });

        if (!user) {
          throw new Error("No user found");
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        const mainImage = user.images.find(img => img.isMain);

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        });

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          image: mainImage?.url || null,
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          profile: user.profile,
          images: user.images,
          questionnaireResponses: user.questionnaireResponses
        };
      }
    })
  ],

  callbacks: {
    async jwt({ token, user }): Promise<JWT> {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.name = user.name || null;
        token.picture = user.image || null;
        token.role = user.role;
        token.status = user.status;
        token.isVerified = user.isVerified;
        token.lastLogin = user.lastLogin;
        token.createdAt = user.createdAt;
        token.updatedAt = user.updatedAt;
        token.profile = user.profile;
        token.images = user.images;
        token.questionnaireResponses = user.questionnaireResponses;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.email = token.email as string;  // הוספנו as string
        session.user.firstName = token.firstName;
        session.user.lastName = token.lastName;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.role = token.role;
        session.user.status = token.status;
        session.user.isVerified = token.isVerified;
        session.user.lastLogin = token.lastLogin;
        session.user.createdAt = token.createdAt;
        session.user.updatedAt = token.updatedAt;
        session.user.profile = token.profile;
        session.user.images = token.images;
        session.user.questionnaireResponses = token.questionnaireResponses;
      }
      return session;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/auth/complete-registration',
    verifyRequest: '/auth/verify-request'
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  useSecureCookies: process.env.NODE_ENV === "production",
};

export default authOptions;