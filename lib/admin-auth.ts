import crypto from 'crypto';

export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD || '';
  if (!adminPassword) {
    console.error('ADMIN_PASSWORD not set');
    return false;
  }
  return password === adminPassword;
}

export function generateMagicToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateMagicLinkUrl(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/approve/${token}`;
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
