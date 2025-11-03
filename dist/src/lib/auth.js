"use strict";
// lib/auth.ts
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const prisma_adapter_1 = require("@next-auth/prisma-adapter");
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const google_1 = __importDefault(require("next-auth/providers/google"));
const prisma_1 = __importDefault(require("./prisma"));
const bcryptjs_1 = require("bcryptjs");
const client_1 = require("@prisma/client");
console.log("Auth options file loaded");
exports.authOptions = {
    adapter: (0, prisma_adapter_1.PrismaAdapter)(prisma_1.default),
    debug: process.env.NODE_ENV === "development",
    providers: [
        (0, google_1.default)({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code",
                },
            },
            profile(profile, tokens) {
                var _a, _b;
                const now = new Date();
                console.log("[GoogleProvider Profile Fn] Raw profile from Google:", profile);
                console.log("[GoogleProvider Profile Fn] Tokens from Google:", tokens);
                if (!profile.email) {
                    throw new Error("Email not found in Google profile");
                }
                if (!profile.sub) {
                    throw new Error("Sub (Google User ID) not found in Google profile");
                }
                const firstName = profile.given_name || ((_a = profile.name) === null || _a === void 0 ? void 0 : _a.split(' ')[0]) || "";
                const lastName = profile.family_name || ((_b = profile.name) === null || _b === void 0 ? void 0 : _b.split(' ').slice(1).join(' ')) || "";
                const userForAdapter = {
                    id: profile.sub,
                    email: profile.email.toLowerCase(),
                    firstName: firstName,
                    lastName: lastName,
                    name: profile.name || `${firstName} ${lastName}`.trim(),
                    phone: null,
                    image: profile.picture || null,
                    role: client_1.UserRole.CANDIDATE,
                    status: client_1.UserStatus.PENDING_PHONE_VERIFICATION,
                    isVerified: !!profile.email_verified,
                    isProfileComplete: false,
                    isPhoneVerified: false,
                    lastLogin: null,
                    createdAt: now,
                    updatedAt: now,
                    source: client_1.UserSource.REGISTRATION,
                    addedByMatchmakerId: null,
                    termsAndPrivacyAcceptedAt: null,
                    profile: null,
                    images: [],
                    questionnaireResponses: [],
                    language: client_1.Language.he,
                    questionnaireCompleted: false,
                    redirectUrl: undefined,
                    newlyCreated: true,
                    requiresCompletion: true,
                };
                console.log("[GoogleProvider Profile Fn] User object for adapter:", userForAdapter);
                return userForAdapter;
            }
        }),
        (0, credentials_1.default)({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                var _a;
                console.log("[CredentialsProvider Authorize] Attempting login for:", credentials === null || credentials === void 0 ? void 0 : credentials.email);
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.email) || !(credentials === null || credentials === void 0 ? void 0 : credentials.password)) {
                    console.error("[CredentialsProvider Authorize] Missing email or password");
                    return null;
                }
                const userFromDb = await prisma_1.default.user.findUnique({
                    where: { email: credentials.email.toLowerCase() },
                    include: {
                        images: { where: { isMain: true }, take: 1 },
                    }
                });
                if (!userFromDb || !userFromDb.password) {
                    console.log(`[CredentialsProvider Authorize] User ${credentials.email} not found or password not set.`);
                    return null;
                }
                const isPasswordValid = await (0, bcryptjs_1.compare)(credentials.password, userFromDb.password);
                if (!isPasswordValid) {
                    console.log(`[CredentialsProvider Authorize] Invalid password for ${credentials.email}.`);
                    return null;
                }
                console.log(`[CredentialsProvider Authorize] Authentication successful for ${credentials.email}`);
                await prisma_1.default.user.update({
                    where: { id: userFromDb.id },
                    data: { lastLogin: new Date() }
                }).catch(err => console.error("[CredentialsProvider Authorize] Failed to update lastLogin:", err));
                const { images } = userFromDb, restOfUser = __rest(userFromDb, ["images"]);
                return Object.assign(Object.assign({}, restOfUser), { name: `${userFromDb.firstName} ${userFromDb.lastName}`, image: ((_a = images === null || images === void 0 ? void 0 : images[0]) === null || _a === void 0 ? void 0 : _a.url) || null, profile: null, images: [], questionnaireResponses: [], questionnaireCompleted: false, source: userFromDb.source, addedByMatchmakerId: userFromDb.addedByMatchmakerId, termsAndPrivacyAcceptedAt: userFromDb.termsAndPrivacyAcceptedAt });
            }
        }),
        (0, credentials_1.default)({
            id: "email-verified-autologin",
            name: "Email Verified AutoLogin",
            credentials: {
                authToken: { label: "Auth Token", type: "text" },
            },
            async authorize(credentials) {
                var _a;
                console.log("[AutoLoginProvider Authorize] Attempting auto-login with token:", (credentials === null || credentials === void 0 ? void 0 : credentials.authToken) ? "Token Present" : "No Token");
                if (!(credentials === null || credentials === void 0 ? void 0 : credentials.authToken)) {
                    console.error("[AutoLoginProvider Authorize] No authToken provided.");
                    return null;
                }
                const tokenRecord = await prisma_1.default.oneTimeAuthToken.findUnique({
                    where: { token: credentials.authToken },
                });
                if (!tokenRecord) {
                    console.log("[AutoLoginProvider Authorize] AuthToken not found in DB.");
                    return null;
                }
                if (new Date() > tokenRecord.expiresAt) {
                    console.log("[AutoLoginProvider Authorize] AuthToken expired. Deleting token.");
                    await prisma_1.default.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } }).catch(err => console.error("[AutoLoginProvider Authorize] Error deleting expired token:", err));
                    return null;
                }
                console.log("[AutoLoginProvider Authorize] AuthToken valid. Deleting token.");
                await prisma_1.default.oneTimeAuthToken.delete({ where: { id: tokenRecord.id } }).catch(err => console.error("[AutoLoginProvider Authorize] Error deleting used token:", err));
                const userFromDb = await prisma_1.default.user.findUnique({
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
                const { images } = userFromDb, restOfUser = __rest(userFromDb, ["images"]);
                return Object.assign(Object.assign({}, restOfUser), { name: `${userFromDb.firstName} ${userFromDb.lastName}`, image: ((_a = images === null || images === void 0 ? void 0 : images[0]) === null || _a === void 0 ? void 0 : _a.url) || null, profile: null, images: [], questionnaireResponses: [], language: userFromDb.language || client_1.Language.he, questionnaireCompleted: false, source: userFromDb.source, addedByMatchmakerId: userFromDb.addedByMatchmakerId, termsAndPrivacyAcceptedAt: userFromDb.termsAndPrivacyAcceptedAt });
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account, profile }) {
            var _a, _b, _c;
            const typedUser = user;
            const oauthProfile = profile;
            console.log("[signIn Callback] Triggered.", {
                userId: typedUser.id,
                userEmail: typedUser.email,
                accountProvider: account === null || account === void 0 ? void 0 : account.provider,
                isUserVerifiedByProvider: oauthProfile === null || oauthProfile === void 0 ? void 0 : oauthProfile.email_verified,
                accountId: account === null || account === void 0 ? void 0 : account.providerAccountId
            });
            const userEmail = (_a = typedUser.email) === null || _a === void 0 ? void 0 : _a.toLowerCase();
            if (!userEmail) {
                console.error("[signIn Callback] Critical: No user email available.", { user, account });
                return false;
            }
            let dbUser = await prisma_1.default.user.findUnique({
                where: { email: userEmail },
            });
            if (!dbUser && (account === null || account === void 0 ? void 0 : account.provider) === 'google') {
                console.log(`[signIn Callback] Google sign-in for potentially new user: ${userEmail}.`);
                dbUser = await prisma_1.default.user.findUnique({
                    where: { email: userEmail }
                });
                if (!dbUser) {
                    try {
                        console.log(`[signIn Callback] User ${userEmail} not found. Attempting to create.`);
                        const createdDbUser = await prisma_1.default.user.create({
                            data: {
                                email: userEmail,
                                firstName: typedUser.firstName || "",
                                lastName: typedUser.lastName || "",
                                role: typedUser.role || client_1.UserRole.CANDIDATE,
                                status: typedUser.status || client_1.UserStatus.PENDING_PHONE_VERIFICATION,
                                isVerified: typedUser.isVerified === undefined ? (!!(oauthProfile === null || oauthProfile === void 0 ? void 0 : oauthProfile.email_verified)) : typedUser.isVerified,
                                isProfileComplete: typedUser.isProfileComplete || false,
                                isPhoneVerified: typedUser.isPhoneVerified || false,
                                source: client_1.UserSource.REGISTRATION,
                                language: client_1.Language.he,
                            },
                        });
                        dbUser = createdDbUser;
                        console.log(`[signIn Callback] Created new user ${dbUser.email} during signIn.`);
                        if (account && account.providerAccountId) {
                            const existingAccount = await prisma_1.default.account.findUnique({
                                where: { provider_providerAccountId: { provider: account.provider, providerAccountId: account.providerAccountId } }
                            });
                            if (!existingAccount) {
                                await prisma_1.default.account.create({
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
                    }
                    catch (error) {
                        console.error("[signIn Callback] Failed to create user or link account:", error);
                        if (typeof error === 'object' && error !== null && 'code' in error && 'meta' in error) {
                            const prismaError = error;
                            if (prismaError.code === 'P2002' && ((_c = (_b = prismaError.meta) === null || _b === void 0 ? void 0 : _b.target) === null || _c === void 0 ? void 0 : _c.includes('email'))) {
                                console.log("[signIn Callback] User likely created by adapter in parallel. Re-fetching.");
                                dbUser = await prisma_1.default.user.findUnique({ where: { email: userEmail } });
                                if (!dbUser) {
                                    console.error("[signIn Callback] Failed to re-fetch user after P2002 error.");
                                    return false;
                                }
                            }
                            else {
                                return false;
                            }
                        }
                        else {
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
            if ((account === null || account === void 0 ? void 0 : account.provider) === "google") {
                if (dbUser.isVerified === false && (oauthProfile === null || oauthProfile === void 0 ? void 0 : oauthProfile.email_verified) === true) {
                    console.log(`[signIn Callback] Google User ${dbUser.email} was not email-verified, but Google says it is. Updating DB.`);
                    const updatedUser = await prisma_1.default.user.update({
                        where: { id: dbUser.id },
                        data: { isVerified: true, status: client_1.UserStatus.PENDING_PHONE_VERIFICATION }
                    });
                    typedUser.isVerified = updatedUser.isVerified;
                    typedUser.status = updatedUser.status;
                }
            }
            await prisma_1.default.user.update({
                where: { id: dbUser.id },
                data: { lastLogin: new Date() }
            }).catch(err => console.error(`[signIn Callback] Failed to update lastLogin for user ${dbUser.id}:`, err));
            const requiresCompletion = !dbUser.isProfileComplete || !dbUser.isPhoneVerified || !dbUser.termsAndPrivacyAcceptedAt;
            typedUser.requiresCompletion = requiresCompletion;
            if (requiresCompletion) {
                typedUser.redirectUrl = '/auth/register';
            }
            else {
                typedUser.redirectUrl = '/profile';
            }
            console.log("[signIn Callback] Processed user. Flags:", {
                requiresCompletion: typedUser.requiresCompletion,
                redirectUrl: typedUser.redirectUrl,
            });
            return true;
        },
        async jwt({ token, user, trigger, session }) {
            var _a, _b, _c, _d, _e, _f;
            const typedToken = token;
            const typedUserFromCallback = user;
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
                const dbUserForJwt = await prisma_1.default.user.findUnique({
                    where: { id: typedToken.id },
                    include: {
                        images: { where: { isMain: true }, take: 1 },
                    }
                });
                if (dbUserForJwt) {
                    console.log('[JWT Callback] Found user in DB, updating token');
                    typedToken.firstName = dbUserForJwt.firstName;
                    typedToken.lastName = dbUserForJwt.lastName;
                    typedToken.picture = ((_b = (_a = dbUserForJwt.images) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.url) || typedToken.picture;
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
                    typedToken.language = dbUserForJwt.language; // ✅ עדכון השפה מה-DB
                    typedToken.createdAt = dbUserForJwt.createdAt;
                    typedToken.updatedAt = dbUserForJwt.updatedAt;
                    typedToken.lastLogin = dbUserForJwt.lastLogin;
                    console.log('[JWT Callback] Language updated in token:', typedToken.language);
                    const questionnaireStatus = await prisma_1.default.questionnaireResponse.findFirst({
                        where: { userId: typedToken.id },
                        select: { completed: true },
                        orderBy: { createdAt: 'desc' },
                    });
                    typedToken.questionnaireCompleted = (_c = questionnaireStatus === null || questionnaireStatus === void 0 ? void 0 : questionnaireStatus.completed) !== null && _c !== void 0 ? _c : false;
                    const requiresCompletionFromDb = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified || !dbUserForJwt.termsAndPrivacyAcceptedAt);
                    typedToken.requiresCompletion = requiresCompletionFromDb;
                    typedToken.redirectUrl = requiresCompletionFromDb ? '/auth/register' : '/profile';
                }
                else {
                    console.log('[JWT Callback] User not found in DB');
                }
            }
            // ✅ רענון נתונים גם ב-signIn (אם צריך)
            if (typedToken.id && trigger === "signIn" && !typedUserFromCallback) {
                console.log('[JWT Callback] SignIn trigger without user object - refreshing from DB');
                const dbUserForJwt = await prisma_1.default.user.findUnique({
                    where: { id: typedToken.id },
                    include: {
                        images: { where: { isMain: true }, take: 1 },
                    }
                });
                if (dbUserForJwt) {
                    typedToken.firstName = dbUserForJwt.firstName;
                    typedToken.lastName = dbUserForJwt.lastName;
                    typedToken.picture = ((_e = (_d = dbUserForJwt.images) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.url) || typedToken.picture;
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
                    const questionnaireStatus = await prisma_1.default.questionnaireResponse.findFirst({
                        where: { userId: typedToken.id },
                        select: { completed: true },
                        orderBy: { createdAt: 'desc' },
                    });
                    typedToken.questionnaireCompleted = (_f = questionnaireStatus === null || questionnaireStatus === void 0 ? void 0 : questionnaireStatus.completed) !== null && _f !== void 0 ? _f : false;
                    const requiresCompletionFromDb = (!dbUserForJwt.isProfileComplete || !dbUserForJwt.isPhoneVerified || !dbUserForJwt.termsAndPrivacyAcceptedAt);
                    typedToken.requiresCompletion = requiresCompletionFromDb;
                    typedToken.redirectUrl = requiresCompletionFromDb ? '/auth/register' : '/profile';
                }
            }
            return typedToken;
        },
        async session({ session, token }) {
            var _a, _b;
            const typedToken = token;
            const typedSession = session;
            if (typedSession.user && typedToken.id) {
                typedSession.user.id = typedToken.id;
                typedSession.user.email = typedToken.email;
                typedSession.user.firstName = typedToken.firstName;
                typedSession.user.lastName = typedToken.lastName;
                typedSession.user.name = (_a = typedToken.name) !== null && _a !== void 0 ? _a : null;
                typedSession.user.image = (_b = typedToken.picture) !== null && _b !== void 0 ? _b : null;
                typedSession.user.role = typedToken.role;
                typedSession.user.status = typedToken.status;
                typedSession.user.isVerified = typedToken.isVerified;
                typedSession.user.isProfileComplete = typedToken.isProfileComplete;
                typedSession.user.isPhoneVerified = typedToken.isPhoneVerified;
                typedSession.user.questionnaireCompleted = typedToken.questionnaireCompleted;
                typedSession.user.hasCompletedOnboarding = typedToken.hasCompletedOnboarding;
                typedSession.user.source = typedToken.source;
                typedSession.user.addedByMatchmakerId = typedToken.addedByMatchmakerId;
                typedSession.user.engagementEmailsConsent = typedToken.engagementEmailsConsent;
                typedSession.user.promotionalEmailsConsent = typedToken.promotionalEmailsConsent;
                typedSession.user.language = typedToken.language; // ✅ העברה ל-session
                if (typedToken.createdAt) {
                    typedSession.user.createdAt = new Date(typedToken.createdAt);
                }
                if (typedToken.updatedAt) {
                    typedSession.user.updatedAt = new Date(typedToken.updatedAt);
                }
                if (typedToken.lastLogin) {
                    typedSession.user.lastLogin = new Date(typedToken.lastLogin);
                }
                if (typedToken.termsAndPrivacyAcceptedAt) {
                    typedSession.user.termsAndPrivacyAcceptedAt = new Date(typedToken.termsAndPrivacyAcceptedAt);
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
exports.default = exports.authOptions;
