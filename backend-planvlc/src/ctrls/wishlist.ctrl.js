import wishlistService from "../services/wishlist.service.js";

// GET /api/wishlist (req.user lo pone el middleware de autenticación)
const getWishlist = async (req, res, next) => {
  try {
    const data = await wishlistService.getMyWishlist(req.user);
    res.status(200).json({ ok: true, total: data.length, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/wishlist
const postWishlist = async (req, res, next) => {
  try {
    const data = await wishlistService.add(req.user, req.body.planId);
    res.status(201).json({ ok: true, message: "Plan guardado en tu lista de deseos", data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/wishlist/:planId
const deleteWishlist = async (req, res, next) => {
  try {
    const data = await wishlistService.remove(req.user, req.params.planId);
    res.status(200).json({ ok: true, message: "Plan quitado de tu lista de deseos", data });
  } catch (error) {
    next(error);
  }
};

export default { getWishlist, postWishlist, deleteWishlist };
