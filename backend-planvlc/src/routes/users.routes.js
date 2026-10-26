import { Router } from "express";
import usersCtrl from "../ctrls/users.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin } from "../middleware/authorization.js";
import { activeSchema, createUserSchema, idParamsSchema, updateUserSchema } from "../schemas/users.schema.js";

const router = Router();

// Todas las rutas: token válido (authenticate) y rol admin (isAdmin). Sin token → 401, otro rol → 403
router.use(authenticate, isAdmin);

// GET    /api/users                  → todos (activos, desactivados y eliminados)
// GET    /api/users/active           → solo activos y no eliminados (formulario de organizadores)
// GET    /api/users/deleted          → solo eliminados (soft delete)
// GET    /api/users/:id              → un usuario activo por su id
// POST   /api/users                  → crear (email único; la contraseña se guarda como hash)
// PATCH  /api/users/:id              → modificar (password solo si se quiere cambiar)
// PATCH  /api/users/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminado → 409
// PATCH  /api/users/:id/softdelete   → borrado lógico (isActive = false y deletedAt = ahora)

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", usersCtrl.getUsers); // todos
router.get("/active", usersCtrl.getActiveUsers); // solo activos
router.get("/deleted", usersCtrl.getDeletedUsers); // solo eliminados
router.get("/:id", validate({ params: idParamsSchema }), usersCtrl.getUserById);
router.post("/", validate({ body: createUserSchema }), usersCtrl.postUser);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), usersCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), usersCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateUserSchema }), usersCtrl.patchUser);

export default router;
