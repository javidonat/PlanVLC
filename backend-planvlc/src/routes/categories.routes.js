import { Router } from "express";
import categoriesCtrl from "../ctrls/categories.ctrl.js";
import validate from "../middleware/validate.js";
import {
  activeSchema,
  createCategorySchema,
  idParamsSchema,
  updateCategorySchema,
} from "../schemas/categories.schema.js";

const router = Router();

// GET    /api/categories                  → todas (activas, desactivadas y eliminadas)
// GET    /api/categories/active           → solo activas y no eliminadas (desplegables del formulario de planes)
// GET    /api/categories/deleted          → solo eliminadas (soft delete)
// GET    /api/categories/:id              → una categoría activa por su id
// POST   /api/categories                  → crear (el slug se genera a partir del nombre)
// PATCH  /api/categories/:id              → modificar (si cambia el nombre, cambia el slug)
// PATCH  /api/categories/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminada → 409
// PATCH  /api/categories/:id/softdelete   → borrado lógico. Si la usan planes → 409

router.get("/", categoriesCtrl.getCategories);
router.get("/active", categoriesCtrl.getActiveCategories);
router.get("/deleted", categoriesCtrl.getDeletedCategories);
router.get("/:id", validate({ params: idParamsSchema }), categoriesCtrl.getCategoryById);
router.post("/", validate({ body: createCategorySchema }), categoriesCtrl.postCategory);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), categoriesCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), categoriesCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateCategorySchema }), categoriesCtrl.patchCategory);

export default router;
