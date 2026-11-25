import { Injectable, computed, signal } from '@angular/core';
import { SavedPlan, SavedPlanItem } from '../models/saved-plan.model';

// Planes con like del usuario de la sesión. Solo guarda datos:
// los carga ShopLayout al iniciar sesión (y los borra al cerrarla) y el detalle del plan
// los actualiza al dar/quitar like. Así el corazón sale marcado en los planes que te gustan
@Injectable({ providedIn: 'root' })
export class SavedPlansStore {
  private readonly _likes = signal<SavedPlanItem[]>([]);

  readonly likes = this._likes.asReadonly();
  readonly likedIds = computed(() => new Set(this._likes().map(item => item.planId._id)));

  setLikes(items: SavedPlanItem[]): void {
    this._likes.set(items);
  }

  // Al añadir, el plan va el primero (como lo devuelve el backend: lo último primero)
  addLike(plan: SavedPlan): void {
    this._likes.update(items => [toItem(plan), ...items.filter(item => item.planId._id !== plan._id)]);
  }

  removeLike(planId: string): void {
    this._likes.update(items => items.filter(item => item.planId._id !== planId));
  }

  clear(): void {
    this._likes.set([]);
  }
}

function toItem(plan: SavedPlan): SavedPlanItem {
  return { _id: plan._id, planId: plan, createdAt: new Date().toISOString() };
}
