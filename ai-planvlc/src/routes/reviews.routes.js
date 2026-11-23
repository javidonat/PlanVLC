import { Router } from "express";
import reviewsCtrl from "../ctrls/reviews.ctrl.js";
import validate from "../middleware/validate.js";
import { reviewsAnalysisSchema } from "../schemas/reviews.schema.js";

const router = Router();

// POST /api/ai/reviews-analysis → analiza los comentarios de un plan
// body: { plan: { title }, comments: [{ rating, text }] } (los envía el frontend: el servicio no lee la BD)
// data: { summary, sentiment (positive | mixed | neutral | negative), score (0-100), positives[], negatives[] }
// El detalle del plan muestra el resumen (summary) y el panel admin, el sentimiento
router.post("/reviews-analysis", validate({ body: reviewsAnalysisSchema }), reviewsCtrl.postReviewsAnalysis);

export default router;
