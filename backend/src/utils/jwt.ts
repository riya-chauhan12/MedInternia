import jwt from 'jsonwebtoken';
import type { AppRole } from '../middleware/permissions';

const MIN_SECRET_LENGTH = 32;

/**
 * Validates that a JWT signing secret is present and long enough to resist
 * brute-force forgery. An empty, missing, or short secret makes HS256
 * signatures trivial to forge, letting an attacker mint tokens for any
 * user/role. Exported (rather than only run at import time) so it can be
 * exercised directly in tests without relying on process.exit.
 */
export function assertValidSecret(name: string, value: string | undefined): asserts value is string {
  if (!value || value === 'fallback_secret') {
    throw new Error(`CRITICAL: ${name} must be set to a secure random value in production`);
  }
  if (value.length < MIN_SECRET_LENGTH) {
    throw new Error(`CRITICAL: ${name} must be at least ${MIN_SECRET_LENGTH} characters long`);
  }
}

try {
  assertValidSecret('JWT_SECRET', process.env.JWT_SECRET);
  if (process.env.JWT_REFRESH_SECRET) {
    assertValidSecret('JWT_REFRESH_SECRET', process.env.JWT_REFRESH_SECRET);
  }
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}

export interface JwtPayload {
  userId: string;
  email: string;
  userType: AppRole;
  iat?: number;
}

export const generateToken = (payload: JwtPayload, rememberMe: boolean = false): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = rememberMe ? '7d' : '15m';

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign(payload, secret, { expiresIn });
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(payload, secret, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload | null => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  try {
    const decoded = jwt.verify(token, secret) as JwtPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};
