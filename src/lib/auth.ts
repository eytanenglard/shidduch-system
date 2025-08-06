// lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, Profile as OAuthProfile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import type {
  User as ExtendedUser,
  UserProfile,
  UserImage,
  QuestionnaireResponse
} from "@/types/next-auth";
import { JWT as ExtendedUserJWT } from "next-auth/jwt";
import { Session as ExtendedSession } from "next-auth";
import { UserRole, UserStatus, UserSource } from "@prisma/client";

console.log("Auth options file loaded");

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile: OAuthProfile & { sub?: string; given_name?: string; family_name?: string; picture?: string; email_verified?: boolean }, tokens) {
        const now = new Date();
        console.log("[GoogleProvider Profile Fn] Raw profile from Google:", profile);
        console.log("[GoogleProvider Profile Fn] Tokens from Google:", tokens);
    
        if (!profile.email) {
          throw new Error("Email not found in Google profile");
        }
        if (!profile.sub) {
          throw new Error("Sub (Google User ID) not found in Google profile");
        }
    
        const firstName = profile.given_name || profile.name?.split(' ')[0] || "";
        const lastName = profile.family_name || profile.name?.split(' ').slice(1).join(' ') || "";

        const userForAdapter: ExtendedUser = {
          id: profile.sub, 
          email: profile.email.toLowerCase(),
          firstName: firstName,
          lastName: lastName,
          name: profile.name || `${firstName} ${lastName}`.trim(), 
          phone: null, 
          image: profile.picture || null, 
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_PHONE_VERIFICATION,
          isVerified: !!profile.email_verified,
          isProfileComplete: false,
          isPhoneVerified: false,
          lastLogin: null, 
          createdAt: now,
          updatedAt: now,
          hasCompletedOnboarding: false,
          source: UserSource.REGISTRATION, 
          addedByMatchmakerId: null,  
          termsAndPrivacyAcceptedAt: null,
          profile: null, 
          images: [], 
          questionnaireResponses: [],
          questionnaireCompleted: false,
          redirectUrl: undefined,
          newlyCreated: true, 
          requiresCompletion: true, 
        };
    
        console.log("[GoogleProvider Profile Fn] User object for adapter:", userForAdapter);
        return userForAdapter;
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }
        const userFromDb = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            profile: true,
            images: { where: { isMain: true }, take: 1 },
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });
        if (!userFromDb || !userFromDb.password) {
          return null;
        }
        const isPasswordValid = await compare(credentials.password, userFromDb.password);
        if (!isPasswordValid) {
          return null;
        }
        await prisma.user.update({
          where: { id: userFromDb.id },
          data: { lastLogin: new Date() }
        });
        const { profile, images, questionnaireResponses, ...restOfUser } = userFromDb;
        return {
          ...restOfUser,
          name: `${userFromDb.firstName} ${userFromDb.lastName}`,
          image: images?.[0]?.url || null, 
          profile: profile as UserProfile | null,
          images: images as UserImage[],
          questionnaireResponses: questionnaireResponses as QuestionnaireResponse[],
          questionnaireCompleted: questionnaireResponses.length > 0 && questionnaireResponses[0].completed,
          hasCompletedOnboarding: userFromDb.hasCompletedOnboarding,
          source: userFromDb.source,
          addedByMatchmakerId: userFromDb.addedByMatchmakerId,
          termsAndPrivacyAcceptedAt: userFromDb.termsAndPrivacyAcceptedAt,
        } as ExtendedUser;
      }
    }),
    CredentialsProvider({
      id: "email-verified-autologin",
      name: "Email Verified AutoLogin",
      credentials: {
        authToken: { label: "Auth Token", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.authToken) {
          return null;
        }
        const tokenRecord = await prisma.oneTimeAuthToken.findUnique({
          where: { token: credentials.authToken },
        });
        if (!tokenRecord || new Date() > tokenRecord.expiresAt) {
          if (tokenRecord) await prisma.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } });
          return null;
        }
        await prisma.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } });
        const userFromDb = await prisma.user.findUnique({
          where: { id: tokenRecord.userId },
          include: {
            profile: true,
            images: { where: { isMain: true }, take: 1 },
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });
        if (!userFromDb) {
          return null;
        }
        const { profile, images, questionnaireResponses, ...restOfUser } = userFromDb;
        return {
          ...restOfUser,
          name: `${userFromDb.firstName} ${userFromDb.lastName}`,
          image: images?.[0]?.url || null,
          profile: profile as UserProfile | null,
          images: images as UserImage[],
          questionnaireResponses: questionnaireResponses as QuestionnaireResponse[],
          questionnaireCompleted: questionnaireResponses.length > 0 && questionnaireResponses[0].completed,
          hasCompletedOnboarding: userFromDb.hasCompletedOnboarding,
          source: userFromDb.source,
          addedByMatchmakerId: userFromDb.addedByMatchmakerId,
          termsAndPrivacyAcceptedAt: userFromDb.termsAndPrivacyAcceptedAt,
        } as ExtendedUser;
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      const typedUser = user as ExtendedUser; 
      const oauthProfile = profile as OAuthProfile & { email_verified?: boolean };
      const userEmail = typedUser.email?.toLowerCase();
      if (!userEmail) {
        return false;
      }
      let dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
    
      if (!dbUser && account?.provider === 'google') {
        try {
            dbUser = await prisma.user.create({
                data: {
                    email: userEmail,
                    firstName: typedUser.firstName || "", 
                    lastName: typedUser.lastName || "",  
                    role: typedUser.role || UserRole.CANDIDATE,
                    status: typedUser.status || UserStatus.PENDING_PHONE_VERIFICATION,
                    isVerified: typedUser.isVerified === undefined ? (!!oauthProfile?.email_verified) : typedUser.isVerified,
                    source: UserSource.REGISTRATION,
                },
            });
            if (account) {
                await prisma.account.create({
                    data: {
                        userId: dbUser.id,
                        type: account.type,
                        provider: account.provider,
                        providerAccountId: account.providerAccountId,
                        access_token: account.access_token,
                        refresh_token: account.refresh_token,
                        expires_at: account.expires_at,
                        token_type: account.token_type,
                        scope: account.scope,
                        id_token: account.id_token,
                        session_state: account.session_state,
                    },
                });
            }
          } catch (error: unknown) {
            if (typeof error === 'object' && error !== null && 'code' in error && (error as {code: string}).code === 'P2002') {
                dbUser = await prisma.user.findUnique({ where: { email: userEmail }});
            } else {
                console.error("[signIn Callback] Critical error creating user:", error);
                return false;
            }
        }
      }
    
      if (!dbUser) {
        return false;
      }
    
      // Sync user object with DB state
      typedUser.id = dbUser.id; 
      typedUser.role = dbUser.role;
      typedUser.status = dbUser.status;
      // ... (sync other necessary fields)

      if (account?.provider === "google" && !dbUser.isVerified && oauthProfile?.email_verified) {
        const updatedUser = await prisma.user.update({
          where: { id: dbUser.id },
          data: { isVerified: true, status: UserStatus.PENDING_PHONE_VERIFICATION }
        });
        typedUser.isVerified = updatedUser.isVerified;
        typedUser.status = updatedUser.status;
      }
    
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() }
      });
    
      const requiresCompletion = !dbUser.isProfileComplete || !dbUser.isPhoneVerified || !dbUser.termsAndPrivacyAcceptedAt;
      typedUser.requiresCompletion = requiresCompletion;
      typedUser.redirectUrl = requiresCompletion ? '/auth/register' : '/profile';
    
      return true;
    },

    async jwt({ token, user, trigger }) {
      const typedToken = token as ExtendedUserJWT;
      const typedUserFromCallback = user as ExtendedUser | undefined;

      // On initial sign-in, populate token from the user object passed from signIn
      if (typedUserFromCallback) {
        typedToken.id = typedUserFromCallback.id;
        typedToken.email = typedUserFromCallback.email.toLowerCase();
        typedToken.firstName = typedUserFromCallback.firstName;
        typedToken.lastName = typedUserFromCallback.lastName;
        typedToken.name = typedUserFromCallback.name;
        typedToken.picture = typedUserFromCallback.image;
        typedToken.role = typedUserFromCallback.role;
        typedToken.status = typedUserFromCallback.status;
        typedToken.requiresCompletion = typedUserFromCallback.requiresCompletion;
        typedToken.redirectUrl = typedUserFromCallback.redirectUrl;
        typedToken.marketingConsent = typedUserFromCallback.marketingConsent;
      }
      
      // On subsequent JWT validation (e.g., page navigation) or session updates, 
      // refresh critical flags from the database to ensure the token is up-to-date.
      if (typedToken.id && (trigger === "update" || trigger === "signIn")) {
          const dbUserForJwt = await prisma.user.findUnique({
            where: { id: typedToken.id },
            include: {
              // We only include what's necessary to calculate flags
              images: { where: { isMain: true }, take: 1 },
              questionnaireResponses: { where: { completed: true }, take: 1 }
            }
          });

          if (dbUserForJwt) {
            // Update basic user info
            typedToken.firstName = dbUserForJwt.firstName;
            typedToken.lastName = dbUserForJwt.lastName;
            typedToken.picture = dbUserForJwt.images?.[0]?.url || typedToken.picture;
            typedToken.role = dbUserForJwt.role;
            typedToken.status = dbUserForJwt.status;
            typedToken.marketingConsent = dbUserForJwt.marketingConsent;

            // ✅ *** FIX: START ***
            // Instead of loading entire objects into the token, we now only store boolean flags.
            // This keeps the token size small and prevents cookie overflow errors.
            typedToken.isProfileComplete = dbUserForJwt.isProfileComplete;
            typedToken.isPhoneVerified = dbUserForJwt.isPhoneVerified;
            typedToken.hasCompletedOnboarding = dbUserForJwt.hasCompletedOnboarding;
            typedToken.questionnaireCompleted = dbUserForJwt.questionnaireResponses.length > 0;
            
            // ⛔️ The following lines were removed as they caused the JWT to become too large
            // typedToken.profile = dbUserForJwt.profile;
            // typedToken.images = dbUserForJwt.images;
            // typedToken.questionnaireResponses = dbUserForJwt.questionnaireResponses;
            
            // Recalculate completion status based on fresh data
            const requiresCompletionFromDb = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified || !dbUserForJwt.termsAndPrivacyAcceptedAt);
            typedToken.requiresCompletion = requiresCompletionFromDb;
            typedToken.redirectUrl = requiresCompletionFromDb ? '/auth/register' : '/profile';
            // ✅ *** FIX: END ***
          }
      }
      
      return typedToken;
    },

    async session({ session, token }) {
      const typedToken = token as ExtendedUserJWT;
      const typedSession = session as ExtendedSession;

      if (typedSession.user && typedToken.id) {
        // Populate the session with the minimal, essential data from the token.
        typedSession.user.id = typedToken.id;
        typedSession.user.email = typedToken.email;
        typedSession.user.firstName = typedToken.firstName;
        typedSession.user.lastName = typedToken.lastName;
        typedSession.user.name = typedToken.name ?? null; 
        typedSession.user.image = typedToken.picture ?? null; 
        typedSession.user.role = typedToken.role;
        typedSession.user.status = typedToken.status;
        typedSession.user.marketingConsent = typedToken.marketingConsent;

        // ✅ *** FIX: START ***
        // Add the boolean flags to the session so the client-side can use them.
        typedSession.user.isVerified = typedToken.isVerified;
        typedSession.user.isProfileComplete = typedToken.isProfileComplete;
        typedSession.user.isPhoneVerified = typedToken.isPhoneVerified;
        typedSession.user.questionnaireCompleted = typedToken.questionnaireCompleted;
        typedSession.user.hasCompletedOnboarding = typedToken.hasCompletedOnboarding as boolean;
        
        // ⛔️ The following lines were removed. This data should be fetched via a dedicated API route
        // when a component needs it, not carried in the session.
        // typedSession.user.profile = typedToken.profile; 
        // typedSession.user.images = typedToken.images; 
        // typedSession.user.questionnaireResponses = typedToken.questionnaireResponses;

        // Add redirection logic flags to the session
        typedSession.requiresCompletion = typedToken.requiresCompletion;
        typedSession.redirectUrl = typedToken.redirectUrl;
         // ✅ *** FIX: END ***
      }
      return typedSession;
    },

    async redirect({ url, baseUrl }) {
        console.log(`[Redirect Callback] Triggered with url: ${url}`);
        if (url.startsWith('/')) {
            const finalUrl = `${baseUrl}${url}`;
            console.log(`[Redirect Callback] Relative URL detected. Returning: ${finalUrl}`);
            return finalUrl;
        }
        if (new URL(url).origin === baseUrl) {
            console.log(`[Redirect Callback] Same origin URL detected. Returning: ${url}`);
            return url;
        }
        console.log(`[Redirect Callback] External URL detected. Redirecting to baseUrl: ${baseUrl}`);
        return baseUrl;
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request'
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === "production",
};

export default authOptions;