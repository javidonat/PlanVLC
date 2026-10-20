import { Router } from "express";
import rolesCtrl from "../ctrls/roles.ctrl.js";
import validate from "../middleware/validate.js";
import { activeSchema, createRoleSchema, idParamsSchema, updateRoleSchema } from "../schemas/roles.schema.js";

const router = Router();

// GET    /api/roles                  → todos (activos, desactivados y eliminados)
// GET    /api/roles/active           → solo activos y no eliminados (desplegable del formulario de usuarios)
// GET    /api/roles/deleted          → solo eliminados (soft delete)
// GET    /api/roles/:id              → un rol activo por su id
// POST   /api/roles                  → crear (el nombre es único y se guarda en minúsculas)
// PATCH  /api/roles/:id              → modificar
// PATCH  /api/roles/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminado → 409
// PATCH  /api/roles/:id/softdelete   → borrado lógico. Si hay usuarios con ese rol → 409

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", rolesCtrl.getRoles); // todos
router.get("/active", rolesCtrl.getActiveRoles); // solo activos
router.get("/deleted", rolesCtrl.getDeletedRoles); // solo eliminados
router.get("/:id", validate({ params: idParamsSchema }), rolesCtrl.getRoleById);
router.post("/", validate({ body: createRoleSchema }), rolesCtrl.postRole);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), rolesCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), rolesCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateRoleSchema }), rolesCtrl.patchRole);

export default router;
