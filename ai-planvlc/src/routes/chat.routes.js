import { Router } from "express";
import chatCtrl from "../ctrls/chat.ctrl.js";
import validate from "../middleware/validate.js";
import { planChatSchema } from "../schemas/chat.schema.js";

const router = Router();

// POST /api/ai/plan-chat → responde una pregunta sobre un plan
// body: { plan: {...}, sessions: [...], messages: [{ role: "user" | "assistant", content }] }
// El último mensaje es la pregunta del usuario. Los datos del plan los envía el frontend (el servicio no lee la BD)
router.post("/plan-chat", validate({ body: planChatSchema }), chatCtrl.postPlanChat);

export default router;
