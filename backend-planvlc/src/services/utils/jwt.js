import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import AppError from "./AppError.js";

// Creación y verificación de los JWT.
// SECRET (firma) y JWT_EXPIRES_IN (caducidad) vienen del .env: nunca se escriben en el código

const ALGORITHM = "HS256";

const getSecret = () => {
  if (!process.env.SECRET) {
    throw new AppError("Falta la variable SECRET en el .env", 500);
  }
  return process.env.SECRET;
};

// Caducidad del token: "1h", "7d"... (por defecto 1 hora)
export const getExpires = () => process.env.JWT_EXPIRES_IN || "1h";

// Crea un token firmado con el id del usuario (sub), su email y su rol.
// jwtid (jti) hace que cada token sea distinto: si no, dos logins en el mismo segundo darían el mismo
// token y, tras un logout, el nuevo login nacería ya en la lista negra
export const createToken = ({ id, email, role }) => {
  return jwt.sign({ email, role }, getSecret(), {
    subject: String(id),
    jwtid: randomUUID(),
    expiresIn: getExpires(),
    algorithm: ALGORITHM,
  });
};

// Verifica la firma con SECRET y la caducidad (exp) y devuelve el payload.
// Si el token no es válido, ha caducado o le falta el email o el rol → 401
export const verifyToken = (token) => {
  const secret = getSecret();

  let payload;
  try {
    payload = jwt.verify(token, secret, { algorithms: [ALGORITHM] });
  } catch {
    throw new AppError("Autenticación requerida", 401);
  }

  if (!payload.sub || !payload.email || !payload.role) {
    throw new AppError("Autenticación requerida", 401);
  }
  return payload;
};
