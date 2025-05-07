import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import prisma from "./prisma";
import { compare } from "bcryptjs";
import type { JWT } from "next-auth/jwt";
import { UserRole, UserStatus } from "@prisma/client";

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
          status: UserStatus.PENDING_PHONE_VERIFICATION,
          isVerified: true, // כבר מאומת על ידי גוגל
          isProfileComplete: false, // ברירת מחדל, יתעדכן לאחר השלמת הרישום
          isPhoneVerified: false, // טלפון לא מאומת
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
          // You might want to return null instead of throwing an error
          // for a slightly smoother UX, letting NextAuth handle it.
          // Or keep throwing if you prefer explicit errors.
          // return null; 
          throw new Error("Missing email or password");
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

        // Check if user exists *and* has a password set
        if (!user || !user.password) {
          // User not found OR user exists but has no password (likely OAuth user)
          // Returning null signals failed authentication to NextAuth
          console.log(`Authentication failed for ${credentials.email}: User not found or password not set.`);
          return null; 
          // Or throw a more specific error:
          // throw new Error("Invalid credentials or login method."); 
        }

        // --- Now TypeScript knows user.password is a string here ---
        const isPasswordValid = await compare(credentials.password, user.password); 
        
        if (!isPasswordValid) {
          console.log(`Authentication failed for ${credentials.email}: Invalid password.`);
          // Returning null signals failed authentication
          return null;
          // Or throw:
          // throw new Error("Invalid password");
        }

        console.log(`Authentication successful for ${credentials.email}`);

        // User authenticated successfully, update last login and return user data
        const mainImage = user.images.find(img => img.isMain);

        // Update lastLogin asynchronously, no need to wait for it
        prisma.user.update({
          where: { id: user.id },
          data: { lastLogin: new Date() }
        }).catch(err => console.error("Failed to update lastLogin:", err)); // Log error if update fails

        // Return the user object expected by NextAuth
        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          image: mainImage?.url || null, // Keep null if no main image
          role: user.role,
          status: user.status,
          isVerified: user.isVerified,
          isProfileComplete: user.isProfileComplete,
          // Pass these through if needed by session/jwt callbacks
          isPhoneVerified: user.isPhoneVerified, 
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
                isVerified: true,
                isProfileComplete: false,
                isPhoneVerified: false,

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
            user.isProfileComplete = false;
            user.isPhoneVerified = false;

            return true; // החזרת true במקום URL כדי לאפשר לתהליך האימות להמשיך
          } catch (error) {
            console.error("Error creating new user from Google auth", error);
            return false;
          }
        } else if (!existingUser.profile || !existingUser.isProfileComplete) {
          // משתמש קיים אבל אין לו פרופיל או הפרופיל לא הושלם - צריך להשלים רישום
          console.log("Existing user without complete profile", { userId: existingUser.id });
          
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
          user.isProfileComplete = existingUser.isProfileComplete || false;
           user.isPhoneVerified = existingUser.isPhoneVerified;
         
           // אם הטלפון לא אומת, נסמן שנדרשת פעולה
           if (!existingUser.isPhoneVerified) {
              user.requiresCompletion = true; // דגל שמציין צורך בפעולה (אימות טלפון/השלמה)
            }
           return true; // החזרת true במקום URL
        }
        
        // משתמש קיים עם פרופיל מלא - התחברות רגילה
        console.log("Existing user with complete profile", { userId: existingUser.id });
        
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
        
        // הגדרת המשתמש כמי שהשלים את הפרופיל
        user.id = existingUser.id;
        user.isProfileComplete = existingUser.isProfileComplete || false;
        
        // אם הפרופיל הושלם, הפנייה לדף הפרופיל
        if (existingUser.isProfileComplete) {
          user.redirectUrl = '/profile';
        }
      }
      
      return true;
    },

    async jwt({ token, user, trigger, session }): Promise<JWT> {
      // 1. При начальном входе или если есть объект 'user'
      if (user) {
        token.id = user.id;
        token.email = user.email as string;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.name = user.name || `${user.firstName} ${user.lastName}`;
        token.picture = user.image || null;
        token.role = user.role;
        token.status = user.status;
        token.isVerified = user.isVerified; // Email verification from initial login
        token.isProfileComplete = user.isProfileComplete || false;
        token.isPhoneVerified = user.isPhoneVerified;
        token.lastLogin = user.lastLogin || new Date();
        token.createdAt = user.createdAt || new Date();
        token.updatedAt = user.updatedAt || new Date();
        token.profile = user.profile || null;
        token.images = user.images || [];
        token.questionnaireResponses = user.questionnaireResponses || [];
        token.requiresCompletion = 'requiresCompletion' in user ? user.requiresCompletion as boolean | undefined : !user.isPhoneVerified;
    
        if (user.redirectUrl) token.redirectUrl = user.redirectUrl;
        if (user.newlyCreated) token.newlyCreated = true;
    
        console.log("JWT callback - initial user data from 'user' object:", { /* ... token fields ... */ });
      }
    
      // 2. При вызове updateSession() (trigger === "update")
      // ИЛИ если токен существует, но некоторые поля могут нуждаться в обновлении (например, isVerified)
      if (trigger === "update" || (token.id && typeof token.isVerified === 'undefined')) { // Добавлено условие для обновления при необходимости
        console.log(`JWT callback - trigger is '${trigger}'. Attempting to refresh token data for user ID: ${token.id}`);
        
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          include: {
            profile: true,
            images: { where: { isMain: true }, take: 1 }, // Только основное изображение
            questionnaireResponses: { orderBy: { createdAt: 'desc' }, take: 1 }
          }
        });
    
        if (dbUser) {
          console.log("JWT callback - Fetched updated user data from DB:", {
            isVerified: dbUser.isVerified,
            isProfileComplete: dbUser.isProfileComplete,
            isPhoneVerified: dbUser.isPhoneVerified,
            status: dbUser.status
          });
    
          token.firstName = dbUser.firstName;
          token.lastName = dbUser.lastName;
          token.name = `${dbUser.firstName} ${dbUser.lastName}`;
          token.picture = dbUser.images?.[0]?.url || null; // Обновляем изображение
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.isVerified = dbUser.isVerified; // Critically update this
          token.isProfileComplete = dbUser.isProfileComplete;
          token.isPhoneVerified = dbUser.isPhoneVerified;
          token.profile = dbUser.profile; // Обновляем профиль
          token.questionnaireResponses = dbUser.questionnaireResponses; // Обновляем анкеты
          token.requiresCompletion = !dbUser.isPhoneVerified; // Пересчитываем на основе свежих данных
    
          // Если session был передан в updateSession (например, update({ name: "New Name" }))
          // то сольем эти изменения. Если session не был передан, эта часть не выполнится.
          if (session) {
            token = { ...token, ...session };
            console.log("JWT callback - Merged with explicit session data provided to update()", session);
          }
        } else {
          console.warn(`JWT callback - User with ID ${token.id} not found in DB during update. Invalidating token might be an option.`);
          // Можно рассмотреть вариант инвалидации токена, если пользователь удален
          // return null; // или вернуть старый токен
        }
      }
      
      // Логирование перед возвратом токена
      console.log("JWT callback - returning token:", { 
          id: token.id,
          email: token.email,
          isVerified: token.isVerified, 
          isProfileComplete: token.isProfileComplete, 
          isPhoneVerified: token.isPhoneVerified,
          requiresCompletion: token.requiresCompletion
      });
    
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
        session.user.isProfileComplete = token.isProfileComplete;
        session.user.isPhoneVerified = token.isPhoneVerified; // העברת הסטטוס לסשן
        session.requiresCompletion = token.requiresCompletion;
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
          isProfileComplete: session.user.isProfileComplete,
          isPhoneVerified: session.user.isPhoneVerified,
        requiresCompletion: session.requiresCompletion,
          redirectUrl: session.redirectUrl
        });
      }
      return session;
    },

    async redirect(params: { url: string; baseUrl: string; token?: JWT }) { // <-- הוספת הגדרת טיפוס מפורשת
      const { url, baseUrl, token } = params; // <-- פירוק המשתנים מתוך params
      console.log("Redirect callback initiated", { url, baseUrl, tokenExists: !!token });
  
      // --- Priority 1: Redirect for Phone Verification/Profile Completion ---
      // If the token exists and indicates phone verification is needed
      if (token && !token.isPhoneVerified) {
          // Check if the user is already trying to access an allowed verification/completion path
          const verificationPaths = [
              '/auth/register',
              '/auth/verify-phone',
              '/auth/update-phone',
              // Add relevant API paths if needed, although API calls shouldn't trigger redirect directly
          ];
          const isAlreadyOnAllowedPath = verificationPaths.some(p => url.startsWith(baseUrl + p));
  
          if (!isAlreadyOnAllowedPath) {
              console.log(`Redirect callback: Token exists, phone not verified. Redirecting to /auth/register.`);
              // Always redirect to the start of the completion/verification flow
              return `${baseUrl}/auth/register`;
          } else {
               console.log(`Redirect callback: Token exists, phone not verified, but already on allowed path: ${url}`);
               // Allow staying on the current allowed path
               return url;
          }
      }
      // --- End Priority 1 ---
  
  
      // --- Priority 2: Default NextAuth behavior (intended URL or base URL) ---
      // This part runs only if token exists AND phone IS verified, or if no token exists (public access)
  
      // If signing in or signing up (url might be the callback url)
      // Let the middleware handle access control after this initial redirect.
      // If the original requested URL (before OAuth) was stored somewhere, redirect there.
      // Otherwise, fall back.
  
      // Check if the URL is relative (starts with '/')
      if (url.startsWith("/")) {
        console.log(`Redirect callback: Relative URL detected. Returning: ${baseUrl}${url}`);
        return `${baseUrl}${url}`;
      }
      // Check if the URL is already absolute and starts with the baseUrl
      else if (url.startsWith(baseUrl)) {
        console.log(`Redirect callback: Absolute URL matches baseUrl. Returning: ${url}`);
        return url;
      }
      // Fallback for other cases (e.g., OAuth callbacks returning to baseUrl)
      console.log(`Redirect callback: Fallback. Redirecting to baseUrl: ${baseUrl}`);
      return baseUrl; // Default redirect to home page after successful login IF phone is verified
    }
  },

  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    newUser: '/auth/register',
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