import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
// Use a secure 32-character key for production. Fallback for demo.
const ENCRYPTION_KEY = process.env.VERYTIS_ENCRYPTION_KEY || 'verytis-ai-ops-secure-db-key-123';
const IV_LENGTH = 16;

export function encrypt(text) {
    if (!text) return null;
    try {
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        const authTag = cipher.getAuthTag();
        return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
    } catch (e) {
        console.error("Encryption failed:", e);
        return null;
    }
}

export function decrypt(text) {
    if (!text) return null;
    try {
        const textParts = text.split(':');
        if (textParts.length !== 3) return null;
        const iv = Buffer.from(textParts.shift(), 'hex');
        const encryptedText = Buffer.from(textParts.shift(), 'hex');
        const authTag = Buffer.from(textParts.shift(), 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY.substring(0, 32)), iv);
        decipher.setAuthTag(authTag);
        let decrypted = decipher.update(encryptedText);
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString();
    } catch (e) {
        console.error("Decryption failed:", e);
        return null;
    }
}
