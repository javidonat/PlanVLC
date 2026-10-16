import { Router } from "express";
import organizersCtrl from "../ctrls/organizers.ctrl.js";

const router = Router();

// GET    /api/organizers/active   → obtener solo los activos y no eliminados (para los desplegables del formulario de planes)
router.get("/active", organizersCtrl.getActiveOrganizers);

export default router;
