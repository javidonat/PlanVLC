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

// POST /api/auth/logout (req.user lo pone el middleware de autenticación)
const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user.id);
    res.status(200).json({ ok: true, message: "Sesión cerrada correctamente" });
  } catch (error) {
    next(error);
  }
};

export default { login, logout };
