// Admin configuration
// Add admin emails here to grant admin dashboard access

export const ADMIN_EMAILS = [
  'admin@zerotocryptodev.com',
  'michael@zerotocryptodev.com',
  // Add more admin emails as needed
];

export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
