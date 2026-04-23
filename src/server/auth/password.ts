/**
 * Argon2id per OWASP memory-hard recommendation (tuned for server-side hashing).
 * Dynamic import keeps the native addon off pages that only register server actions (GET /login).
 */
export async function hashPassword(plain: string): Promise<string> {
  const argon2 = (await import('argon2')).default;
  return argon2.hash(plain, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

export async function verifyPassword(
  hash: string,
  plain: string
): Promise<boolean> {
  try {
    const argon2 = (await import('argon2')).default;
    return await argon2.verify(hash, plain);
  } catch {
    return false;
  }
}
