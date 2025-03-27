import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import { UserRole, UserStatus } from "@prisma/client";

// מרחיב את הסוגים כדי לאפשר שמירת מידע נוסף בתהליך האימות
declare module "next-auth" {
  interface User {
    redirectUrl?: string;
    newlyCreated?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development", // הוספת מצב דיבאג בפיתוח
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        const now = new Date();
        return {
          id: profile.sub,
          email: profile.email,
          firstName: profile.given_name,
          lastName: profile.family_name,
          name: profile.name,
          image: profile.picture,
          role: UserRole.CANDIDATE, // התפקיד כברירת מחדל
          status: UserStatus.ACTIVE, // נעשה אקטיבי ישירות כי מאומת על ידי גוגל
          isVerified: true, // כבר מאומת על ידי גוגל
          lastLogin: now,
          createdAt: now,
          updatedAt: now,
          profile: null, // יווצר מאוחר יותר בתהליך השלמת הרישום
          images: [],
          questionnaireResponses: []
        };
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
    async signIn({ user, account, profile }) {
      console.log("signIn callback", { user, account, profile });
      
      if (account?.provider === "google") {
        // בדיקה אם המשתמש קיים במערכת
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
          include: { profile: true }
        });

        if (!existingUser) {
          // יצירת משתמש חדש אם לא קיים
          try {
            console.log("Creating new user from Google auth", { email: user.email });
            
            // יצירת משתמש חדש
            const newUser = await prisma.user.create({
              data: {
                email: user.email!,
                password: "", // אין צורך בסיסמה למשתמשים מגוגל
                firstName: user.firstName || user.name?.split(' ')[0] || "",
                lastName: user.lastName || user.name?.split(' ').slice(1).join(' ') || "",
                role: UserRole.CANDIDATE,
                status: UserStatus.ACTIVE,
                isVerified: true
              }
            });
            console.log("New user created", { userId: newUser.id });
            
            // יצירת רשומת Account שמקשרת את המשתמש לחשבון Google
            await prisma.account.create({
              data: {
                userId: newUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token
              }
            });
            console.log("Google account linked to user", { userId: newUser.id });
            
            // הוספת מידע למשתמש שיסייע לזהות אותו בהמשך
            user.redirectUrl = '/auth/complete-registration';
            user.newlyCreated = true;
            user.id = newUser.id; // חשוב! מוודא שה-ID הנכון משמש
            
            return true; // החזרת true במקום URL כדי לאפשר לתהליך האימות להמשיך
          } catch (error) {
            console.error("Error creating new user from Google auth", error);
            return false;
          }
        } else if (!existingUser.profile) {
          // משתמש קיים אבל אין לו פרופיל - צריך להשלים רישום
          console.log("Existing user without profile", { userId: existingUser.id });
          
          // בדיקה אם יש כבר רשומת Account שמקשרת את המשתמש לחשבון Google
          const existingAccount = await prisma.account.findFirst({
            where: {
              userId: existingUser.id,
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          });
          
          // אם אין רשומת Account, יוצר אותה
          if (!existingAccount) {
            try {
              await prisma.account.create({
                data: {
                  userId: existingUser.id,
                  type: account.type,
                  provider: account.provider,
                  providerAccountId: account.providerAccountId,
                  access_token: account.access_token,
                  expires_at: account.expires_at,
                  token_type: account.token_type,
                  scope: account.scope,
                  id_token: account.id_token
                }
              });
              console.log("Google account linked to existing user", { userId: existingUser.id });
            } catch (error) {
              console.error("Error linking Google account to existing user", error);
            }
          }
          
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { lastLogin: new Date() }
          });
          
          // הוספת מידע למשתמש שיסייע לזהות אותו בהמשך
          user.redirectUrl = '/auth/complete-registration';
          user.id = existingUser.id; // וידוא שה-ID נשמר
          
          return true; // החזרת true במקום URL
        }
        
        // משתמש קיים עם פרופיל - התחברות רגילה
        console.log("Existing user with profile", { userId: existingUser.id });
        
        // בדיקה אם יש כבר רשומת Account שמקשרת את המשתמש לחשבון Google
        const existingAccount = await prisma.account.findFirst({
          where: {
            userId: existingUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId
          }
        });
        
        // אם אין רשומת Account, יוצר אותה
        if (!existingAccount) {
          try {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token
              }
            });
            console.log("Google account linked to existing user with profile", { userId: existingUser.id });
          } catch (error) {
            console.error("Error linking Google account to existing user with profile", error);
          }
        }
        
        await prisma.user.update({
          where: { id: existingUser.id },
          data: { lastLogin: new Date() }
        });
      }
      
      return true;
    },

    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // עדכון הטוקן כאשר יש התחברות חדשה
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.name = user.name || `${user.firstName} ${user.lastName}`;
        token.picture = user.image || null;
        token.role = user.role;
        token.status = user.status;
        token.isVerified = user.isVerified;
        token.lastLogin = user.lastLogin || new Date();
        token.createdAt = user.createdAt || new Date();
        token.updatedAt = user.updatedAt || new Date();
        token.profile = user.profile || null;
        token.images = user.images || [];
        token.questionnaireResponses = user.questionnaireResponses || [];
        
        // שמירת מידע נוסף בטוקן
        if (user.redirectUrl) {
          token.redirectUrl = user.redirectUrl;
        }
        
        if (user.newlyCreated) {
          token.newlyCreated = true;
        }
        
        // הוספת לוג לדיבאג
        console.log("JWT callback - user data:", { 
          id: token.id,
          email: token.email,
          firstName: token.firstName,
          lastName: token.lastName,
          role: token.role,
          redirectUrl: user.redirectUrl
        });
      }

      // עדכון הפרופיל אם נדרש
      if (trigger === "update" && session) {
        token = { ...token, ...session };
        console.log("JWT updated from session");
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.email = token.email as string;
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
        
        // העברת מידע נוסף לסשן
        if (token.redirectUrl) {
          session.redirectUrl = token.redirectUrl;
        }
        
        if (token.newlyCreated) {
          session.newlyCreated = true;
        }
        
        // הוספת לוג לדיבאג
        console.log("Session callback - user data:", { 
          id: session.user.id,
          email: session.user.email,
          role: session.user.role,
          profile: session.user.profile ? "exists" : "null",
          redirectUrl: session.redirectUrl
        });
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log("Redirect callback", { url, baseUrl });
      
      // שימוש ב-request כדי לקבל את הסשן הנוכחי
      // קוד זה יפעל רק אם יש גישה לאובייקט request, אחרת צריך להשתמש בגישה אחרת
      try {
        // קבלת מידע מהסשן
        const session = await fetch(`${baseUrl}/api/auth/session`).then(res => res.json());
        
        if (session && session.redirectUrl) {
          console.log("Using redirectUrl from session:", session.redirectUrl);
          const customRedirect = session.redirectUrl;
          if (customRedirect.startsWith("/")) {
            return `${baseUrl}${customRedirect}`;
          }
          return customRedirect;
        }
      } catch (error) {
        console.error("Error getting session in redirect callback:", error);
      }
      
      // בדיקה למשתמשים חדשים שנרשמו עם גוגל - הפניה לדף השלמת הרישום
      if (url.includes("auth/callback/google")) {
        console.log("Google auth callback detected, redirecting to complete registration");
        return `${baseUrl}/auth/complete-registration`;
      }
      
      // אם זה URL מקומי (יחסי), הוסף את baseUrl
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } 
      // אם זה URL מלא שמתחיל עם baseUrl, אפשר להשתמש בו
      else if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // אחרת, החזר לדף הבית
      return baseUrl;
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