import { BlacklistedToken } from "../models/index.js";

// Lista negra de tokens (logout)

// Guarda el token. Si ya estaba (doble logout), no hace nada
const add = ({ token, userId, expiresAt }) => {
  return BlacklistedToken.updateOne({ token }, { $setOnInsert: { token, userId, expiresAt } }, { upsert: true });
};

// ¿Está el token en la lista negra?
const exists = async (token) => {
  return Boolean(await BlacklistedToken.exists({ token }));
};

export default { add, exists };
