import likesRepo from "../repos/likes.repo.js";
import shopRepo from "../repos/shop.repo.js";
import AppError from "./utils/AppError.js";

// Likes de los planes: cualquiera ve cuántos tiene un plan; dar o quitar like exige sesión.
// Cada usuario puede dar un solo like a cada plan (409 si lo repite) y quitarlo (404 si no lo había dado)

const ensurePlan = async (planId) => {
  if (!(await shopRepo.planIsVisible(planId))) throw new AppError("Plan no encontrado", 404);
};

// GET /api/likes/:planId
const getPlanLikes = async (planId) => {
  await ensurePlan(planId);
  return { planId, count: await likesRepo.countByPlan(planId) };
};

// GET /api/likes/me
const getMyLikes = (user) => likesRepo.findPlanIdsByUser(user.id);

// POST /api/likes
const like = async (user, planId) => {
  await ensurePlan(planId);
  if (await likesRepo.exists(user.id, planId)) throw new AppError("Ya le has dado like a este plan", 409);
  try {
    await likesRepo.create(user.id, planId);
  } catch (error) {
    // Dos peticiones a la vez: el índice único rechaza la segunda
    if (error.code === 11000) throw new AppError("Ya le has dado like a este plan", 409);
    throw error;
  }
  return { planId, liked: true, count: await likesRepo.countByPlan(planId) };
};

// DELETE /api/likes/:planId
const unlike = async (user, planId) => {
  if (!(await likesRepo.remove(user.id, planId))) throw new AppError("No le habías dado like a este plan", 404);
  return { planId, liked: false, count: await likesRepo.countByPlan(planId) };
};

export default { getPlanLikes, getMyLikes, like, unlike };
