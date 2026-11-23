import { ImageRef } from './plan.model';

// Planes guardados por el usuario: los que tienen su like (GET /api/likes/me)
// y los de su lista de deseos (GET /api/wishlist). Las dos listas traen el mismo formato

export interface SavedPlan {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  priceFrom: number; // 0 = gratis
  coverImage?: ImageRef | null;
}

export interface SavedPlanItem {
  _id: string;
  planId: SavedPlan;
  createdAt: string;
}
