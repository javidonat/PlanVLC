import { Like } from "../models/index.js";

// Consultas de likes (usuario ↔ plan). Los planes con like son la wishlist del usuario
const VISIBLE_PLAN = { status: "published", isActive: true, deletedAt: null };

// Datos del plan para pintar la lista
const SAVED_PLAN_POPULATE = {
  path: "planId",
  match: VISIBLE_PLAN,
  select: "title slug shortDescription priceFrom",
  populate: { path: "coverImage", select: "url alt" },
};

const countByPlan = (planId) => Like.countDocuments({ planId });

const exists = async (userId, planId) => Boolean(await Like.exists({ userId, planId }));

// Planes a los que el usuario ha dado like, el último primero, con los datos básicos del plan.
// Los que ya no se ven en la tienda no salen
const findByUser = async (userId) => {
  const items = await Like.find({ userId }).populate(SAVED_PLAN_POPULATE).sort({ createdAt: -1 }).lean();
  return items.filter((item) => item.planId);
};

const create = (userId, planId) => Like.create({ userId, planId });

// Devuelve true si había like y se ha quitado
const remove = async (userId, planId) => (await Like.deleteOne({ userId, planId })).deletedCount > 0;

export default { countByPlan, exists, findByUser, create, remove };
