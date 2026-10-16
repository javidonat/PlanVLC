import { Router } from "express";
import categoriesCtrl from "../ctrls/categories.ctrl.js";

const router = Router();

// GET    /api/categories/active   → obtener solo los activos y no eliminados (para los desplegables del formulario de planes)
router.get("/active", categoriesCtrl.getActiveCategories);

export default router;
