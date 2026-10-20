import { Router } from "express";
import imagesCtrl from "../ctrls/images.ctrl.js";
import validate from "../middleware/validate.js";
import { activeSchema, createImageSchema, idParamsSchema, updateImageSchema } from "../schemas/images.schema.js";

const router = Router();

// GET    /api/images                  → todas (activas, desactivadas y eliminadas), con entityName
// GET    /api/images/active           → solo activas y no eliminadas (_id, url, alt)
// GET    /api/images/deleted          → solo eliminadas (soft delete)
// GET    /api/images/:id              → una imagen activa por su id
// POST   /api/images                  → crear (para un plan, lugar, categoría, organizador o usuario)
// PATCH  /api/images/:id              → modificar (la entidad no se puede cambiar)
// PATCH  /api/images/:id/active       → activar o desactivar (body: { "isActive": true }). Eliminada → 409
// PATCH  /api/images/:id/softdelete   → borrado lógico

// validate(...) comprueba params y body con Zod antes de llegar al controlador
router.get("/", imagesCtrl.getImages); // todas
router.get("/active", imagesCtrl.getActiveImages); // solo activas
router.get("/deleted", imagesCtrl.getDeletedImages); // solo eliminadas
router.get("/:id", validate({ params: idParamsSchema }), imagesCtrl.getImageById);
router.post("/", validate({ body: createImageSchema }), imagesCtrl.postImage);
router.patch("/:id/active", validate({ params: idParamsSchema, body: activeSchema }), imagesCtrl.patchActive);
router.patch("/:id/softdelete", validate({ params: idParamsSchema }), imagesCtrl.patchSoftDelete);
router.patch("/:id", validate({ params: idParamsSchema, body: updateImageSchema }), imagesCtrl.patchImage);

export default router;
