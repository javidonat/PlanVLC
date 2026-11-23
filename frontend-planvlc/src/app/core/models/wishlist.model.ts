// Lista de deseos: planes que el usuario guarda. Backend: routes/wishlist.routes.js (todo con sesión).
// GET /api/wishlist devuelve SavedPlanItem[] (ver saved-plan.model.ts)

// POST /api/wishlist y DELETE /api/wishlist/:planId → cómo queda
export interface WishlistState {
  planId: string;
  inWishlist: boolean;
}
