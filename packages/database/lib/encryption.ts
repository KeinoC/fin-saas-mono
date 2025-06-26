import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const algorithm = 'aes-256-gcm';
const keyLength = 32;
const ivLength = 16;
const tagLength = 16;

// Convert scrypt to promise-based function
const scryptAsync = promisify(scrypt);

// Get encryption key from environment or generate a secure default
function getEncryptionKey(): string {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('ENCRYPTION_KEY not set in environment variables. Using default key for development only.');
    return 'dev-key-not-for-production-use-change-this-immediately';
  }
  
  return key;
}

// Derive a consistent key from the encryption secret
async function deriveKey(secret: string, salt: Buffer): Promise<Buffer> {
  return (await scryptAsync(secret, salt, keyLength)) as Buffer;
}

/**
 * Encrypt sensitive data before storing in database
 */
export async function encrypt(text: string): Promise<string> {
  try {
    const secret = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = randomBytes(16);
    const iv = randomBytes(ivLength);
    
    // Derive key from secret and salt
    const key = await deriveKey(secret, salt);
    
    // Create cipher
    const cipher = createCipheriv(algorithm, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get the authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt, iv, tag, and encrypted data
    const combined = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt data retrieved from database
 */
export async function decrypt(encryptedData: string): Promise<string> {
  try {
    const secret = getEncryptionKey();
    
    // Convert from base64 and extract components
    const combined = Buffer.from(encryptedData, 'base64');
    
    const salt = combined.subarray(0, 16);
    const iv = combined.subarray(16, 16 + ivLength);
    const tag = combined.subarray(16 + ivLength, 16 + ivLength + tagLength);
    const encrypted = combined.subarray(16 + ivLength + tagLength);
    
    // Derive key from secret and salt
    const key = await deriveKey(secret, salt);
    
    // Create decipher
    const decipher = createDecipheriv(algorithm, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Encrypt JSON objects (for service account credentials)
 */
export async function encryptJSON(data: object): Promise<string> {
  return encrypt(JSON.stringify(data));
}

/**
 * Decrypt and parse JSON objects
 */
export async function decryptJSON<T = any>(encryptedData: string): Promise<T> {
  const decrypted = await decrypt(encryptedData);
  return JSON.parse(decrypted);
}

/**
 * Utility to check if encryption is properly configured
 */
export function isEncryptionConfigured(): boolean {
  const key = process.env.ENCRYPTION_KEY;
  return !!key && key !== 'dev-key-not-for-production-use-change-this-immediately';
}

/**
 * Generate a secure encryption key for production use
 */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString('hex');
} 