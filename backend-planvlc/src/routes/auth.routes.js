import { Router } from "express";
import authCtrl from "../ctrls/auth.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const router = Router();

// La sesión va en dos cookies httpOnly: access_token (JWT, 1h) y refresh_token (7 días)
// POST   /api/auth/register → name + email + password. Crea un cliente (rol "user") con su perfil. No inicia sesión
// POST   /api/auth/login    → email + password (clientes y admin). Pone las dos cookies y devuelve el usuario
// POST   /api/auth/refresh  → con la cookie refresh_token. Cookies nuevas (el refresh token anterior deja de valer). Si no vale → 401
// POST   /api/auth/logout   → revoca los dos tokens y borra las cookies
// GET    /api/auth/me       → con la cookie access_token. El usuario de la sesión (_id, name, email, role, avatar)
// Los demás roles (admin, editor...) los asigna un admin desde /api/users

router.post("/register", validate({ body: registerSchema }), authCtrl.register);
router.post("/login", validate({ body: loginSchema }), authCtrl.login);
router.post("/refresh", authCtrl.refresh);
router.post("/logout", authCtrl.logout);
router.get("/me", authenticate, authCtrl.me);

export default router;
