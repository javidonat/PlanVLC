import wishlistRepo from "../repos/wishlist.repo.js";
import shopRepo from "../repos/shop.repo.js";
import AppError from "./utils/AppError.js";

// Lista de deseos: cada usuario solo ve y cambia la suya (el usuario sale siempre de la sesión).
// Un plan no puede estar dos veces (409) y no se puede quitar uno que no está (404)

// GET /api/wishlist
const getMyWishlist = (user) => wishlistRepo.findByUser(user.id);

// POST /api/wishlist
const add = async (user, planId) => {
  if (!(await shopRepo.planIsVisible(planId))) throw new AppError("Plan no encontrado", 404);
  if (await wishlistRepo.exists(user.id, planId)) throw new AppError("Este plan ya está en tu lista de deseos", 409);
  try {
    await wishlistRepo.create(user.id, planId);
  } catch (error) {
    if (error.code === 11000) throw new AppError("Este plan ya está en tu lista de deseos", 409);
    throw error;
  }
  return { planId, inWishlist: true };
};

// DELETE /api/wishlist/:planId
const remove = async (user, planId) => {
  if (!(await wishlistRepo.remove(user.id, planId))) throw new AppError("Este plan no está en tu lista de deseos", 404);
  return { planId, inWishlist: false };
};

export default { getMyWishlist, add, remove };
