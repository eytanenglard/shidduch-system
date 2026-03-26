// src/lib/auth.ts
//
// ✅ OPTIMIZED:
//   - JWT callback: logs only on actual triggers (signIn, update), not on every session validation
//   - Redirect callback: logs only in development mode
//   - signIn callback: reduced verbose logging (kept essential logs)

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, Profile as OAuthProfile } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import jwt from "jsonwebtoken";
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

const isDev = process.env.NODE_ENV === "development";

// ============================================================================
// 🔴 פונקציה: קביעת ה-redirectUrl בהתאם למצב המשתמש
// ============================================================================
interface UserCompletionStatus {
  isProfileComplete: boolean;
  isPhoneVerified: boolean;
  termsAndPrivacyAcceptedAt?: Date | null;
  role?: UserRole;
  hasSoulFingerprint?: boolean;
}

function determineRedirectUrl(user: UserCompletionStatus): string {
  if (user.role === UserRole.ADMIN || user.role === UserRole.MATCHMAKER) {
    return '/admin/engagement';
  }

  if (!user.termsAndPrivacyAcceptedAt) {
    return '/auth/register?reason=accept_terms';
  }

  if (!user.isProfileComplete) {
    return '/auth/register?reason=complete_profile';
  }

  if (!user.isPhoneVerified) {
    return '/auth/verify-phone';
  }

  // After phone verification — redirect to Soul Fingerprint if not completed
  if (!user.hasSoulFingerprint) {
    return '/soul-fingerprint';
  }

  return '/profile';
}

function checkRequiresCompletion(user: UserCompletionStatus): boolean {
  if (user.role === UserRole.ADMIN || user.role === UserRole.MATCHMAKER) {
    return false;
  }
  return !user.isProfileComplete || !user.isPhoneVerified || !user.termsAndPrivacyAcceptedAt;
}

// ============================================================================
// 🍎 Apple Client Secret Generator
// ============================================================================
function generateAppleClientSecret(): string {
  const privateKey = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const clientId = process.env.APPLE_CLIENT_ID;

  if (!privateKey || !teamId || !keyId || !clientId) {
    console.error('[Apple Auth] ❌ Missing required environment variables:', {
      hasPrivateKey: !!privateKey,
      hasTeamId: !!teamId,
      hasKeyId: !!keyId,
      hasClientId: !!clientId,
    });
    throw new Error('Missing Apple authentication environment variables');
  }

  const now = Math.floor(Date.now() / 1000);
  const expiry = now + (86400 * 180); // 180 days

  try {
    const token = jwt.sign(
      {
        iss: teamId,
        iat: now,
        exp: expiry,
        aud: 'https://appleid.apple.com',
        sub: clientId,
      },
      privateKey,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: keyId,
        },
      }
    );

    console.log('[Apple Auth] ✅ Client secret generated successfully');
    return token;
  } catch (error) {
    console.error('[Apple Auth] ❌ Failed to generate client secret:', error);
    throw error;
  }
}

