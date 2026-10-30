import { Router } from "express";
import authCtrl from "../ctrls/auth.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { loginSchema } from "../schemas/auth.schema.js";

const router = Router();

// POST   /api/auth/login    → email + password. Devuelve el JWT y los datos básicos del usuario
// POST   /api/auth/logout   → con Authorization: Bearer <token>. El token deja de valer
// GET    /api/auth/me       → con token. Los datos del usuario autenticado (_id, name, email, role, avatar)
// No hay registro: los usuarios los crea un admin desde /api/users

router.post("/login", validate({ body: loginSchema }), authCtrl.login);
router.post("/logout", authenticate, authCtrl.logout);
router.get("/me", authenticate, authCtrl.me);

export default router;
