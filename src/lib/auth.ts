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
} from "@/types/next-auth"; // ודא שהנתיב נכון
import { JWT as ExtendedUserJWT } from "next-auth/jwt";
import { Session as ExtendedSession } from "next-auth";
import { UserRole, UserStatus, UserSource } from "@prisma/client"; // Added UserSource

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

        // For new users via Google, source will default to REGISTRATION in Prisma schema.
        // addedByMatchmakerId will be null.
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
          source: UserSource.REGISTRATION, // Explicitly set for clarity, though schema has default
          addedByMatchmakerId: null,  
           termsAndPrivacyAcceptedAt: null,   // Not applicable for Google sign-up
          profile: null, 
          images: [], 
          questionnaireResponses: [],
                    questionnaireCompleted: false, // הוספה כאן

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
            profile: true,
            images: { where: { isMain: true }, take: 1 },
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
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

        const { profile, images, questionnaireResponses, ...restOfUser } = userFromDb;
        return {
          ...restOfUser,
          name: `${userFromDb.firstName} ${userFromDb.lastName}`,
          image: images?.[0]?.url || null, 
          profile: profile as UserProfile | null,
          images: images as UserImage[],
          questionnaireResponses: questionnaireResponses as QuestionnaireResponse[],
          questionnaireCompleted: questionnaireResponses.length > 0 && questionnaireResponses[0].completed, // הוספה כאן

          source: userFromDb.source, // Add source
          addedByMatchmakerId: userFromDb.addedByMatchmakerId,
           termsAndPrivacyAcceptedAt: userFromDb.termsAndPrivacyAcceptedAt, // Add addedByMatchmakerId
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
            profile: true,
            images: { where: { isMain: true }, take: 1 },
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });

        if (!userFromDb) {
          console.log("[AutoLoginProvider Authorize] User not found for the given authToken.");
          return null;
        }
        console.log(`[AutoLoginProvider Authorize] Auto-login successful for user ${userFromDb.email}`);
        
        const { profile, images, questionnaireResponses, ...restOfUser } = userFromDb;
        return {
          ...restOfUser,
          name: `${userFromDb.firstName} ${userFromDb.lastName}`,
          image: images?.[0]?.url || null,
          profile: profile as UserProfile | null,
          images: images as UserImage[],
          questionnaireResponses: questionnaireResponses as QuestionnaireResponse[],
                   questionnaireCompleted: questionnaireResponses.length > 0 && questionnaireResponses[0].completed, // הוספה כאן

          source: userFromDb.source, // Add source
          addedByMatchmakerId: userFromDb.addedByMatchmakerId,
           termsAndPrivacyAcceptedAt: userFromDb.termsAndPrivacyAcceptedAt, // Add addedByMatchmakerId
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
    
      if (dbUser) { // לאחר מציאה או יצירה של dbUser
        typedUser.termsAndPrivacyAcceptedAt = dbUser.termsAndPrivacyAcceptedAt; // <--- העבר את הערך
      }

      if (!dbUser && account?.provider === 'google') {
        console.log(`[signIn Callback] Google sign-in for potentially new user: ${userEmail}.`);
        
        dbUser = await prisma.user.findUnique({ 
            where: { email: userEmail } 
        });

        if (!dbUser) {
            try {
                console.log(`[signIn Callback] User ${userEmail} not found after Google sign-in via adapter. Attempting to create directly.`);
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
                        source: UserSource.REGISTRATION, // New users via Google are REGISTRATION
                        // addedByMatchmakerId will be null by default
                    },
                });
                dbUser = createdDbUser; 
                console.log(`[signIn Callback] Created new user ${dbUser.email} during signIn.`);

                if (account && account.providerAccountId) {
                    const existingAccount = await prisma.account.findUnique({
                        where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId }}
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
                        console.log("[signIn Callback] User likely created by adapter in parallel. Attempting to re-fetch.");
                        dbUser = await prisma.user.findUnique({ where: { email: userEmail }});
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
      typedUser.source = dbUser.source; // Pass source from DB
      typedUser.addedByMatchmakerId = dbUser.addedByMatchmakerId; // Pass addedByMatchmakerId from DB
      
      console.log("[signIn Callback] Processed user. Flags:", {
        roleFromDbUser: dbUser.role, 
        roleSetOnTypedUser: typedUser.role, 
      });

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
    
      const requiresCompletion = !dbUser.isProfileComplete || !dbUser.isPhoneVerified;
      typedUser.requiresCompletion = requiresCompletion;

      if (requiresCompletion) {
        typedUser.redirectUrl = '/auth/register';
        if ((dbUser.status === UserStatus.PENDING_PHONE_VERIFICATION || 
             dbUser.status === UserStatus.PENDING_EMAIL_VERIFICATION) && 
            !dbUser.isProfileComplete) {
          typedUser.newlyCreated = true;
          console.log(`[signIn Callback] User ${dbUser.email} marked as newlyCreated.`);
        } else {
          typedUser.newlyCreated = typedUser.newlyCreated === undefined ? false : typedUser.newlyCreated;
        }
      } else {
        typedUser.redirectUrl = '/profile';
        typedUser.newlyCreated = false;
      }
    
      console.log("[signIn Callback] Processed user. Flags:", {
        userId: typedUser.id,
        email: typedUser.email,
        isProfileComplete: typedUser.isProfileComplete,
        isPhoneVerified: typedUser.isPhoneVerified,
        requiresCompletion: typedUser.requiresCompletion,
        newlyCreated: typedUser.newlyCreated,
        redirectUrl: typedUser.redirectUrl,
        status: typedUser.status,
        source: typedUser.source, // Log source
      });
      return true;
    },

    async jwt({ token, user, trigger, session, account }) {
      const typedToken = token as ExtendedUserJWT;
      const typedUserFromCallback = user as ExtendedUser | undefined;

      console.log("[JWT Callback] Triggered.", {
          trigger,
          tokenEmail: typedToken.email,
          userEmailFromCallback: typedUserFromCallback?.email,
          isAccountPresent: !!account,
          isSessionPresent: !!session
      });

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
          typedToken.questionnaireResponses = typedUserFromCallback.questionnaireResponses;
        
        // --- START: הוספה כאן ---
        // העבר את הדגל מה-user object בפעם הראשונה
        typedToken.questionnaireCompleted = typedUserFromCallback.questionnaireCompleted; 
        typedToken.source = typedUserFromCallback.source; // Add source
        typedToken.addedByMatchmakerId = typedUserFromCallback.addedByMatchmakerId; // Add addedByMatchmakerId
 typedToken.termsAndPrivacyAcceptedAt = typedUserFromCallback.termsAndPrivacyAcceptedAt;
        typedToken.requiresCompletion = typedUserFromCallback.requiresCompletion;
        typedToken.redirectUrl = typedUserFromCallback.redirectUrl;
        typedToken.newlyCreated = typedUserFromCallback.newlyCreated;
        typedToken.createdAt = typedUserFromCallback.createdAt; 
        typedToken.updatedAt = typedUserFromCallback.updatedAt; 

        console.log("[JWT Callback - Initial Population] Token populated from user callback object:", {
            tokenId: typedToken.id,
            tokenEmail: typedToken.email,
            tokenStatus: typedToken.status,
            tokenSource: typedToken.source,
        });
      }
      
      if (typedToken.id && (trigger === "signIn" || trigger === "signUp" || trigger === "update" || !typedToken.profile || !typedToken.images)) {
          console.log(`[JWT Callback - DB Refresh] Refreshing token data for user ID: ${typedToken.id} due to trigger: ${trigger} or missing profile/images.`);
          const dbUserForJwt = await prisma.user.findUnique({
            where: { id: typedToken.id },
            include: {
              profile: true, // This will include manualEntryText
              images: { where: { isMain: true }, take: 1 },
              questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          });

          if (dbUserForJwt) {
            typedToken.email = dbUserForJwt.email.toLowerCase(); 
            typedToken.firstName = dbUserForJwt.firstName;
            typedToken.lastName = dbUserForJwt.lastName;
            typedToken.name = `${dbUserForJwt.firstName} ${dbUserForJwt.lastName}`.trim();
            typedToken.picture = dbUserForJwt.images?.[0]?.url || typedToken.picture; 
            typedToken.role = dbUserForJwt.role;
            typedToken.status = dbUserForJwt.status;
            typedToken.isVerified = dbUserForJwt.isVerified;
            typedToken.isProfileComplete = dbUserForJwt.isProfileComplete;
            typedToken.isPhoneVerified = dbUserForJwt.isPhoneVerified;
                        typedToken.questionnaireResponses = dbUserForJwt.questionnaireResponses as QuestionnaireResponse[];

            typedToken.source = dbUserForJwt.source; // Refresh source
            typedToken.addedByMatchmakerId = dbUserForJwt.addedByMatchmakerId; // Refresh addedByMatchmakerId
 typedToken.termsAndPrivacyAcceptedAt = dbUserForJwt.termsAndPrivacyAcceptedAt;
            typedToken.profile = dbUserForJwt.profile as UserProfile | null;
            typedToken.images = dbUserForJwt.images as UserImage[]; 
            typedToken.questionnaireResponses = dbUserForJwt.questionnaireResponses as QuestionnaireResponse[];
              const hasCompletedQuestionnaire = dbUserForJwt.questionnaireResponses.length > 0 && dbUserForJwt.questionnaireResponses[0].completed === true;
            typedToken.questionnaireCompleted = hasCompletedQuestionnaire;
            typedToken.lastLogin = dbUserForJwt.lastLogin;
            typedToken.createdAt = dbUserForJwt.createdAt;
            typedToken.updatedAt = dbUserForJwt.updatedAt;
            console.log("[JWT Callback - DB Refresh] dbUserForJwt.role:", dbUserForJwt.role); 

            const requiresCompletionFromDb = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified);
            if (trigger !== "update" || session === undefined ) { 
                typedToken.requiresCompletion = requiresCompletionFromDb;
                typedToken.redirectUrl = requiresCompletionFromDb ? '/auth/register' : '/profile';
                 if ((dbUserForJwt.status === UserStatus.PENDING_PHONE_VERIFICATION || 
                     dbUserForJwt.status === UserStatus.PENDING_EMAIL_VERIFICATION) && 
                    !dbUserForJwt.isProfileComplete) {
                    if (typedToken.newlyCreated !== true) {
                       typedToken.newlyCreated = true;
                    }
                } else {
                    if (typedToken.newlyCreated !== true) { 
                         typedToken.newlyCreated = false;
                    }
                }
            }

            console.log("[JWT Callback - DB Refresh] Token updated from DB:", {
                tokenId: typedToken.id,
                tokenEmail: typedToken.email,
                tokenStatus: typedToken.status,
                tokenSource: typedToken.source,
            });
          } else {
              console.warn(`[JWT Callback - DB Refresh] User with ID ${typedToken.id} not found in DB during refresh. Token might be stale.`);
          }
      }
      
      if (trigger === "update" && session) {
        console.log("[JWT Callback - Client Update] Processing 'update' trigger with session data:", session);
      }

      console.log("[JWT Callback] Returning final token:", { 
        tokenId: typedToken.id,
        email: typedToken.email, 
        role: typedToken.role, 
        requiresCompletion: typedToken.requiresCompletion,
        redirectUrl: typedToken.redirectUrl,
        source: typedToken.source,
      });
      return typedToken;
    },

    async session({ session, token }) {
      const typedToken = token as ExtendedUserJWT;
      const typedSession = session as ExtendedSession;

      console.log("[Session Callback] Triggered.", { tokenId: typedToken.id, tokenEmail: typedToken.email });

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
                typedSession.user.questionnaireResponses = typedToken.questionnaireResponses;
        typedSession.user.questionnaireCompleted = typedToken.questionnaireCompleted;

        typedSession.user.source = typedToken.source; // Pass source to session
        typedSession.user.addedByMatchmakerId = typedToken.addedByMatchmakerId; // Pass to session
        typedSession.user.termsAndPrivacyAcceptedAt = typedToken.termsAndPrivacyAcceptedAt; // <--- הוספה

        typedSession.user.profile = typedToken.profile; 
        typedSession.user.images = typedToken.images; 
        typedSession.user.questionnaireResponses = typedToken.questionnaireResponses; 
        typedSession.user.questionnaireCompleted = typedToken.questionnaireCompleted;

        typedSession.user.lastLogin = typedToken.lastLogin;
        typedSession.user.createdAt = typedToken.createdAt;
        typedSession.user.updatedAt = typedToken.updatedAt;

        typedSession.requiresCompletion = typedToken.requiresCompletion;
        typedSession.redirectUrl = typedToken.redirectUrl;
        typedSession.newlyCreated = typedToken.newlyCreated;

      } else {
          console.warn("[Session Callback] Token ID or session.user missing. Session might be incomplete.");
      }
      console.log("[Session Callback] Populated session:", { 
        userId: typedSession.user?.id,
        email: typedSession.user?.email, 
        requiresCompletion: typedSession.requiresCompletion, 
        source: typedSession.user?.source,
      });
      return typedSession;
    },


    async redirect(params: { url: string; baseUrl: string; token?: unknown }) { 
      const { url, baseUrl, token: unknownToken } = params; 
      const typedToken = unknownToken as ExtendedUserJWT | undefined; 

      console.log("[Redirect Callback] Triggered.", {
          url,
          baseUrl,
          tokenId: typedToken?.id, 
          tokenEmail: typedToken?.email,
          tokenRequiresCompletion: typedToken?.requiresCompletion,
          tokenRedirectUrl: typedToken?.redirectUrl,
          isPhoneVerifiedInToken: typedToken?.isPhoneVerified
      });

      const defaultRedirectTarget = url.startsWith("/")
        ? `${baseUrl}${url}`
        : url.startsWith(baseUrl)
        ? url
        : baseUrl; 

      if (typedToken) {
        if (typedToken.redirectUrl) {
          const finalRedirectUrl = typedToken.redirectUrl.startsWith("/")
            ? `${baseUrl}${typedToken.redirectUrl}`
            : typedToken.redirectUrl;
          console.log(`[Redirect Callback] Using redirectUrl from token: ${typedToken.redirectUrl}. Final: ${finalRedirectUrl}`);
          return finalRedirectUrl;
        }

        if (typedToken.requiresCompletion) {
          const completionPage = `${baseUrl}/auth/register`;
          const allowedCompletionPaths = [
            completionPage,
            `${baseUrl}/auth/verify-phone`,
            `${baseUrl}/auth/update-phone`,
          ];
          
          const isApiCall = url.startsWith(`${baseUrl}/api/`);
          const isNextAuthInternal = url.includes("/api/auth/");
          const isOnAllowedPath = allowedCompletionPaths.some(p => url.startsWith(p));

          if (!isOnAllowedPath && !isApiCall && !isNextAuthInternal && !url.startsWith(completionPage)) {
            console.log(`[Redirect Callback] User requires completion. Current URL: ${url}. Redirecting to ${completionPage}`);
            return completionPage;
          }
          console.log(`[Redirect Callback] User requires completion, but current URL ${url} is allowed or is the target.`);
        }
        
        if ((url === `${baseUrl}/auth/signin` || url === baseUrl || url === `${baseUrl}/`) && !typedToken.requiresCompletion) {
            const loggedInDefault = typedToken.role === UserRole.MATCHMAKER || typedToken.role === UserRole.ADMIN ? `${baseUrl}/dashboard` : `${baseUrl}/profile`;
            console.log(`[Redirect Callback] Authenticated user on sign-in/base page. Redirecting to ${loggedInDefault}`);
            return loggedInDefault;
        }
      } else {
          console.log("[Redirect Callback] No token present. Defaulting to original URL or baseUrl.");
      }
      
      console.log(`[Redirect Callback] No overriding conditions met or no token. Returning default target: ${defaultRedirectTarget}`);
      return defaultRedirectTarget;
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