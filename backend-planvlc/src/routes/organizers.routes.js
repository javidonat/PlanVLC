import { Router } from "express";
import organizersCtrl from "../ctrls/organizers.ctrl.js";
import validate from "../middleware/validate.js";
import { activeSchema, createOrganizerSchema, idParamsSchema, updateOrganizerSchema } from "../schemas/organizers.schema.js";

const router = Router();

// GET    /api/organizers                  → todos (activos, desactivados y eliminados)
// GET    /api/organizers/active           → solo activos y no eliminados (desplegables del formulario de planes)
// GET    /api/organizers/deleted          → solo eliminados (soft delete)
// GET    /api/organizers/:id              → un organizador activo por su id
// POST   /api/organizers                  → crear (el slug se genera a partir del nombre)
// PATCH  /api/organizers/:id              → modificar (si cambia el nombre, cambia el slug)
// PATCH  /api/organizers/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminado → 409
// PATCH  /api/organizers/:id/softdelete   → borrado lógico. Si tiene planes → 409

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", organizersCtrl.getOrganizers); // todos
router.get("/active", organizersCtrl.getActiveOrganizers); // solo activos
router.get("/deleted", organizersCtrl.getDeletedOrganizers); // solo eliminados
router.get("/:id", validate({ params: idParamsSchema }), organizersCtrl.getOrganizerById);
router.post("/", validate({ body: createOrganizerSchema }), organizersCtrl.postOrganizer);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), organizersCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), organizersCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateOrganizerSchema }), organizersCtrl.patchOrganizer);

export default router;
