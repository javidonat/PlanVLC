import { Injectable, computed, signal } from '@angular/core';
import { SavedPlan, SavedPlanItem } from '../models/saved-plan.model';

// Planes con like y lista de deseos del usuario de la sesión. Solo guarda datos:
// los carga ShopLayout al iniciar sesión (y los borra al cerrarla) y el detalle del plan
// los actualiza al dar/quitar like o guardar/quitar de la lista. Así el header siempre está al día
@Injectable({ providedIn: 'root' })
export class SavedPlansStore {
  private readonly _likes = signal<SavedPlanItem[]>([]);
  private readonly _wishlist = signal<SavedPlanItem[]>([]);

  readonly likes = this._likes.asReadonly();
  readonly wishlist = this._wishlist.asReadonly();
  readonly likedIds = computed(() => new Set(this._likes().map(item => item.planId._id)));
  readonly wishlistIds = computed(() => new Set(this._wishlist().map(item => item.planId._id)));

  setLikes(items: SavedPlanItem[]): void {
    this._likes.set(items);
  }

  setWishlist(items: SavedPlanItem[]): void {
    this._wishlist.set(items);
  }

  // Al añadir, el plan va el primero (como lo devuelve el backend: lo último primero)
  addLike(plan: SavedPlan): void {
    this._likes.update(items => [toItem(plan), ...items.filter(item => item.planId._id !== plan._id)]);
  }

  removeLike(planId: string): void {
    this._likes.update(items => items.filter(item => item.planId._id !== planId));
  }

  addToWishlist(plan: SavedPlan): void {
    this._wishlist.update(items => [toItem(plan), ...items.filter(item => item.planId._id !== plan._id)]);
  }

  removeFromWishlist(planId: string): void {
    this._wishlist.update(items => items.filter(item => item.planId._id !== planId));
  }

  clear(): void {
    this._likes.set([]);
    this._wishlist.set([]);
  }
}

function toItem(plan: SavedPlan): SavedPlanItem {
  return { _id: plan._id, planId: plan, createdAt: new Date().toISOString() };
}
