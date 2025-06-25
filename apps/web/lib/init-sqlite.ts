import Database from "better-sqlite3";
import path from "path";
import { authLocal } from "./auth-local";

const dbPath = path.join(process.cwd(), "k-fin-dev.db");

const schema = `
-- Better Auth SQLite Schema
CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    emailVerified INTEGER DEFAULT 0,
    name TEXT,
    image TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    expiresAt TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL,
    activeOrganizationId TEXT,
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    password TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
);

-- Better Auth Organization Plugin Tables
CREATE TABLE IF NOT EXISTS organization (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    logo TEXT,
    metadata TEXT DEFAULT '{}', -- JSON string for subscription_plan, currency, etc.
    createdAt TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS member (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    organizationId TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE,
    UNIQUE(userId, organizationId)
);

CREATE TABLE IF NOT EXISTS invitation (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    inviterId TEXT NOT NULL,
    organizationId TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
    expiresAt TEXT NOT NULL,
    createdAt TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (inviterId) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (organizationId) REFERENCES organization(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
CREATE INDEX IF NOT EXISTS idx_member_userId ON member(userId);
CREATE INDEX IF NOT EXISTS idx_member_organizationId ON member(organizationId);
CREATE INDEX IF NOT EXISTS idx_invitation_organizationId ON invitation(organizationId);
CREATE INDEX IF NOT EXISTS idx_invitation_email ON invitation(email);
CREATE INDEX IF NOT EXISTS idx_organization_slug ON organization(slug);
`;

export function initializeSQLiteDB() {
  try {
    console.log("Initializing SQLite database...");
    
    // Create the database file first
    const db = new Database(dbPath);
    
    // Execute our schema
    db.exec(schema);
    
    console.log("SQLite database initialized successfully!");
    db.close();
    return true;
  } catch (error) {
    console.error("Failed to initialize SQLite database:", error);
    return false;
  }
} 