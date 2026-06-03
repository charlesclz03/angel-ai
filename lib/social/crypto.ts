import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'crypto'

const ENCRYPTION_PREFIX = 'v1'

export function encryptSocialToken(value: string) {
  const normalized = value.trim()

  if (!normalized) {
    throw new Error('Social tokens cannot be encrypted when empty.')
  }

  const key = getEncryptionKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([
    cipher.update(normalized, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return [
    ENCRYPTION_PREFIX,
    iv.toString('base64url'),
    authTag.toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')
}

export function decryptSocialToken(payload: string) {
  const [prefix, ivValue, authTagValue, encryptedValue] = payload.split('.')

  if (
    prefix !== ENCRYPTION_PREFIX ||
    !ivValue ||
    !authTagValue ||
    !encryptedValue
  ) {
    throw new Error('Invalid social token payload.')
  }

  const decipher = createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(ivValue, 'base64url')
  )
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'))

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ])

  return decrypted.toString('utf8')
}

function getEncryptionKey() {
  const rawKey =
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim()

  if (!rawKey) {
    throw new Error(
      'Set SOCIAL_TOKEN_ENCRYPTION_KEY before connecting social accounts.'
    )
  }

  try {
    const decoded = Buffer.from(rawKey, 'base64')

    if (decoded.length >= 32) {
      return decoded.subarray(0, 32)
    }
  } catch {
    // Fall through to hashed derivation for non-base64 secrets.
  }

  return createHash('sha256').update(rawKey).digest()
}
