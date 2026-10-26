import authRepo from "../repos/auth.repo.js";
import AppError from "./utils/AppError.js";
import { hashPassword, verifyPassword } from "./utils/password.js";
import { createToken, getExpires } from "./utils/jwt.js";

// Solo login y logout: no hay registro, los usuarios se crean desde el panel (admin)

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
  const token = createToken({ id: user._id, email: user.email, role, tokenVersion: user.tokenVersion ?? 0 });
  await authRepo.updateLastLogin(user._id);

  return {
    token,
    tokenType: "Bearer",
    expiresIn: getExpires(),
    user: { _id: user._id, name: user.name, email: user.email, role },
  };
};

// POST /api/auth/logout: invalida todos los tokens del usuario (también los de otros dispositivos)
const logout = async (userId) => {
  await authRepo.incrementTokenVersion(userId);
};

export default { login, logout };
