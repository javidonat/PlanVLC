import authService from "../services/auth.service.js";

// Las dos cookies de la sesión. httpOnly: el JavaScript del navegador no puede leerlas (protege de XSS).
// sameSite "lax": el navegador no las manda en peticiones POST desde otras webs (protege de CSRF).
// secure: en producción solo viajan por HTTPS
export const ACCESS_COOKIE = "access_token";
export const REFRESH_COOKIE = "refresh_token";

// Sin expires (al borrarlas) clearCookie pone una fecha pasada y el navegador las elimina
const cookieOptions = (path, expires) => ({
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path,
  ...(expires && { expires }),
});

// El access token va a toda la API; el refresh token solo a /api/auth (refresh y logout)
const ACCESS_PATH = "/api";
const REFRESH_PATH = "/api/auth";

const setSessionCookies = (res, { accessToken, accessExpiresAt, refreshToken, refreshExpiresAt }) => {
  res.cookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_PATH, accessExpiresAt));
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_PATH, refreshExpiresAt));
};

const clearSessionCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, cookieOptions(ACCESS_PATH));
  res.clearCookie(REFRESH_COOKIE, cookieOptions(REFRESH_PATH));
};

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const data = await authService.register(req.body);
    res.status(201).json({ ok: true, message: "Cuenta creada correctamente. Ya puedes iniciar sesión", data });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/login: deja las dos cookies y devuelve el usuario
const login = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.login(req.body);
    setSessionCookies(res, tokens);
    res.status(200).json({ ok: true, message: "Sesión iniciada correctamente", data: user });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/refresh: con la cookie refresh_token, cookies nuevas. Si no vale → 401 y se borran
const refresh = async (req, res, next) => {
  try {
    const tokens = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
    setSessionCookies(res, tokens);
    res.status(200).json({ ok: true, message: "Sesión renovada" });
  } catch (error) {
    if (error.statusCode === 401) clearSessionCookies(res);
    next(error);
  }
};

// POST /api/auth/logout: revoca los dos tokens y borra las cookies
const logout = async (req, res, next) => {
  try {
    await authService.logout({ accessToken: req.cookies?.[ACCESS_COOKIE], refreshToken: req.cookies?.[REFRESH_COOKIE] });
    clearSessionCookies(res);
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    next(error);
  }
};

// GET /api/auth/me (req.user lo pone el middleware de autenticación)
const me = async (req, res, next) => {
  try {
    const data = await authService.me(req.user.id);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export default { register, login, refresh, logout, me };
