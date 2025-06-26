import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "k-fin-dev.db");
const db = new Database(dbPath);

export const authLocal = betterAuth({
  database: db,
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NODE_ENV === "production" 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : "http://localhost:3000",
  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      creatorRole: "admin", 
      membershipLimit: 100,
      invitationExpiresIn: 60 * 60 * 24 * 7, // 7 days
    })
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 6,
    maxPasswordLength: 128,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
      requireEmailVerification: false,
    },
    changePassword: {
      enabled: true,
    },
  },
});

export type SessionLocal = typeof authLocal.$Infer.Session; 