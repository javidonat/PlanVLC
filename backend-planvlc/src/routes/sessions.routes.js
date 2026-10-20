import { Router } from "express";
import sessionsCtrl from "../ctrls/sessions.ctrl.js";
import validate from "../middleware/validate.js";
import { activeSchema, createSessionSchema, idParamsSchema, updateSessionSchema } from "../schemas/sessions.schema.js";

const router = Router();

// GET    /api/sessions                  → obtener todas las sesiones (sin filtrar)
// GET    /api/sessions/active           → obtener solo las sesiones activas
// GET    /api/sessions/deleted          → obtener solo las sesiones eliminadas (soft delete)
// GET    /api/sessions/:id              → obtener una sesión activa por su id
// POST   /api/sessions                  → crear una sesión (el SKU se genera con el plan y la fecha de inicio)
// PATCH  /api/sessions/:id              → modificar una sesión (si cambia la fecha de inicio, cambia el SKU). El plan no se cambia
// PATCH  /api/sessions/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminada → 409
// PATCH  /api/sessions/:id/softdelete   → borrado lógico (isActive = false y deletedAt = ahora)
// Cada cambio recalcula priceFrom y nextSessionAt de su plan

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", sessionsCtrl.getSessions); // todas
router.get("/active", sessionsCtrl.getActiveSessions); // solo activas
router.get("/deleted", sessionsCtrl.getDeletedSessions); // solo eliminadas
router.get("/:id", validate({ params: idParamsSchema }), sessionsCtrl.getSessionById);
router.post("/", validate({ body: createSessionSchema }), sessionsCtrl.postSession);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), sessionsCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), sessionsCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateSessionSchema }), sessionsCtrl.patchSession);

export default router;
