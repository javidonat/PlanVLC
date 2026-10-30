import authRepo from "../repos/auth.repo.js";
import blacklistRepo from "../repos/blacklist.repo.js";
import usersRepo from "../repos/users.repo.js";
import profilesRepo from "../repos/profiles.repo.js";
import AppError from "./utils/AppError.js";
import { hashPassword, verifyPassword } from "./utils/password.js";
import { createToken, getExpires } from "./utils/jwt.js";
import { defaultAvatar } from "./utils/avatar.js";

// Login, logout y me: no hay registro, los usuarios se crean desde el panel (admin)

// Comprueba que el usuario puede usar la aplicación: activo, con status "active" y con un rol activo.
// La usan el login y el middleware de autenticación. Devuelve el mensaje del problema o null
export const getAccessProblem = (user) => {
  if (!user.isActive) return "Tu cuenta está desactivada";
  if (user.status === "suspended") return "Tu cuenta está suspendida";
  if (user.status === "banned") return "Tu cuenta está bloqueada";
  const role = user.roleId;
  if (!role || !role.isActive || role.deletedAt) return "Tu rol está desactivado";
  return null;
};

// Hash de relleno: si el email no existe se verifica igualmente contra él, para que la respuesta
// tarde lo mismo y no se pueda averiguar qué emails están registrados
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await hashPassword("contraseña-de-relleno"));

// POST /api/auth/login
const login = async ({ email, password }) => {
  const user = await authRepo.findByEmailWithPassword(email);

  // Mismo mensaje si el email no existe o la contraseña no coincide (no se revela qué emails existen)
  const validPassword = await verifyPassword(password, user ? user.passwordHash : await getDummyHash());
  if (!user || !validPassword) {
    throw new AppError("Email o contraseña incorrectos", 401);
  }

  const problem = getAccessProblem(user);
  if (problem) {
    throw new AppError(problem, 403);
  }

  const role = user.roleId.name;
  const token = createToken({ id: user._id, email: user.email, role });
  await authRepo.updateLastLogin(user._id);
  // Avatar del perfil (o el robot si aún no tiene perfil) para mostrarlo en el navbar
  const profile = await profilesRepo.findByUserId(user._id);

  return {
    token,
    tokenType: "Bearer",
    expiresIn: getExpires(),
    user: { _id: user._id, name: user.name, email: user.email, role, avatar: profile?.avatar || defaultAvatar(user._id) },
  };
};

// POST /api/auth/logout: el JWT no se puede borrar, así que se guarda en la lista negra
// y el middleware de autenticación ya no lo acepta. Se guarda hasta que caduca (exp del token)
const logout = async ({ token, userId, exp }) => {
  await blacklistRepo.add({ token, userId, expiresAt: new Date(exp * 1000) });
};

// GET /api/auth/me: los datos del usuario del token (los mismos que devuelve el login).
// El frontend los pide al arrancar en vez de guardarlos en localStorage
const me = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.roleId.name,
    avatar: user.profile?.avatar || defaultAvatar(user._id),
  };
};

export default { login, logout, me };
