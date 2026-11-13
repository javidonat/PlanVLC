import { Router } from "express";
import shopCtrl from "../ctrls/shop.ctrl.js";
import validate from "../middleware/validate.js";
import { shopPlansQuerySchema, shopSessionsQuerySchema, slugParamsSchema } from "../schemas/shop.schema.js";

const router = Router();

// Tienda pública (no piden token). Solo devuelve lo activo, no eliminado y publicado
// GET    /api/shop/categories            → categorías (carrusel del home y filtro)
// GET    /api/shop/organizers            → organizadores (carrusel del home y filtro)
// GET    /api/shop/venues                → lugares (carrusel del home y filtro)
// GET    /api/shop/plans                 → planes paginados. Query params opcionales y combinables:
//                                          category, organizer, venue (slugs), minPrice, maxPrice, search (título),
//                                          sort (popular por defecto, recent, date, price_asc, price_desc, name), page, limit
// GET    /api/shop/sessions              → sesiones de un mes (vista calendario): month (AAAA-MM) y los mismos filtros
// GET    /api/shop/plans/:slug           → detalle de un plan (suma una visita)
// GET    /api/shop/plans/:slug/sessions  → sus próximas sesiones (fecha, aforo, plazas y precio)

router.get("/categories", shopCtrl.getCategories);
router.get("/organizers", shopCtrl.getOrganizers);
router.get("/venues", shopCtrl.getVenues);
router.get("/plans", validate({ query: shopPlansQuerySchema }), shopCtrl.getPlans);
router.get("/sessions", validate({ query: shopSessionsQuerySchema }), shopCtrl.getSessions);
router.get("/plans/:slug", validate({ params: slugParamsSchema }), shopCtrl.getPlanBySlug);
router.get("/plans/:slug/sessions", validate({ params: slugParamsSchema }), shopCtrl.getPlanSessions);

export default router;
