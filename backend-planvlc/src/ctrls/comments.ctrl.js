import commentsService from "../services/comments.service.js";

// GET /api/comments?plan=<slug>
const getComments = async (req, res, next) => {
  try {
    const { items, stats, ...pagination } = await commentsService.getPlanComments(req.query);
    res.status(200).json({ ok: true, total: items.length, ...pagination, stats, data: items });
  } catch (error) {
    next(error);
  }
};

// GET /api/comments/summary
const getSummary = async (_req, res, next) => {
  try {
    const data = await commentsService.getSummary();
    res.status(200).json({ ok: true, total: data.length, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/comments (req.user lo pone el middleware de autenticación)
const postComment = async (req, res, next) => {
  try {
    const data = await commentsService.createComment(req.user, req.body);
    res.status(201).json({ ok: true, message: "Comentario publicado", data });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/comments/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    await commentsService.deleteComment(req.user, req.params.id);
    res.status(200).json({ ok: true, message: "Comentario borrado" });
  } catch (error) {
    next(error);
  }
};

export default { getComments, getSummary, postComment, patchSoftDelete };
