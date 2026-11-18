import authRepo from "../repos/auth.repo.js";
import tokensRepo from "../repos/tokens.repo.js";
import usersRepo from "../repos/users.repo.js";
import profilesRepo from "../repos/profiles.repo.js";
import rolesRepo from "../repos/roles.repo.js";
import AppError from "./utils/AppError.js";
import { hashPassword, verifyPassword } from "./utils/password.js";
import { createToken, decodeToken, verifyToken } from "./utils/jwt.js";
import { createRefreshToken, getRefreshExpiresAt, hashToken } from "./utils/tokens.js";
import { defaultAvatar } from "./utils/avatar.js";
import { CLIENT_ROLE } from "../models/constants.js";

// Registro de clientes, login, refresh, logout y me.
// La sesión son dos tokens que viajan en cookies httpOnly (las pone el controlador):
//   - access token: JWT corto (JWT_EXPIRES_IN, 1h). Lo comprueba el middleware de autenticación
//   - refresh token: texto aleatorio largo (REFRESH_TOKEN_DAYS, 7 días). Solo sirve para pedir un access token nuevo
// En la base de datos solo se guardan sus hashes

// Comprueba que el usuario puede usar la aplicación: activo, con status "active" y con un rol activo.
// La usan el login, el refresh y el middleware de autenticación. Devuelve el mensaje del problema o null
export const getAccessProblem = (user) => {
  if (!user.isActive) return "Tu cuenta está desactivada";
  if (user.status === "suspended") return "Tu cuenta está suspendida";
  if (user.status === "banned") return "Tu cuenta está bloqueada";
  const role = user.roleId;
  if (!role || !role.isActive || role.deletedAt) return "Tu rol está desactivado";
  return null;
};

const unauthorized = () => new AppError("Autenticación requerida", 401);

// Hash de relleno: si el email no existe se verifica igualmente contra él, para que la respuesta
// tarde lo mismo y no se pueda averiguar qué emails están registrados
let dummyHash;
const getDummyHash = async () => (dummyHash ??= await hashPassword("contraseña-de-relleno"));

// Datos del usuario que necesita el frontend (navbar, guards)
const publicUser = (user, avatar) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.roleId.name,
  avatar: avatar || defaultAvatar(user._id),
});

// Crea el par de tokens: el access token (JWT) y un refresh token nuevo, del que se guarda el hash
const createSession = async (user) => {
  const accessToken = createToken({ id: user._id, email: user.email, role: user.roleId.name });
  const refreshToken = createRefreshToken();
  const refreshExpiresAt = getRefreshExpiresAt();
  await tokensRepo.createRefresh({ tokenHash: hashToken(refreshToken), userId: user._id, expiresAt: refreshExpiresAt });
  return {
    accessToken,
    accessExpiresAt: new Date(decodeToken(accessToken).exp * 1000),
    refreshToken,
    refreshExpiresAt,
  };
};

// POST /api/auth/register: crea un cliente con su perfil. No inicia sesión: después va al login.
// El rol no lo elige quien se registra: siempre es el de cliente (así nadie se registra como admin)
const register = async ({ name, email, password }) => {
  if (await usersRepo.emailExists(email)) {
    throw new AppError("Ya existe una cuenta con ese email", 409);
  }
  const role = await rolesRepo.findActiveByName(CLIENT_ROLE);
  if (!role) {
    throw new AppError("El registro no está disponible en este momento", 503);
  }

  const user = await usersRepo.create({ name, email, passwordHash: await hashPassword(password), roleId: role._id });
  // Cada usuario tiene su perfil (User 1 → 1 Profile), igual que al crearlo desde el panel
  const profile = await profilesRepo.create(user._id);
  return publicUser(user, profile?.avatar);
};

// POST /api/auth/login (clientes y admin)
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

  const tokens = await createSession(user);
  await authRepo.updateLastLogin(user._id);
  // Avatar del perfil (o el robot si aún no tiene perfil) para mostrarlo en el navbar
  const profile = await profilesRepo.findByUserId(user._id);
  return { user: publicUser(user, profile?.avatar), tokens };
};

// POST /api/auth/refresh: cambia el refresh token por un par nuevo (rotación).
// Cada refresh token vale una sola vez: si llega uno ya usado, alguien lo ha copiado,
// así que se cierran todas las sesiones de ese usuario
const refresh = async (refreshToken) => {
  if (!refreshToken) throw unauthorized();
  const tokenHash = hashToken(refreshToken);

  const stored = await tokensRepo.revokeRefresh(tokenHash);
  if (!stored) {
    const used = await tokensRepo.findRefresh(tokenHash);
    if (used) await tokensRepo.revokeAllRefreshByUser(used.userId);
    throw unauthorized();
  }
  if (stored.expiresAt <= new Date()) throw unauthorized();

  // El usuario tiene que seguir pudiendo entrar (no desactivado, suspendido, eliminado...)
  const user = await authRepo.findByIdForAuth(stored.userId);
  if (!user || getAccessProblem(user)) throw unauthorized();

  return createSession(user);
};

// Payload del access token si es válido (firma y caducidad); si no, null
const validAccessPayload = (accessToken) => {
  try {
    return accessToken ? verifyToken(accessToken) : null;
  } catch {
    return null;
  }
};

// POST /api/auth/logout: revoca los dos tokens. El access token (JWT) no se puede borrar,
// así que su hash va a la lista de revocados hasta que caduque (si ya no es válido, no hace falta).
// Funciona aunque falte alguno: el controlador borra las cookies igualmente
const logout = async ({ accessToken, refreshToken }) => {
  if (refreshToken) {
    await tokensRepo.revokeRefresh(hashToken(refreshToken));
  }
  const payload = validAccessPayload(accessToken);
  if (payload) {
    await tokensRepo.revokeAccess({ tokenHash: hashToken(accessToken), userId: payload.sub, expiresAt: new Date(payload.exp * 1000) });
  }
};

// GET /api/auth/me: el usuario de la sesión (user y role). El frontend lo pide al arrancar (F5)
const me = async (userId) => {
  const user = await usersRepo.findById(userId);
  if (!user) {
    throw new AppError("Usuario no encontrado", 404);
  }
  return publicUser(user, user.profile?.avatar);
};

export default { register, login, refresh, logout, me };
