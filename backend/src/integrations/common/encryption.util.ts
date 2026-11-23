import * as crypto from 'crypto';

/**
 * Encryption Utility for Secure Storage of Third-Party OAuth & API Credentials.
 * Uses AES-256-GCM (Authenticated Encryption) to ensure confidentiality and integrity.
 */
export class EncryptionUtil {
  private static getKey(): Buffer {
    const secret =
      process.env.ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'jeenora-enterprise-crm-vault-key-2026-secure';
    return crypto.createHash('sha256').update(secret).digest();
  }

  /**
   * Encrypts plaintext string using AES-256-GCM.
   * Returns formatted string: `${iv_base64}:${tag_base64}:${cipher_base64}`
   */
  static encrypt(plaintext: string): string {
    if (!plaintext) return '';
    const key = this.getKey();
    const iv = crypto.randomBytes(12); // Recommended 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag().toString('base64');

    return `${iv.toString('base64')}:${tag}:${encrypted}`;
  }

  /**
   * Decrypts encrypted string with tag verification.
   */
  static decrypt(encryptedPayload: string): string {
    if (!encryptedPayload) return '';
    try {
      const parts = encryptedPayload.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted format');
      }

      const [ivB64, tagB64, cipherB64] = parts;
      const key = this.getKey();
      const iv = Buffer.from(ivB64, 'base64');
      const tag = Buffer.from(tagB64, 'base64');

      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(cipherB64, 'base64', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (err: any) {
      throw new Error(`Failed to decrypt credentials: ${err.message}`);
    }
  }

  /**
   * Creates a tamper-proof signed OAuth state string.
   */
  static generateOAuthState(tenantId: string, provider: string): string {
    const timestamp = Date.now();
    const data = JSON.stringify({ tenantId, provider, timestamp });
    const encoded = Buffer.from(data).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.getKey())
      .update(encoded)
      .digest('base64url');
    return `${encoded}.${signature}`;
  }

  /**
   * Validates and unpacks an OAuth state string.
   * Ensures HMAC signature matches and timestamp is within 15 minutes.
   */
  static validateOAuthState(state: string): { tenantId: string; provider: string } {
    if (!state || !state.includes('.')) {
      throw new Error('Malformed OAuth state parameter');
    }

    const [encoded, signature] = state.split('.');
    const expectedSignature = crypto
      .createHmac('sha256', this.getKey())
      .update(encoded)
      .digest('base64url');

    if (signature !== expectedSignature) {
      throw new Error('Invalid OAuth state signature — potential CSRF detected');
    }

    const jsonStr = Buffer.from(encoded, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);

    const fifteenMinutes = 15 * 60 * 1000;
    if (Date.now() - payload.timestamp > fifteenMinutes) {
      throw new Error('OAuth state has expired. Please restart the authorization flow.');
    }

    return {
      tenantId: payload.tenantId,
      provider: payload.provider,
    };
  }
}
