import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

function getKey() {
    // Uses ENCRYPTION_KEY if set, otherwise a fallback for dev
    const secret = process.env.ENCRYPTION_KEY || 'verytis-fallback-development-key';
    return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a given text.
 * @param {string} text - The input string to encrypt (e.g. access token)
 * @returns {string} The encrypted string in format vault:v1:iv:authTag:encryptedData
 */
export function encryptToken(text) {
    if (!text || typeof text !== 'string') return text;
    // Do not double encrypt
    if (text.startsWith('vault:v1:')) return text;

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');

    return `vault:v1:${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts a previously encrypted text.
 * @param {string} encryptedText - The text to decrypt
 * @returns {string|null} The original token, or null if decryption fails
 */
export function decryptToken(encryptedText) {
    if (!encryptedText || typeof encryptedText !== 'string') return encryptedText;
    if (!encryptedText.startsWith('vault:v1:')) return encryptedText; // already decrypted or plain

    try {
        const parts = encryptedText.split(':');
        const ivHex = parts[2];
        const authTagHex = parts[3];
        const hexData = parts[4];

        const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
        decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

        let decrypted = decipher.update(hexData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    } catch (err) {
        console.error('Decryption failed:', err);
        return null;
    }
}
