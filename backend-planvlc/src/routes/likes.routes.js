import { Router } from "express";
import likesCtrl from "../ctrls/likes.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { planBodySchema, planParamsSchema } from "../schemas/planRef.schema.js";

const router = Router();

// GET    /api/likes/me        → con sesión. Planes a los que el usuario ha dado like (con title, slug, shortDescription, priceFrom y coverImage)
// GET    /api/likes/:planId   → público. Número de likes del plan
// POST   /api/likes           → con sesión. Body: planId. Si ya le habías dado like → 409
// DELETE /api/likes/:planId   → con sesión. Quita tu like. Si no lo habías dado → 404
// (/me va antes que /:planId para que "me" no se tome como un id)

router.get("/me", authenticate, likesCtrl.getMyLikes);
router.get("/:planId", validate({ params: planParamsSchema }), likesCtrl.getPlanLikes);
router.post("/", authenticate, validate({ body: planBodySchema }), likesCtrl.postLike);
router.delete("/:planId", authenticate, validate({ params: planParamsSchema }), likesCtrl.deleteLike);

export default router;
