-- Development User Creation Script
-- Creates a development user for quick login in Docker environment
-- Email: keino.chichester@gmail.com
-- Password: dev123456

-- Insert user record
INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'dev-user-keino-001',
  'keino.chichester@gmail.com',
  'Keino Chichester',
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert account record with hashed password (bcrypt hash of "dev123456")
-- Hash: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWka27zlxClGhvHpgHDvn9/O
INSERT INTO "account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt")
VALUES (
  'dev-account-keino-001',
  'dev-user-keino-001',
  'dev-user-keino-001',
  'credential',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWka27zlxClGhvHpgHDvn9/O',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;