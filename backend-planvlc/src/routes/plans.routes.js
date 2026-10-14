import { Router } from "express";
import plansCtrl from "../ctrls/plans.ctrl.js";
import validate from "../middleware/validate.js";
import { activeSchema, createPlanSchema, idParamsSchema, updatePlanSchema } from "../schemas/plans.schema.js";

const router = Router();

// GET    /api/plans                  → obtener todos los planes (sin filtrar)
// GET    /api/plans/active           → obtener solo los planes activos
// GET    /api/plans/deleted          → obtener solo los planes eliminados (soft delete)
// GET    /api/plans/slug/:slug       → obtener un plan por su slug
// GET    /api/plans/:id              → obtener un plan por su id
// POST   /api/plans                  → crear un plan
// PATCH  /api/plans/:id              → modificar los datos de un plan (si cambia el título, cambia el slug)
// PATCH  /api/plans/:id/active       → activar o desactivar un plan (body: { "isActive": true }). Un plan eliminado no se puede reactivar (409)
// PATCH  /api/plans/:id/softdelete   → borrado lógico (isActive = false y deletedAt = ahora)

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", plansCtrl.getPlans); // todos
router.get("/active", plansCtrl.getActivePlans); // solo activos
router.get("/deleted", plansCtrl.getDeletedPlans); // solo eliminados
router.get("/slug/:slug", plansCtrl.getPlanBySlug);
router.get("/:id", validate({ params: idParamsSchema }), plansCtrl.getPlanById);
router.post("/", validate({ body: createPlanSchema }), plansCtrl.postPlan);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), plansCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), plansCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updatePlanSchema }), plansCtrl.patchPlan);

export default router;
