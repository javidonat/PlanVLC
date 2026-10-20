import { Router } from "express";
import venuesCtrl from "../ctrls/venues.ctrl.js";
import validate from "../middleware/validate.js";
import { activeSchema, createVenueSchema, idParamsSchema, updateVenueSchema } from "../schemas/venues.schema.js";

const router = Router();

// GET    /api/venues                  → obtener todos los lugares (sin filtrar)
// GET    /api/venues/active           → solo activos y no eliminados (desplegables del formulario de planes)
// GET    /api/venues/deleted          → solo eliminados (soft delete)
// GET    /api/venues/:id              → obtener un lugar activo por su id
// POST   /api/venues                  → crear un lugar
// PATCH  /api/venues/:id              → modificar un lugar
// PATCH  /api/venues/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminado → 409
// PATCH  /api/venues/:id/softdelete   → borrado lógico. Si hay planes en el lugar → 409

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", venuesCtrl.getVenues); // todos
router.get("/active", venuesCtrl.getActiveVenues); // solo activos
router.get("/deleted", venuesCtrl.getDeletedVenues); // solo eliminados
router.get("/:id", validate({ params: idParamsSchema }), venuesCtrl.getVenueById);
router.post("/", validate({ body: createVenueSchema }), venuesCtrl.postVenue);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), venuesCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), venuesCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateVenueSchema }), venuesCtrl.patchVenue);

export default router;
