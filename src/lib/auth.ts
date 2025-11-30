// src/lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, Profile as OAuthProfile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import type {
  User as ExtendedUser,
  UserProfile,
} from "@/types/next-auth";
import { JWT as ExtendedUserJWT } from "next-auth/jwt";
import { Session as ExtendedSession } from "next-auth";
import { UserRole, UserStatus, UserSource, Language } from "@prisma/client";

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
          source: UserSource.REGISTRATION,
          addedByMatchmakerId: null,
          termsAndPrivacyAcceptedAt: null,
          profile: null,
          images: [],
          questionnaireResponses: [],
          language: Language.he,
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
        console.log("[CredentialsProvider Authorize] Attempting login for:", credentials?.email);
        if (!credentials?.email || !credentials?.password) {
          console.error("[CredentialsProvider Authorize] Missing email or password");
          return null;
        }

        const userFromDb = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            images: { where: { isMain: true }, take: 1 },
          }
        });

        if (!userFromDb || !userFromDb.password) {
          console.log(`[CredentialsProvider Authorize] User ${credentials.email} not found or password not set.`);
          return null;
        }

        const isPasswordValid = await compare(credentials.password, userFromDb.password);
        if (!isPasswordValid) {
          console.log(`[CredentialsProvider Authorize] Invalid password for ${credentials.email}.`);
          return null;
        }

        console.log(`[CredentialsProvider Authorize] Authentication successful for ${credentials.email}`);
        await prisma.user.update({
          where: { id: userFromDb.id },
          data: { lastLogin: new Date() }
        }).catch(err => console.error("[CredentialsProvider Authorize] Failed to update lastLogin:", err));

        const { images, ...restOfUser } = userFromDb;
        return {
          ...restOfUser,
          name: `${userFromDb.firstName} ${userFromDb.lastName}`,
          image: images?.[0]?.url || null,
          profile: null,
          images: [],
          questionnaireResponses: [],
          questionnaireCompleted: false,
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
        console.log("[AutoLoginProvider Authorize] Attempting auto-login with token:", credentials?.authToken ? "Token Present" : "No Token");
        if (!credentials?.authToken) {
          console.error("[AutoLoginProvider Authorize] No authToken provided.");
          return null;
        }

        const tokenRecord = await prisma.oneTimeAuthToken.findUnique({
          where: { token: credentials.authToken },
        });

        if (!tokenRecord) {
          console.log("[AutoLoginProvider Authorize] AuthToken not found in DB.");
          return null;
        }

        if (new Date() > tokenRecord.expiresAt) {
          console.log("[AutoLoginProvider Authorize] AuthToken expired. Deleting token.");
          await prisma.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } }).catch(err => console.error("[AutoLoginProvider Authorize] Error deleting expired token:", err));
          return null;
        }

        console.log("[AutoLoginProvider Authorize] AuthToken valid. Deleting token.");
        await prisma.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } }).catch(err => console.error("[AutoLoginProvider Authorize] Error deleting used token:", err));

        const userFromDb = await prisma.user.findUnique({
          where: { id: tokenRecord.userId },
          include: {
            images: { where: { isMain: true }, take: 1 },
          }
        });

        if (!userFromDb) {
          console.log("[AutoLoginProvider Authorize] User not found for the given authToken.");
          return null;
        }
        console.log(`[AutoLoginProvider Authorize] Auto-login successful for user ${userFromDb.email}`);

        const { images, ...restOfUser } = userFromDb;
        return {
          ...restOfUser,
          name: `${userFromDb.firstName} ${userFromDb.lastName}`,
          image: images?.[0]?.url || null,
          profile: null,
          images: [],
          questionnaireResponses: [],
          language: userFromDb.language || Language.he,
          questionnaireCompleted: false,
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
      console.log("[signIn Callback] Triggered.", {
        userId: typedUser.id,
        userEmail: typedUser.email,
        accountProvider: account?.provider,
        isUserVerifiedByProvider: oauthProfile?.email_verified,
        accountId: account?.providerAccountId
      });

      const userEmail = typedUser.email?.toLowerCase();
      if (!userEmail) {
        console.error("[signIn Callback] Critical: No user email available.", { user, account });
        return false;
      }

      let dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      if (!dbUser && account?.provider === 'google') {
        console.log(`[signIn Callback] Google sign-in for potentially new user: ${userEmail}.`);

        dbUser = await prisma.user.findUnique({
          where: { email: userEmail }
        });

        if (!dbUser) {
          try {
            console.log(`[signIn Callback] User ${userEmail} not found. Attempting to create.`);
            const createdDbUser = await prisma.user.create({
              data: {
                email: userEmail,
                firstName: typedUser.firstName || "",
                lastName: typedUser.lastName || "",
                role: typedUser.role || UserRole.CANDIDATE,
                status: typedUser.status || UserStatus.PENDING_PHONE_VERIFICATION,
                isVerified: typedUser.isVerified === undefined ? (!!oauthProfile?.email_verified) : typedUser.isVerified,
                isProfileComplete: typedUser.isProfileComplete || false,
                isPhoneVerified: typedUser.isPhoneVerified || false,
                source: UserSource.REGISTRATION,
                language: Language.he,
              },
            });
            dbUser = createdDbUser;
            console.log(`[signIn Callback] Created new user ${dbUser.email} during signIn.`);

            if (account && account.providerAccountId) {
              const existingAccount = await prisma.account.findUnique({
                where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } }
              });
              if (!existingAccount) {
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
                console.log(`[signIn Callback] Linked Google account for ${dbUser.email}`);
              }
            }
          } catch (error: unknown) {
            console.error("[signIn Callback] Failed to create user or link account:", error);

            if (typeof error === 'object' && error !== null && 'code' in error && 'meta' in error) {
              const prismaError = error as { code?: string; meta?: { target?: string[] } };
              if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('email')) {
                console.log("[signIn Callback] User likely created by adapter in parallel. Re-fetching.");
                dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
                if (!dbUser) {
                  console.error("[signIn Callback] Failed to re-fetch user after P2002 error.");
                  return false;
                }
              } else {
                return false;
              }
            } else {
              console.error("[signIn Callback] An unexpected error type occurred:", error);
              return false;
            }
          }
        }
      }

      if (!dbUser) {
        console.error(`[signIn Callback] User with email ${userEmail} not found and could not be created.`);
        return false;
      }

      typedUser.id = dbUser.id;
      typedUser.email = dbUser.email;
      typedUser.firstName = dbUser.firstName;
      typedUser.lastName = dbUser.lastName;
      typedUser.name = `${dbUser.firstName} ${dbUser.lastName}`.trim();
      typedUser.role = dbUser.role;
      typedUser.status = dbUser.status;
      typedUser.isVerified = dbUser.isVerified;
      typedUser.isProfileComplete = dbUser.isProfileComplete;
      typedUser.isPhoneVerified = dbUser.isPhoneVerified;
      typedUser.source = dbUser.source;
      typedUser.addedByMatchmakerId = dbUser.addedByMatchmakerId;
      typedUser.termsAndPrivacyAcceptedAt = dbUser.termsAndPrivacyAcceptedAt;
      typedUser.engagementEmailsConsent = dbUser.engagementEmailsConsent;
      typedUser.promotionalEmailsConsent = dbUser.promotionalEmailsConsent;
      typedUser.language = dbUser.language;
      typedUser.createdAt = dbUser.createdAt;
      typedUser.updatedAt = dbUser.updatedAt;
      typedUser.lastLogin = dbUser.lastLogin;

      if (account?.provider === "google") {
        if (dbUser.isVerified === false && oauthProfile?.email_verified === true) {
          console.log(`[signIn Callback] Google User ${dbUser.email} was not email-verified, but Google says it is. Updating DB.`);
          const updatedUser = await prisma.user.update({
            where: { id: dbUser.id },
            data: { isVerified: true, status: UserStatus.PENDING_PHONE_VERIFICATION }
          });
          typedUser.isVerified = updatedUser.isVerified;
          typedUser.status = updatedUser.status;
        }
      }

      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() }
      }).catch(err => console.error(`[signIn Callback] Failed to update lastLogin for user ${dbUser.id}:`, err));

      const requiresCompletion = !dbUser.isProfileComplete || !dbUser.isPhoneVerified || !dbUser.termsAndPrivacyAcceptedAt;
      typedUser.requiresCompletion = requiresCompletion;

      if (requiresCompletion) {
        typedUser.redirectUrl = '/auth/register';
      } else {
        typedUser.redirectUrl = '/profile';
      }

      console.log("[signIn Callback] Processed user. Flags:", {
        requiresCompletion: typedUser.requiresCompletion,
        redirectUrl: typedUser.redirectUrl,
      });
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      const typedToken = token as ExtendedUserJWT;
      const typedUserFromCallback = user as ExtendedUser | undefined;

      console.log(`[JWT Callback] Triggered with trigger: ${trigger}`, {
        hasUser: !!typedUserFromCallback,
        tokenId: typedToken.id,
        sessionData: session ? 'present' : 'absent'
      });

      // Upon initial sign-in, populate the token with user data
      if (typedUserFromCallback) {
        console.log('[JWT Callback] Populating token from user object (initial sign-in)');
        typedToken.id = typedUserFromCallback.id;
        typedToken.email = typedUserFromCallback.email.toLowerCase();
        typedToken.firstName = typedUserFromCallback.firstName;
        typedToken.lastName = typedUserFromCallback.lastName;
        typedToken.name = typedUserFromCallback.name || `${typedUserFromCallback.firstName} ${typedUserFromCallback.lastName}`.trim();
        typedToken.picture = typedUserFromCallback.image || null;
        typedToken.role = typedUserFromCallback.role;
        typedToken.status = typedUserFromCallback.status;
        typedToken.isVerified = typedUserFromCallback.isVerified;
        typedToken.isProfileComplete = typedUserFromCallback.isProfileComplete || false;
        typedToken.isPhoneVerified = typedUserFromCallback.isPhoneVerified || false;
        typedToken.questionnaireCompleted = typedUserFromCallback.questionnaireCompleted;
        typedToken.source = typedUserFromCallback.source;
        typedToken.addedByMatchmakerId = typedUserFromCallback.addedByMatchmakerId;
        typedToken.termsAndPrivacyAcceptedAt = typedUserFromCallback.termsAndPrivacyAcceptedAt;
        typedToken.requiresCompletion = typedUserFromCallback.requiresCompletion;
        typedToken.redirectUrl = typedUserFromCallback.redirectUrl;
        typedToken.engagementEmailsConsent = typedUserFromCallback.engagementEmailsConsent;
        typedToken.promotionalEmailsConsent = typedUserFromCallback.promotionalEmailsConsent;
        typedToken.language = typedUserFromCallback.language;
        typedToken.createdAt = typedUserFromCallback.createdAt;
        typedToken.updatedAt = typedUserFromCallback.updatedAt;
        typedToken.lastLogin = typedUserFromCallback.lastLogin;

        console.log('[JWT Callback] Token populated with language:', typedToken.language);
      }

      // ✅ תיקון: טיפול ב-trigger === 'update' - זה קורה כאשר updateSession() נקרא
      if (typedToken.id && trigger === "update") {
        console.log('[JWT Callback] Update trigger detected - refreshing user data from DB');

        const dbUserForJwt = await prisma.user.findUnique({
          where: { id: typedToken.id },
          include: {
            images: { where: { isMain: true }, take: 1 },
            profile: true, // ✅ הוספה: חובה לשלוף את הפרופיל כדי לעדכן את הסטטוס
          }
        });

        if (dbUserForJwt) {
          console.log('[JWT Callback] Found user in DB, updating token');
          typedToken.firstName = dbUserForJwt.firstName;
          typedToken.lastName = dbUserForJwt.lastName;
          typedToken.picture = dbUserForJwt.images?.[0]?.url || typedToken.picture;
          typedToken.role = dbUserForJwt.role;
          typedToken.status = dbUserForJwt.status;
          typedToken.isVerified = dbUserForJwt.isVerified;
          typedToken.isProfileComplete = dbUserForJwt.isProfileComplete;
          typedToken.isPhoneVerified = dbUserForJwt.isPhoneVerified;
          typedToken.source = dbUserForJwt.source;
          typedToken.addedByMatchmakerId = dbUserForJwt.addedByMatchmakerId;
          typedToken.termsAndPrivacyAcceptedAt = dbUserForJwt.termsAndPrivacyAcceptedAt;
          typedToken.engagementEmailsConsent = dbUserForJwt.engagementEmailsConsent;
          typedToken.promotionalEmailsConsent = dbUserForJwt.promotionalEmailsConsent;
          typedToken.language = dbUserForJwt.language;
          typedToken.createdAt = dbUserForJwt.createdAt;
          typedToken.updatedAt = dbUserForJwt.updatedAt;
          typedToken.lastLogin = dbUserForJwt.lastLogin;
          typedToken.neshamaInsightLastGeneratedAt = dbUserForJwt.neshamaInsightLastGeneratedAt;
          typedToken.neshamaInsightGeneratedCount = dbUserForJwt.neshamaInsightGeneratedCount;

          // ✅ הוספה: עדכון הפרופיל ב-Token
          if (dbUserForJwt.profile) {
            typedToken.profile = dbUserForJwt.profile as unknown as UserProfile;
          }

          console.log('[JWT Callback] Language updated in token:', typedToken.language);

          const questionnaireStatus = await prisma.questionnaireResponse.findFirst({
            where: { userId: typedToken.id },
            select: { completed: true },
            orderBy: { createdAt: 'desc' },
          });
          typedToken.questionnaireCompleted = questionnaireStatus?.completed ?? false;

          const requiresCompletionFromDb = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified || !dbUserForJwt.termsAndPrivacyAcceptedAt);
          typedToken.requiresCompletion = requiresCompletionFromDb;
          typedToken.redirectUrl = requiresCompletionFromDb ? '/auth/register' : '/profile';
        } else {
          console.log('[JWT Callback] User not found in DB');
        }
      }

      // ✅ רענון נתונים גם ב-signIn (אם צריך)
      if (typedToken.id && trigger === "signIn" && !typedUserFromCallback) {
        console.log('[JWT Callback] SignIn trigger without user object - refreshing from DB');

        const dbUserForJwt = await prisma.user.findUnique({
          where: { id: typedToken.id },
          include: {
            images: { where: { isMain: true }, take: 1 },
            profile: true // ✅ הוספתי גם כאן ליתר ביטחון
          }
        });

        if (dbUserForJwt) {
          typedToken.firstName = dbUserForJwt.firstName;
          typedToken.lastName = dbUserForJwt.lastName;
          typedToken.picture = dbUserForJwt.images?.[0]?.url || typedToken.picture;
          typedToken.role = dbUserForJwt.role;
          typedToken.status = dbUserForJwt.status;
          typedToken.isVerified = dbUserForJwt.isVerified;
          typedToken.isProfileComplete = dbUserForJwt.isProfileComplete;
          typedToken.isPhoneVerified = dbUserForJwt.isPhoneVerified;
          typedToken.source = dbUserForJwt.source;
          typedToken.addedByMatchmakerId = dbUserForJwt.addedByMatchmakerId;
          typedToken.termsAndPrivacyAcceptedAt = dbUserForJwt.termsAndPrivacyAcceptedAt;
          typedToken.engagementEmailsConsent = dbUserForJwt.engagementEmailsConsent;
          typedToken.promotionalEmailsConsent = dbUserForJwt.promotionalEmailsConsent;
          typedToken.language = dbUserForJwt.language;
          typedToken.createdAt = dbUserForJwt.createdAt;
          typedToken.updatedAt = dbUserForJwt.updatedAt;
          typedToken.lastLogin = dbUserForJwt.lastLogin;

          // ✅ הוספה: עדכון הפרופיל ב-Token
          if (dbUserForJwt.profile) {
            typedToken.profile = dbUserForJwt.profile as unknown as UserProfile;
          }

          const questionnaireStatus = await prisma.questionnaireResponse.findFirst({
            where: { userId: typedToken.id },
            select: { completed: true },
            orderBy: { createdAt: 'desc' },
          });
          typedToken.questionnaireCompleted = questionnaireStatus?.completed ?? false;

          const requiresCompletionFromDb = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified || !dbUserForJwt.termsAndPrivacyAcceptedAt);
          typedToken.requiresCompletion = requiresCompletionFromDb;
          typedToken.redirectUrl = requiresCompletionFromDb ? '/auth/register' : '/profile';
        }
      }

      return typedToken;
    },

    async session({ session, token }) {
      const typedToken = token as ExtendedUserJWT;
      const typedSession = session as ExtendedSession;

      if (typedSession.user && typedToken.id) {
        typedSession.user.id = typedToken.id;
        typedSession.user.email = typedToken.email;
        typedSession.user.firstName = typedToken.firstName;
        typedSession.user.lastName = typedToken.lastName;
        typedSession.user.name = typedToken.name ?? null;
        typedSession.user.image = typedToken.picture ?? null;
        typedSession.user.role = typedToken.role;
        typedSession.user.status = typedToken.status;
        typedSession.user.isVerified = typedToken.isVerified;
        typedSession.user.isProfileComplete = typedToken.isProfileComplete;
        typedSession.user.isPhoneVerified = typedToken.isPhoneVerified;
        typedSession.user.questionnaireCompleted = typedToken.questionnaireCompleted;
        typedSession.user.hasCompletedOnboarding = typedToken.hasCompletedOnboarding as boolean;
        typedSession.user.source = typedToken.source;
        typedSession.user.addedByMatchmakerId = typedToken.addedByMatchmakerId;
        typedSession.user.engagementEmailsConsent = typedToken.engagementEmailsConsent;
        typedSession.user.promotionalEmailsConsent = typedToken.promotionalEmailsConsent;
        typedSession.user.language = typedToken.language;
        
        // ✅ הוספה קריטית: העברת הפרופיל מה-Token ל-Session
        if (typedToken.profile) {
            typedSession.user.profile = typedToken.profile;
        }

        if (typedToken.createdAt) {
          typedSession.user.createdAt = new Date(typedToken.createdAt as unknown as string);
        }
        if (typedToken.updatedAt) {
          typedSession.user.updatedAt = new Date(typedToken.updatedAt as unknown as string);
        }
        if (typedToken.lastLogin) {
          typedSession.user.lastLogin = new Date(typedToken.lastLogin as unknown as string);
        }
        if (typedToken.termsAndPrivacyAcceptedAt) {
          typedSession.user.termsAndPrivacyAcceptedAt = new Date(typedToken.termsAndPrivacyAcceptedAt as unknown as string);
        }

        typedSession.requiresCompletion = typedToken.requiresCompletion;
        typedSession.redirectUrl = typedToken.redirectUrl;
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