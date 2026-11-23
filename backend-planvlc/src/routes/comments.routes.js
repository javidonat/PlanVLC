import { Router } from "express";
import commentsCtrl from "../ctrls/comments.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin } from "../middleware/authorization.js";
import { createCommentSchema, idParamsSchema, listCommentsQuerySchema } from "../schemas/comments.schema.js";

const router = Router();

// GET    /api/comments?plan=<slug>      → comentarios del plan, los más nuevos primero, y su media (stats).
//                                         Público. Opcional: page y limit (sin page, todos)
// GET    /api/comments/summary          → solo admin. Por cada plan con comentarios: count, average y lastCommentAt
// POST   /api/comments                  → con sesión (authenticate). Body: planId, rating (1-5), text. El autor es el usuario de la sesión
// PATCH  /api/comments/:id/softdelete   → con sesión. Solo el autor del comentario o un admin (si no → 403)

router.get("/", validate({ query: listCommentsQuerySchema }), commentsCtrl.getComments);
router.get("/summary", authenticate, isAdmin, commentsCtrl.getSummary);
router.post("/", authenticate, validate({ body: createCommentSchema }), commentsCtrl.postComment);
router.patch("/:id/softdelete", authenticate, validate({ params: idParamsSchema }), commentsCtrl.patchSoftDelete);

export default router;
