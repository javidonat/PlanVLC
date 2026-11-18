import { RefreshToken, RevokedToken } from "../models/index.js";

// Tokens de sesión: refresh tokens (sesiones abiertas) y access tokens revocados (logout).
// Siempre se busca y se guarda el hash del token, nunca el token

// ---------- Refresh tokens ----------

const createRefresh = ({ tokenHash, userId, expiresAt }) => {
  return RefreshToken.create({ tokenHash, userId, expiresAt });
};

// Lo marca como usado/revocado solo si aún no lo estaba (atómico: si llegan dos /refresh a la vez
// con el mismo token, solo uno lo consigue). Devuelve el documento antes del cambio o null
const revokeRefresh = (tokenHash) => {
  return RefreshToken.findOneAndUpdate({ tokenHash, revokedAt: null }, { revokedAt: new Date() }).lean();
};

const findRefresh = (tokenHash) => {
  return RefreshToken.findOne({ tokenHash }).lean();
};

// Cierra todas las sesiones de un usuario (se ha reutilizado un refresh token ya usado: posible robo)
const revokeAllRefreshByUser = (userId) => {
  return RefreshToken.updateMany({ userId, revokedAt: null }, { revokedAt: new Date() });
};

// ---------- Access tokens revocados (logout) ----------

// Si ya estaba (doble logout), no hace nada
const revokeAccess = ({ tokenHash, userId, expiresAt }) => {
  return RevokedToken.updateOne({ tokenHash }, { $setOnInsert: { tokenHash, userId, expiresAt } }, { upsert: true });
};

const isAccessRevoked = async (tokenHash) => {
  return Boolean(await RevokedToken.exists({ tokenHash }));
};

export default { createRefresh, revokeRefresh, findRefresh, revokeAllRefreshByUser, revokeAccess, isAccessRevoked };
