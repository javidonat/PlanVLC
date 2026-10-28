import mongoose from "mongoose";
import authRepo from "../repos/auth.repo.js";
import blacklistRepo from "../repos/blacklist.repo.js";
import AppError from "../services/utils/AppError.js";
import { verifyToken } from "../services/utils/jwt.js";
import { getAccessProblem } from "../services/auth.service.js";

// Autenticación: comprueba el JWT de la cabecera Authorization: Bearer <token>
// y deja el usuario autenticado en req.user ({ id, name, email, role }),
// y el token y su caducidad en req.token y req.tokenExp (los usa el logout).
//
//   router.post("/logout", authenticate, ctrl.logout);
//
// Responde 401 si falta el token, la firma no es válida, ha caducado, está en la lista negra (se hizo logout)
// o el usuario ya no puede entrar (desactivado, suspendido, eliminado, le han cambiado el rol...)

const unauthorized = () => new AppError("Autenticación requerida", 401);

const getBearerToken = (header) => {
  const [scheme, token] = (header || "").split(" ");
  return scheme === "Bearer" && token ? token : null;
};

const authenticate = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.headers.authorization);
    if (!token) throw unauthorized();

    const payload = verifyToken(token);
    if (!mongoose.isValidObjectId(payload.sub)) throw unauthorized();

    // Token de una sesión cerrada (logout): está en la lista negra
    if (await blacklistRepo.exists(token)) throw unauthorized();

    // El token es válido, pero el usuario tiene que seguir existiendo y poder entrar
    const user = await authRepo.findByIdForAuth(payload.sub);
    if (!user || getAccessProblem(user)) throw unauthorized();

    // Lo que dice el token tiene que coincidir con la base de datos
    if (user.email !== payload.email || user.roleId.name !== payload.role) {
      throw unauthorized();
    }

    req.user = { id: String(user._id), name: user.name, email: user.email, role: payload.role };
    req.token = token;
    req.tokenExp = payload.exp;
    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