// ============================================================================

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: false, // ✅ Disabled debug mode — was generating excessive logs

  // ✅ OPTIMIZED: Only log errors and warnings, not debug
  logger: {
    error(code, metadata) {
      console.error('[NextAuth Error]', code, JSON.stringify(metadata, null, 2));
    },
    warn(code) {
      console.warn('[NextAuth Warning]', code);
    },
    debug(code, metadata) {
      // ✅ Only log debug in development and only for specific events
      if (isDev && (code === 'authorize' || code === 'signIn')) {
        console.log('[NextAuth Debug]', code, JSON.stringify(metadata, null, 2));
      }
    },
  },

  providers: [
    // ========================================================================
    // 🍎 Apple Provider
    // ========================================================================
    AppleProvider({
      clientId: process.env.APPLE_CLIENT_ID!,
      clientSecret: generateAppleClientSecret(),
      authorization: {
        params: {
          scope: "name email",
          response_mode: "form_post",
        },
      },
      profile(profile) {
        console.log("[AppleProvider Profile Fn] Apple profile received for sub:", profile.sub);
        const now = new Date();

        const firstName = (profile as any).name?.firstName || "";
        const lastName = (profile as any).name?.lastName || "";

        const userForAdapter: ExtendedUser = {
          id: profile.sub,
          email: (profile.email || "").toLowerCase(),
          firstName,
          lastName,
          name: `${firstName} ${lastName}`.trim() || null,
          phone: null,
          image: null,
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

        return userForAdapter;
      },
    }),

    // ========================================================================
    // Google Provider
    // ========================================================================
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
      profile(profile: OAuthProfile & { sub?: string; given_name?: string; family_name?: string; picture?: string; email_verified?: boolean }, tokens) {
        const now = new Date();

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

        return userForAdapter;
      }
    }),

    // ========================================================================
    // Credentials Provider
    // ========================================================================
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
            images: { where: { isMain: true }, take: 1 },
          }
        });

        if (!userFromDb || !userFromDb.password) {
          return null;
        }

        const isPasswordValid = await compare(credentials.password, userFromDb.password);
        if (!isPasswordValid) {
          return null;
        }

        if (isDev) console.log(`[CredentialsProvider] Auth successful for userId: ${userFromDb.id}`);

        await prisma.user.update({
          where: { id: userFromDb.id },
          data: { lastLogin: new Date() }
        }).catch(err => console.error("[CredentialsProvider] Failed to update lastLogin:", err));

        const { images, password: _password, ...restOfUser } = userFromDb;
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

    // ========================================================================
    // Email Verified AutoLogin Provider
    // ========================================================================
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

        if (!tokenRecord) {
          return null;
        }

        if (new Date() > tokenRecord.expiresAt) {
          await prisma.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } }).catch(console.error);
          return null;
        }

        await prisma.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } }).catch(console.error);

        const userFromDb = await prisma.user.findUnique({
          where: { id: tokenRecord.userId },
          include: {
            images: { where: { isMain: true }, take: 1 },
          }
        });

        if (!userFromDb) {
          return null;
        }

        if (isDev) console.log(`[AutoLoginProvider] Auto-login successful for userId: ${userFromDb.id}`);

        const { images, password: _password, ...restOfUser } = userFromDb;
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

      // ✅ Concise logging — only essential info
      console.log("[signIn] Provider:", account?.provider, "| userId:", typedUser.id);

      const userEmail = typedUser.email?.toLowerCase();
      if (!userEmail) {
        console.error("[signIn] No user email available.");
        return false;
      }

      let dbUser = await prisma.user.findUnique({
        where: { email: userEmail },
      });

      // ====================================================================
      // 🍎 Apple Sign-In: Create new user or link Apple ID
      // ====================================================================
      if (!dbUser && account?.provider === 'apple') {
        try {
          const createdDbUser = await prisma.user.create({
            data: {
              email: userEmail,
              firstName: typedUser.firstName || "",
              lastName: typedUser.lastName || "",
              appleId: account.providerAccountId,
              role: UserRole.CANDIDATE,
              status: UserStatus.PENDING_PHONE_VERIFICATION,
              isVerified: !!oauthProfile?.email_verified,
              isProfileComplete: false,
              isPhoneVerified: false,
              source: UserSource.REGISTRATION,
              language: Language.he,
              termsAndPrivacyAcceptedAt: new Date(),
              engagementEmailsConsent: false,
              promotionalEmailsConsent: false,
              profile: {
                create: {
                  availabilityStatus: 'AVAILABLE',
                  isProfileVisible: false,
                  gender: 'FEMALE',
                  birthDate: new Date('2000-01-01T00:00:00.000Z'),
                  birthDateIsApproximate: true,
                },
              },
            },
          });
          dbUser = createdDbUser;
          console.log(`[signIn] Created Apple user, ID: ${dbUser.id}`);

          if (account.providerAccountId) {
            const existingAccount = await prisma.account.findUnique({
              where: {
                provider_providerAccountId: {
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                },
              },
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
            }
          }
        } catch (error: unknown) {
          console.error("[signIn] 🍎 ❌ Failed to create Apple user:", error);
          if (
            typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            'meta' in error
          ) {
            const prismaError = error as { code?: string; meta?: { target?: string[] } };
            if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('email')) {
              dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
              if (!dbUser) return false;
            } else {
              return false;
            }
          } else {
            return false;
          }
        }
      }

      // ====================================================================
      // Google Sign-In: Create new user
      // ====================================================================
      if (!dbUser && account?.provider === 'google') {
        dbUser = await prisma.user.findUnique({
          where: { email: userEmail }
        });

        if (!dbUser) {
          try {
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
            console.log(`[signIn] Created Google user, ID: ${dbUser.id}`);

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
              }
            }
          } catch (error: unknown) {
            console.error("[signIn] Failed to create Google user:", error);

            if (typeof error === 'object' && error !== null && 'code' in error && 'meta' in error) {
              const prismaError = error as { code?: string; meta?: { target?: string[] } };
              if (prismaError.code === 'P2002' && prismaError.meta?.target?.includes('email')) {
                dbUser = await prisma.user.findUnique({ where: { email: userEmail } });
                if (!dbUser) return false;
              } else {
                return false;
              }
            } else {
              return false;
            }
          }
        }
      }

      if (!dbUser) {
        console.error(`[signIn] User not found and could not be created. Provider: ${account?.provider}`);
        return false;
      }

      // ====================================================================
      // 🍎 Link Apple ID to existing user (if user exists but has no appleId)
      // ====================================================================
      if (account?.provider === 'apple' && !dbUser.appleId) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { appleId: account.providerAccountId },
        }).catch(err => console.error("[signIn] 🍎 Failed to link Apple ID:", err));

        const existingAccount = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
          },
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
          }).catch(err => console.error("[signIn] 🍎 Failed to create Apple account record:", err));
        }
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

      // Verify email status for OAuth providers
      if (account?.provider === "google" || account?.provider === "apple") {
        if (dbUser.isVerified === false && oauthProfile?.email_verified === true) {
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
      }).catch(err => console.error(`[signIn] Failed to update lastLogin for ${dbUser.id}:`, err));

      typedUser.requiresCompletion = checkRequiresCompletion({
        isProfileComplete: dbUser.isProfileComplete,
        isPhoneVerified: dbUser.isPhoneVerified,
        termsAndPrivacyAcceptedAt: dbUser.termsAndPrivacyAcceptedAt,
        role: dbUser.role,
      });

      // Check Soul Fingerprint status for redirect decision
      const sfCheck = await prisma.profileTags.findFirst({
        where: { userId: dbUser.id },
        select: { completedAt: true },
      });

      typedUser.redirectUrl = determineRedirectUrl({
        isProfileComplete: dbUser.isProfileComplete,
        isPhoneVerified: dbUser.isPhoneVerified,
        termsAndPrivacyAcceptedAt: dbUser.termsAndPrivacyAcceptedAt,
        role: dbUser.role,
        hasSoulFingerprint: !!sfCheck?.completedAt,
      });

      console.log("[signIn] ✅ Allowed |", account?.provider, "| redirect:", typedUser.redirectUrl);

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      const typedToken = token as ExtendedUserJWT;
      const typedUserFromCallback = user as ExtendedUser | undefined;

      // ✅ OPTIMIZED: Only log when there's an actual trigger, not on every session validation
      if (isDev && trigger) {
        console.log(`[JWT] trigger: ${trigger} | tokenId: ${typedToken.id}`);
      }

      if (typedUserFromCallback) {
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
        typedToken.engagementEmailsConsent = typedUserFromCallback.engagementEmailsConsent;
        typedToken.promotionalEmailsConsent = typedUserFromCallback.promotionalEmailsConsent;
        typedToken.language = typedUserFromCallback.language;
        typedToken.createdAt = typedUserFromCallback.createdAt;
        typedToken.updatedAt = typedUserFromCallback.updatedAt;
        typedToken.lastLogin = typedUserFromCallback.lastLogin;

        // Check if user has completed Soul Fingerprint
        const soulFingerprintStatus = await prisma.profileTags.findFirst({
          where: { userId: typedUserFromCallback.id },
          select: { completedAt: true },
        });
        typedToken.hasSoulFingerprint = !!soulFingerprintStatus?.completedAt;

        typedToken.requiresCompletion = checkRequiresCompletion({
          isProfileComplete: typedUserFromCallback.isProfileComplete || false,
          isPhoneVerified: typedUserFromCallback.isPhoneVerified || false,
          termsAndPrivacyAcceptedAt: typedUserFromCallback.termsAndPrivacyAcceptedAt,
          role: typedUserFromCallback.role,
        });

        typedToken.redirectUrl = determineRedirectUrl({
          isProfileComplete: typedUserFromCallback.isProfileComplete || false,
          isPhoneVerified: typedUserFromCallback.isPhoneVerified || false,
          termsAndPrivacyAcceptedAt: typedUserFromCallback.termsAndPrivacyAcceptedAt,
          role: typedUserFromCallback.role,
          hasSoulFingerprint: typedToken.hasSoulFingerprint,
        });
      }

      // Session invalidation: check if password was changed after token was issued
      if (typedToken.id && !typedUserFromCallback) {
        const passwordCheck = await prisma.user.findUnique({
          where: { id: typedToken.id },
          select: { passwordChangedAt: true },
        });
        const tokenIat = (token as { iat?: number }).iat;
        if (passwordCheck?.passwordChangedAt && tokenIat) {
          const tokenIssuedAt = tokenIat * 1000; // JWT iat is in seconds
          if (passwordCheck.passwordChangedAt.getTime() > tokenIssuedAt) {
            // Password was changed after this token was issued — invalidate session
            return {} as ExtendedUserJWT;
          }
        }
      }

      if (typedToken.id && trigger === "update") {
        if (isDev) console.log('[JWT] Update trigger — refreshing from DB');

        const dbUserForJwt = await prisma.user.findUnique({
          where: { id: typedToken.id },
          include: {
            images: { where: { isMain: true }, take: 1 },
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
          typedToken.neshamaInsightLastGeneratedAt = dbUserForJwt.neshamaInsightLastGeneratedAt;
          typedToken.neshamaInsightGeneratedCount = dbUserForJwt.neshamaInsightGeneratedCount;

          const questionnaireStatus = await prisma.questionnaireResponse.findFirst({
            where: { userId: typedToken.id },
            select: { completed: true },
            orderBy: { createdAt: 'desc' },
          });
          typedToken.questionnaireCompleted = questionnaireStatus?.completed ?? false;

          // Check if user has completed Soul Fingerprint
          const sfStatus = await prisma.profileTags.findFirst({
            where: { userId: typedToken.id },
            select: { completedAt: true },
          });
          typedToken.hasSoulFingerprint = !!sfStatus?.completedAt;

          typedToken.requiresCompletion = checkRequiresCompletion({
            isProfileComplete: dbUserForJwt.isProfileComplete,
            isPhoneVerified: dbUserForJwt.isPhoneVerified,
            termsAndPrivacyAcceptedAt: dbUserForJwt.termsAndPrivacyAcceptedAt,
            role: dbUserForJwt.role,
          });

          typedToken.redirectUrl = determineRedirectUrl({
            isProfileComplete: dbUserForJwt.isProfileComplete,
            isPhoneVerified: dbUserForJwt.isPhoneVerified,
            termsAndPrivacyAcceptedAt: dbUserForJwt.termsAndPrivacyAcceptedAt,
            role: dbUserForJwt.role,
            hasSoulFingerprint: typedToken.hasSoulFingerprint,
          });
        }
      }

      if (typedToken.id && trigger === "signIn" && !typedUserFromCallback) {
        if (isDev) console.log('[JWT] SignIn trigger without user — refreshing from DB');

        const dbUserForJwt = await prisma.user.findUnique({
          where: { id: typedToken.id },
          include: {
            images: { where: { isMain: true }, take: 1 },
            profile: true
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

          if (dbUserForJwt.profile) {
            typedToken.profile = dbUserForJwt.profile as unknown as UserProfile;
          }

          const questionnaireStatus = await prisma.questionnaireResponse.findFirst({
            where: { userId: typedToken.id },
            select: { completed: true },
            orderBy: { createdAt: 'desc' },
          });
          typedToken.questionnaireCompleted = questionnaireStatus?.completed ?? false;

          // Check Soul Fingerprint status
          const sfSignInStatus = await prisma.profileTags.findFirst({
            where: { userId: typedToken.id },
            select: { completedAt: true },
          });
          typedToken.hasSoulFingerprint = !!sfSignInStatus?.completedAt;

          typedToken.requiresCompletion = checkRequiresCompletion({
            isProfileComplete: dbUserForJwt.isProfileComplete,
            isPhoneVerified: dbUserForJwt.isPhoneVerified,
            termsAndPrivacyAcceptedAt: dbUserForJwt.termsAndPrivacyAcceptedAt,
            role: dbUserForJwt.role,
          });

          typedToken.redirectUrl = determineRedirectUrl({
            isProfileComplete: dbUserForJwt.isProfileComplete,
            isPhoneVerified: dbUserForJwt.isPhoneVerified,
            termsAndPrivacyAcceptedAt: dbUserForJwt.termsAndPrivacyAcceptedAt,
            role: dbUserForJwt.role,
            hasSoulFingerprint: typedToken.hasSoulFingerprint,
          });
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
        typedSession.user.hasSoulFingerprint = typedToken.hasSoulFingerprint;
        typedSession.user.hasCompletedOnboarding = typedToken.hasCompletedOnboarding as boolean;
        typedSession.user.source = typedToken.source;
        typedSession.user.addedByMatchmakerId = typedToken.addedByMatchmakerId;
        typedSession.user.engagementEmailsConsent = typedToken.engagementEmailsConsent;
        typedSession.user.promotionalEmailsConsent = typedToken.promotionalEmailsConsent;
        typedSession.user.language = typedToken.language;

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
      // ✅ OPTIMIZED: Only log in development
      if (isDev) {
        console.log(`[Redirect] url: ${url}, baseUrl: ${baseUrl}`);
      }

      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      try {
        const parsedUrl = new URL(url);
        if (parsedUrl.origin === baseUrl) {
          return url;
        }
      } catch (e) {
        console.error(`[Redirect] ❌ Failed to parse URL: ${url}`, e);
      }

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
    maxAge: 30 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  useSecureCookies: process.env.NODE_ENV === "production",
};

export default authOptions;