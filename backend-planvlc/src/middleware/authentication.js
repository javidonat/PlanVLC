import mongoose from "mongoose";
import authRepo from "../repos/auth.repo.js";
import tokensRepo from "../repos/tokens.repo.js";
import AppError from "../services/utils/AppError.js";
import { verifyToken } from "../services/utils/jwt.js";
import { hashToken } from "../services/utils/tokens.js";
import { getAccessProblem } from "../services/auth.service.js";

// Autenticación: comprueba el access token (JWT) de la cookie access_token (req.cookies, cookie-parser)
// y deja el usuario autenticado en req.user ({ id, name, email, role }).
//
//   router.get("/me", authenticate, ctrl.me);
//
// Responde 401 si falta el token, la firma no es válida, ha caducado, está revocado (se hizo logout)
// o el usuario ya no puede entrar (desactivado, suspendido, eliminado, le han cambiado el rol...).
// Con el 401 el frontend llama a /api/auth/refresh para conseguir un access token nuevo

const unauthorized = () => new AppError("Autenticación requerida", 401);

const authenticate = async (req, _res, next) => {
  try {
    const token = req.cookies?.access_token;
    if (!token) throw unauthorized();

    const payload = verifyToken(token);
    if (!mongoose.isValidObjectId(payload.sub)) throw unauthorized();

    // Token de una sesión cerrada (logout): está revocado
    if (await tokensRepo.isAccessRevoked(hashToken(token))) throw unauthorized();

    // El token es válido, pero el usuario tiene que seguir existiendo y poder entrar
    const user = await authRepo.findByIdForAuth(payload.sub);
    if (!user || getAccessProblem(user)) throw unauthorized();

    // Lo que dice el token tiene que coincidir con la base de datos
    if (user.email !== payload.email || user.roleId.name !== payload.role) {
      throw unauthorized();
    }

    req.user = { id: String(user._id), name: user.name, email: user.email, role: payload.role };
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
