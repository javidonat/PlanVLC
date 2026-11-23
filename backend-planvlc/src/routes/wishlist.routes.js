import { Router } from "express";
import wishlistCtrl from "../ctrls/wishlist.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { planBodySchema, planParamsSchema } from "../schemas/planRef.schema.js";

const router = Router();

// Todo con sesión: cada usuario solo ve y cambia su propia lista (el usuario sale de la cookie, no de la URL)
// GET    /api/wishlist            → tu lista, lo último guardado primero, con { title, slug, shortDescription, priceFrom } del plan
// POST   /api/wishlist            → Body: planId. Si ya estaba → 409
// DELETE /api/wishlist/:planId    → lo quita de tu lista. Si no estaba → 404

router.use(authenticate);
router.get("/", wishlistCtrl.getWishlist);
router.post("/", validate({ body: planBodySchema }), wishlistCtrl.postWishlist);
router.delete("/:planId", validate({ params: planParamsSchema }), wishlistCtrl.deleteWishlist);

export default router;
