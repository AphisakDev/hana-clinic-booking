const DEV_SECRET = 'dev-only-secret-change-me';

/** Base secret for all tokens. Required in production. */
export function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret || DEV_SECRET;
}

/**
 * Customer tokens are signed with a different secret than staff tokens, so a
 * customer token can never pass the admin guard (and vice versa).
 */
export function customerJwtSecret(): string {
  return `${jwtSecret()}:customer`;
}
