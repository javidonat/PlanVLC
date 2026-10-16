import { Router } from "express";
import venuesCtrl from "../ctrls/venues.ctrl.js";

const router = Router();

// GET    /api/venues/active   → obtener solo los activos y no eliminados (para los desplegables del formulario de planes)
router.get("/active", venuesCtrl.getActiveVenues);

export default router;
