import { createHash, randomBytes } from "node:crypto";

// Refresh tokens y hashes de tokens.
// El refresh token no es un JWT: es un texto aleatorio largo. Lo que se guarda en la base de datos es su hash

// SHA-256 del token (hex). Sirve para el refresh y para el access token revocado:
// son textos aleatorios y largos, así que basta con un hash rápido (no hace falta Argon2 como en las contraseñas)
export const hashToken = (token) => createHash("sha256").update(token).digest("hex");

// 64 bytes aleatorios → 128 caracteres hex
export const createRefreshToken = () => randomBytes(64).toString("hex");

// Duración del refresh token en días (REFRESH_TOKEN_DAYS en el .env, por defecto 7)
export const getRefreshExpiresAt = () => {
  const days = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};
