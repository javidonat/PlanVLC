// Likes de los planes. Backend: routes/likes.routes.js
// Ver cuántos likes tiene un plan es público; dar o quitar like exige sesión (uno por usuario y plan)

// GET /api/likes/:planId → { planId, count }
export interface PlanLikes {
  planId: string;
  count: number;
}

// POST /api/likes y DELETE /api/likes/:planId → cómo queda: si le has dado like y el total
export interface LikeState extends PlanLikes {
  liked: boolean;
}
