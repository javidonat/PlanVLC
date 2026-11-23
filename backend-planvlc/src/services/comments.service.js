import mongoose from "mongoose";
import commentsRepo from "../repos/comments.repo.js";
import shopRepo from "../repos/shop.repo.js";
import AppError from "./utils/AppError.js";
import { listLimit, toList } from "./utils/list.util.js";
import { canAccessUserResource } from "../middleware/authorization.js";

// Comentarios de los planes: cualquiera los lee, para escribir hay que estar logueado
// y cada usuario solo puede borrar los suyos (un admin, todos)

// GET /api/comments?plan=<slug>: comentarios del plan (paginados si llega page) y su media
const getPlanComments = async ({ plan: slug, ...query }) => {
  const planId = await shopRepo.findPlanIdBySlug(slug);
  if (!planId) {
    throw new AppError("Plan no encontrado", 404);
  }
  const limit = listLimit(query);
  const [result, stats] = await Promise.all([commentsRepo.findByPlan(planId, { page: query.page, limit }), commentsRepo.statsByPlan(planId)]);
  return { ...toList(result, query.page, limit), stats };
};

// GET /api/comments/summary (admin): resumen por plan para el panel
const getSummary = () => commentsRepo.summaryByPlan();

// POST /api/comments: el autor es siempre el usuario de la sesión (no se puede comentar en nombre de otro)
const createComment = async (user, { planId, rating, text }) => {
  if (!(await shopRepo.planIsVisible(planId))) {
    throw new AppError("Plan no encontrado", 404);
  }
  return commentsRepo.create({ planId, rating, text, userId: user.id });
};

// PATCH /api/comments/:id/softdelete: solo el autor del comentario o un admin (ABAC)
const deleteComment = async (user, id) => {
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id del comentario no es válido", 400);
  }
  const comment = await commentsRepo.findById(id);
  if (!comment) {
    throw new AppError("Comentario no encontrado", 404);
  }
  if (!canAccessUserResource(user, comment.userId)) {
    throw new AppError("Solo puedes borrar tus propios comentarios", 403);
  }
  await commentsRepo.softDelete(id);
};

export default { getPlanComments, getSummary, createComment, deleteComment };
