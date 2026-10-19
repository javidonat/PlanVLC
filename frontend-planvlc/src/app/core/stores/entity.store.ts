import { computed, signal } from '@angular/core';

// Estado compartido de una colección del panel (categorías, lugares, organizadores...).
// Funciona igual que PlansStore: solo guarda datos; las páginas llaman al servicio y actualizan el store.
// Cada colección tiene su store, que hereda de este: export class CategoriesStore extends EntityStore<Category> {}
export class EntityStore<T extends { _id: string }> {
  private readonly _items = signal<T[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);
  private readonly _busyId = signal<string | null>(null); // elemento con una acción en curso

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly busyId = this._busyId.asReadonly();

  readonly count = computed(() => this._items().length);
  readonly isEmpty = computed(() => !this._loading() && this._items().length === 0);

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  setBusy(id: string | null): void {
    this._busyId.set(id);
  }

  setItems(items: T[]): void {
    this._items.set(items);
    this._loaded.set(true);
  }

  // Crea o sustituye un elemento en la lista
  upsert(item: T): void {
    this._items.update(current => {
      const index = current.findIndex(entry => entry._id === item._id);
      if (index === -1) return [item, ...current];
      const next = [...current];
      next[index] = item;
      return next;
    });
  }

  findById(id: string): T | undefined {
    return this._items().find(entry => entry._id === id);
  }
}
