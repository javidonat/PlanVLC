import chatService from "../services/chat.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// POST /api/ai/plan-chat
const postPlanChat = async (req, res, next) => {
  try {
    const answer = await chatService.answerPlanQuestion(req.body);
    res.status(200).json({ ok: true, data: { role: "assistant", content: answer } });
  } catch (error) {
    next(error);
  }
};

export default { postPlanChat };
