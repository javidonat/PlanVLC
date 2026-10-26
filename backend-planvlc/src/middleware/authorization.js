import AppError from "../services/utils/AppError.js";
import { ADMIN_ROLE } from "../models/constants.js";

// Autorización. Va siempre DESPUÉS de authenticate (necesita req.user).
// Sin usuario autenticado → 401; autenticado pero sin permiso → 403

const unauthorized = () => new AppError("Autenticación requerida", 401);
const forbidden = () => new AppError("No tienes permiso para acceder a este recurso", 403);

// RBAC: solo deja pasar a los roles indicados. Ej: router.use(authenticate, authorizeRoles("admin"))
export const authorizeRoles = (...roles) => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!roles.includes(req.user.role)) return next(forbidden());
  next();
};

// Solo administradores
export const isAdmin = authorizeRoles(ADMIN_ROLE);

// ABAC: el dueño del recurso o un admin
export const canAccessUserResource = (user, resourceUserId) => {
  if (!user || !resourceUserId) return false;
  return user.role === ADMIN_ROLE || user.id === String(resourceUserId);
};

// Middleware para rutas con el id del usuario en la URL (por defecto :userId)
export const isOwnerOrAdmin = (param = "userId") => (req, _res, next) => {
  if (!req.user) return next(unauthorized());
  if (!canAccessUserResource(req.user, req.params[param])) return next(forbidden());
  next();
};
