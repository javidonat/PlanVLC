import { Wishlist } from "../models/index.js";

// Consultas de la lista de deseos (usuario ↔ plan)
const VISIBLE_PLAN = { status: "published", isActive: true, deletedAt: null };

// Datos del plan para pintar la lista (también los usa likes.repo.js)
export const SAVED_PLAN_POPULATE = {
  path: "planId",
  match: VISIBLE_PLAN,
  select: "title slug shortDescription priceFrom",
  populate: { path: "coverImage", select: "url alt" },
};

// Lista del usuario, lo último guardado primero, con los datos básicos del plan.
// Los planes que ya no se ven en la tienda (despublicados o eliminados) no salen
const findByUser = async (userId) => {
  const items = await Wishlist.find({ userId })
    .populate(SAVED_PLAN_POPULATE)
    .sort({ createdAt: -1 })
    .lean();
  return items.filter((item) => item.planId);
};

const exists = async (userId, planId) => Boolean(await Wishlist.exists({ userId, planId }));

const create = (userId, planId) => Wishlist.create({ userId, planId });

// Devuelve true si estaba en la lista y se ha quitado
const remove = async (userId, planId) => (await Wishlist.deleteOne({ userId, planId })).deletedCount > 0;

export default { findByUser, exists, create, remove };
