-- Development Setup Script
-- Creates organization, user, and links them together for CSV upload testing
-- Email: keino.chichester@gmail.com
-- Password: dev123456

-- Insert organization
INSERT INTO "orgs" (id, name, "subscription_plan", currency, "api_key", "rate_limit", "created_at")
VALUES (
  '7a7bce10-b0fd-415f-a6b5-22fd622b6054',
  'K-Fin Development Org',
  'free',
  'USD',
  'dev-api-key-001',
  1000,
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Insert user record
INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
VALUES (
  '4157795d-a7bc-491c-bebe-7e8044eb61c0',
  'keino.chichester@gmail.com',
  'Keino Chichester',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id;

-- Insert account record with hashed password (bcrypt hash of "dev123456")
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWka27zlxClGhvHpgHDvn9/O
INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
VALUES (
  'dev-account-keino-001',
  '4157795d-a7bc-491c-bebe-7e8044eb61c0',
  '4157795d-a7bc-491c-bebe-7e8044eb61c0',
  'credential',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWka27zlxClGhvHpgHDvn9/O',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO UPDATE SET "userId" = EXCLUDED."userId";

-- Link user to organization
INSERT INTO "org_users" ("user_id", "org_id", role, "created_at")
VALUES (
  '4157795d-a7bc-491c-bebe-7e8044eb61c0',
  '7a7bce10-b0fd-415f-a6b5-22fd622b6054',
  'ADMIN',
  CURRENT_TIMESTAMP
) ON CONFLICT ("user_id", "org_id") DO UPDATE SET role = EXCLUDED.role;