// lib/auth.ts

import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions, Profile as OAuthProfile } from "next-auth"; // OAuthProfile מיובא
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import type { User, JWT as ExtendedUserJWT, User as ExtendedUser, Session as ExtendedSession } from "@/types/next-auth"; // ודא שהנתיב נכון
import { UserRole, UserStatus } from "@prisma/client";

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
    
        const userForAdapter: User = {
          id: profile.sub, // Temporary ID for TypeScript; Prisma will generate a new cuid()
          email: profile.email,
          firstName: profile.given_name || profile.name?.split(' ')[0] || "",
          lastName: profile.family_name || profile.name?.split(' ').slice(1).join(' ') || "",
          name: profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim(),
          password: null, // OAuth users don't have a password
          phone: null, // Not provided by Google
          image: profile.picture || null,
          role: UserRole.CANDIDATE,
          status: UserStatus.PENDING_PHONE_VERIFICATION,
          isVerified: !!profile.email_verified,
          isProfileComplete: false,
          isPhoneVerified: false,
          lastLogin: null, // Set on first sign-in
          createdAt: now, // Approximate, will be set by Prisma
          updatedAt: now, // Approximate, will be set by Prisma
          profile: null, // No profile yet
          images: [], // No images yet
          questionnaireResponses: [], // No responses yet
          redirectUrl: undefined,
          newlyCreated: true, // Mark as new for registration flow
          requiresCompletion: true, // Needs to complete profile
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
          include: {
            profile: true,
            images: { where: { isMain: true }, take: 1 },
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });

        if (!user || !user.password) {
          console.log(`[CredentialsProvider Authorize] User ${credentials.email} not found or password not set.`);
          return null;
        }

        const isPasswordValid = await compare(credentials.password, user.password);
        if (!isPasswordValid) {
          console.log(`[CredentialsProvider Authorize] Invalid password for ${credentials.email}.`);
          return null;
        }

        console.log(`[CredentialsProvider Authorize] Authentication successful for ${credentials.email}`);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        }).catch(err => console.error("[CredentialsProvider Authorize] Failed to update lastLogin:", err));

        return user as any;
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

        const user = await prisma.user.findUnique({
          where: { id: tokenRecord.userId },
          include: {
            profile: true,
            images: { where: { isMain: true }, take: 1 },
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });

        if (!user) {
          console.log("[AutoLoginProvider Authorize] User not found for the given authToken.");
          return null;
        }
        console.log(`[AutoLoginProvider Authorize] Auto-login successful for user ${user.email}`);
        return user as any;
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
    
      // Use providerAccountId for Google accounts, as user.id may not be set yet
      const userId = account?.provider === 'google' ? account.providerAccountId : typedUser.id;
      if (!userId) {
        console.error("[signIn Callback] Critical: No user ID or providerAccountId available.", { user, account });
        return false;
      }
    
      let dbUser = await prisma.user.findUnique({
        where: { email: typedUser.email.toLowerCase() },
      });
    
      // If no user exists, ensure the adapter created one
      if (!dbUser && account?.provider === 'google') {
        try {
          dbUser = await prisma.user.create({
            data: {
              email: typedUser.email.toLowerCase(),
              firstName: typedUser.firstName,
              lastName: typedUser.lastName,
              role: UserRole.CANDIDATE,
              status: UserStatus.PENDING_PHONE_VERIFICATION,
              isVerified: !!oauthProfile?.email_verified,
              isProfileComplete: false,
              isPhoneVerified: false,
            },
          });
          // Link the Google account
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: 'oauth',
              provider: 'google',
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          });
          console.log(`[signIn Callback] Created new user and linked Google account for ${dbUser.email}`);
        } catch (error) {
          console.error("[signIn Callback] Failed to create user or account:", error);
          return false;
        }
      }
    
      if (!dbUser) {
        console.error(`[signIn Callback] User with email ${typedUser.email} not found and could not be created.`);
        return false;
      }
    
      typedUser.email = dbUser.email;
      typedUser.firstName = dbUser.firstName;
      typedUser.lastName = dbUser.lastName;
      typedUser.role = dbUser.role;
      typedUser.status = dbUser.status;
      typedUser.isVerified = dbUser.isVerified;
      typedUser.isProfileComplete = dbUser.isProfileComplete;
      typedUser.isPhoneVerified = dbUser.isPhoneVerified;
    
      if (account?.provider === "google") {
        if (dbUser.isVerified === false && oauthProfile?.email_verified === true) {
          console.log(`[signIn Callback] Google User ${dbUser.email} was not email-verified, but Google says it is. Updating DB.`);
          await prisma.user.update({
            where: { id: dbUser.id },
            data: { isVerified: true, status: UserStatus.PENDING_PHONE_VERIFICATION }
          });
          typedUser.isVerified = true;
          typedUser.status = UserStatus.PENDING_PHONE_VERIFICATION;
        }
      }
    
      await prisma.user.update({
        where: { id: dbUser.id },
        data: { lastLogin: new Date() }
      }).catch(err => console.error(`[signIn Callback] Failed to update lastLogin for user ${dbUser.id}:`, err));
    
      if (!dbUser.isProfileComplete || !dbUser.isPhoneVerified) {
        typedUser.redirectUrl = '/auth/register';
        typedUser.requiresCompletion = true;
        if ((dbUser.status === UserStatus.PENDING_PHONE_VERIFICATION || dbUser.status === UserStatus.PENDING_EMAIL_VERIFICATION) && !dbUser.isProfileComplete) {
          typedUser.newlyCreated = true;
          console.log(`[signIn Callback] User ${dbUser.email} marked as newlyCreated.`);
        }
      } else {
        typedUser.redirectUrl = '/profile';
        typedUser.requiresCompletion = false;
      }
    
      console.log("[signIn Callback] Processed user. Flags:", {
        userId: typedUser.id,
        email: typedUser.email,
        isProfileComplete: typedUser.isProfileComplete,
        isPhoneVerified: typedUser.isPhoneVerified,
        requiresCompletion: typedUser.requiresCompletion,
        newlyCreated: typedUser.newlyCreated,
        redirectUrl: typedUser.redirectUrl,
        status: typedUser.status
      });
      return true;
    },

    async jwt({ token, user, trigger, session, account }) {
      const typedToken = token as ExtendedUserJWT;
      const typedUser = user as ExtendedUser | undefined;

      console.log("[JWT Callback] Triggered.", {
          trigger,
          tokenEmail: typedToken.email,
          userEmail: typedUser?.email,
          isAccountPresent: !!account,
          isSessionPresent: !!session
      });

      if (typedUser) {
        typedToken.id = typedUser.id;
        typedToken.email = typedUser.email;
        typedToken.firstName = typedUser.firstName;
        typedToken.lastName = typedUser.lastName;
        typedToken.name = typedUser.name || `${typedUser.firstName} ${typedUser.lastName}`;
        typedToken.picture = typedUser.image || null;
        typedToken.role = typedUser.role;
        typedToken.status = typedUser.status;
        typedToken.isVerified = typedUser.isVerified;
        typedToken.isProfileComplete = typedUser.isProfileComplete || false;
        typedToken.isPhoneVerified = typedUser.isPhoneVerified || false;
        typedToken.requiresCompletion = typedUser.requiresCompletion;
        typedToken.redirectUrl = typedUser.redirectUrl;
        typedToken.newlyCreated = typedUser.newlyCreated;
        
        console.log("[JWT Callback - Initial Population] Token populated from user object:", {
            email: typedToken.email,
            status: typedToken.status,
            isPhoneVerified: typedToken.isPhoneVerified,
            isProfileComplete: typedToken.isProfileComplete,
            requiresCompletion: typedToken.requiresCompletion,
            redirectUrl: typedToken.redirectUrl
        });
      }
      
      if (typedToken.id && (trigger === "signIn" || trigger === "signUp" || trigger === "update" || !typedToken.profile)) {
          console.log(`[JWT Callback - DB Refresh] Refreshing token data for user ID: ${typedToken.id} due to trigger: ${trigger} or missing profile.`);
          const dbUserForJwt = await prisma.user.findUnique({
            where: { id: typedToken.id },
            include: {
              profile: true,
              images: { where: { isMain: true }, take: 1 },
              questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
            }
          });

          if (dbUserForJwt) {
            typedToken.firstName = dbUserForJwt.firstName;
            typedToken.lastName = dbUserForJwt.lastName;
            typedToken.name = `${dbUserForJwt.firstName} ${dbUserForJwt.lastName}`;
            typedToken.picture = dbUserForJwt.images?.[0]?.url || typedToken.picture;
            typedToken.role = dbUserForJwt.role;
            typedToken.status = dbUserForJwt.status;
            typedToken.isVerified = dbUserForJwt.isVerified;
            typedToken.isProfileComplete = dbUserForJwt.isProfileComplete;
            typedToken.isPhoneVerified = dbUserForJwt.isPhoneVerified;
            typedToken.profile = dbUserForJwt.profile as any;
            typedToken.images = dbUserForJwt.images as any[];
            typedToken.questionnaireResponses = dbUserForJwt.questionnaireResponses as any[];
            typedToken.lastLogin = dbUserForJwt.lastLogin;
            typedToken.createdAt = dbUserForJwt.createdAt;
            typedToken.updatedAt = dbUserForJwt.updatedAt;
            typedToken.requiresCompletion = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified);
            if (trigger !== "update" || !session) {
                typedToken.redirectUrl = typedToken.requiresCompletion ? '/auth/register' : '/profile';
            }
            console.log("[JWT Callback - DB Refresh] Token updated from DB:", {
                email: typedToken.email,
                status: typedToken.status,
                isPhoneVerified: typedToken.isPhoneVerified,
                isProfileComplete: typedToken.isProfileComplete,
                requiresCompletion: typedToken.requiresCompletion,
                redirectUrl: typedToken.redirectUrl
            });
          } else {
              console.warn(`[JWT Callback - DB Refresh] User with ID ${typedToken.id} not found in DB during refresh.`);
          }
      }
      
      if (trigger === "update" && session) {
        console.log("[JWT Callback - Client Update] Merging session data into token:", session);
        const sessionUser = (session as ExtendedSession)?.user;
        if(sessionUser) {
          // Example: if (sessionUser.firstName) typedToken.firstName = sessionUser.firstName;
        }
      }
      console.log("[JWT Callback] Returning final token:", { email: typedToken.email, isPhoneVerified: typedToken.isPhoneVerified, status: typedToken.status, requiresCompletion: typedToken.requiresCompletion });
      return typedToken;
    },

    async session({ session, token }) {
      const typedToken = token as ExtendedUserJWT;
      const typedSession = session as ExtendedSession;

      console.log("[Session Callback] Triggered.", { tokenEmail: typedToken.email });

      if (typedSession.user && typedToken.id) {
        typedSession.user.id = typedToken.id;
        typedSession.user.email = typedToken.email;
        typedSession.user.firstName = typedToken.firstName;
        typedSession.user.lastName = typedToken.lastName;
        typedSession.user.name = typedToken.name;
        typedSession.user.image = typedToken.picture;
        typedSession.user.role = typedToken.role;
        typedSession.user.status = typedToken.status;
        typedSession.user.isVerified = typedToken.isVerified;
        typedSession.user.isProfileComplete = typedToken.isProfileComplete;
        typedSession.user.isPhoneVerified = typedToken.isPhoneVerified;
        typedSession.requiresCompletion = typedToken.requiresCompletion;
        typedSession.redirectUrl = typedToken.redirectUrl;
        typedSession.newlyCreated = typedToken.newlyCreated;
        typedSession.user.profile = typedToken.profile as any;
        typedSession.user.images = typedToken.images as any[];
        typedSession.user.questionnaireResponses = typedToken.questionnaireResponses as any[];
        typedSession.user.lastLogin = typedToken.lastLogin;
        typedSession.user.createdAt = typedToken.createdAt;
        typedSession.user.updatedAt = typedToken.updatedAt;
      } else {
          console.warn("[Session Callback] Token ID or session.user missing. Session might be incomplete.");
      }
      console.log("[Session Callback] Populated session:", { email: typedSession.user?.email, requiresCompletion: typedSession.requiresCompletion, redirectUrl: typedSession.redirectUrl, isPhoneVerified: typedSession.user?.isPhoneVerified });
      return typedSession;
    },

    async redirect({ url, baseUrl, token }: { url: string; baseUrl: string; token?: ExtendedUserJWT }) {
      const typedToken = token;
      console.log("[Redirect Callback] Triggered.", {
          url,
          baseUrl,
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
            `${baseUrl}/auth/register`,
            `${baseUrl}/auth/verify-phone`,
            `${baseUrl}/auth/update-phone`,
          ];
          const isOnAllowedPath = allowedCompletionPaths.some(p => url.startsWith(p)) || url.includes("/api/auth/");

          if (url !== completionPage && !isOnAllowedPath) {
            console.log(`[Redirect Callback] User requires completion. Current URL: ${url}. Redirecting to ${completionPage}`);
            return completionPage;
          }
           console.log(`[Redirect Callback] User requires completion, but is already on an allowed path or target: ${url}`);
        }
      } else {
          console.log("[Redirect Callback] No token present. Defaulting to URL or baseUrl.");
      }
      
      console.log(`[Redirect Callback] No overriding conditions met. Returning default target: ${defaultRedirectTarget}`);
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