import { Router } from "express";
import imagesCtrl from "../ctrls/images.ctrl.js";

const router = Router();

// GET    /api/images/active   → obtener solo los activos y no eliminados (para los desplegables del formulario de planes)
router.get("/active", imagesCtrl.getActiveImages);

export default router;
