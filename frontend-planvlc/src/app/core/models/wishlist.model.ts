// Lista de deseos: planes que el usuario guarda. Backend: routes/wishlist.routes.js (todo con sesión)

// GET /api/wishlist → cada elemento trae los datos básicos del plan
export interface WishlistItem {
  _id: string;
  planId: { _id: string; title: string; slug: string; shortDescription: string; priceFrom: number };
  createdAt: string;
}

// POST /api/wishlist y DELETE /api/wishlist/:planId → cómo queda
export interface WishlistState {
  planId: string;
  inWishlist: boolean;
}
