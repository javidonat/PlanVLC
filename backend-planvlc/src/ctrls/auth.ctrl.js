import authService from "../services/auth.service.js";

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const data = await authService.login(req.body);
    res.status(200).json({ ok: true, message: "Sesión iniciada correctamente", data });
  } catch (error) {
    next(error);
  }
};

// POST /api/auth/logout (req.user, req.token y req.tokenExp los pone el middleware de autenticación)
const logout = async (req, res, next) => {
  try {
    await authService.logout({ token: req.token, userId: req.user.id, exp: req.tokenExp });
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

export default { login, logout, me };
