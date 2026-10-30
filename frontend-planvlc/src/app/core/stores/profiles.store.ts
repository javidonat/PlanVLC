import { Injectable, computed, signal } from '@angular/core';
import { AdminProfile } from '../models/profile.model';

// Estado compartido de los perfiles del panel. Solo guarda datos: las páginas llaman al servicio
// y actualizan el store. Las señales privadas solo se modifican desde aquí.
@Injectable({ providedIn: 'root' })
export class ProfilesStore {
  private readonly _items = signal<AdminProfile[]>([]);
  private readonly _loading = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _loaded = signal(false);

  readonly items = this._items.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  readonly count = computed(() => this._items().length);
  readonly isEmpty = computed(() => !this._loading() && this._items().length === 0);

  setLoading(value: boolean): void {
    this._loading.set(value);
  }

  setError(value: string | null): void {
    this._error.set(value);
  }

  setItems(items: AdminProfile[]): void {
    this._items.set(items);
    this._loaded.set(true);
  }

  findByUserId(userId: string): AdminProfile | undefined {
    return this._items().find(entry => entry.userId?._id === userId);
  }
}
