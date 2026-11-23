import likesService from "../services/likes.service.js";

// GET /api/likes/:planId (público)
const getPlanLikes = async (req, res, next) => {
  try {
    const data = await likesService.getPlanLikes(req.params.planId);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

// GET /api/likes/me (req.user lo pone el middleware de autenticación)
const getMyLikes = async (req, res, next) => {
  try {
    const data = await likesService.getMyLikes(req.user);
    res.status(200).json({ ok: true, total: data.length, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/likes
const postLike = async (req, res, next) => {
  try {
    const data = await likesService.like(req.user, req.body.planId);
    res.status(201).json({ ok: true, message: "Like añadido", data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/likes/:planId
const deleteLike = async (req, res, next) => {
  try {
    const data = await likesService.unlike(req.user, req.params.planId);
    res.status(200).json({ ok: true, message: "Like quitado", data });
  } catch (error) {
    next(error);
  }
};

export default { getPlanLikes, getMyLikes, postLike, deleteLike };
