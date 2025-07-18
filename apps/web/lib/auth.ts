import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins";
import Database from "better-sqlite3";
import { Pool } from "pg";
import path from "path";

// Use PostgreSQL in production, SQLite in development
const getDatabaseConfig = () => {
  if (process.env.NODE_ENV === "production") {
    return {
      database: new Pool({
        connectionString: process.env.DATABASE_URL!,
        ssl: {
          rejectUnauthorized: false,
        },
      }),
    };
  } else {
    const dbPath = path.join(process.cwd(), "k-fin-dev.db");
    const db = new Database(dbPath);
    return {
      database: db,
    };
  }
};

export const auth = betterAuth({
  ...getDatabaseConfig(),
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NODE_ENV === "production" 
    ? process.env.NEXT_PUBLIC_APP_URL 
    : "http://localhost:3000",
  logger: {
    level: "debug",
    disabled: false,
  },
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
    sendResetPassword: async ({ user, url, token }, request) => {
      // For development, we'll log the reset URL
      // In production, you would send an email
      console.log(`\n=== PASSWORD RESET REQUEST ===`);
      console.log(`Email: ${user.email}`);
      console.log(`Reset URL: ${url}`);
      console.log(`Token: ${token}`);
      console.log(`=== END PASSWORD RESET ===\n`);
      
      // For development, we can also store this in a simple way
      // You can check your server console for the reset URL
      return Promise.resolve();
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      prompt: "select_account",
      accessType: "offline",
      scope: [
        "https://www.googleapis.com/auth/userinfo.email",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file"
      ],
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
    },
  },
});

export type Session = typeof auth.$Infer.Session; 