import { Like } from "../models/index.js";
import { SAVED_PLAN_POPULATE } from "./wishlist.repo.js";

// Consultas de likes (usuario ↔ plan)
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
