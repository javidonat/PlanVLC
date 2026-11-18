import { Injectable, computed, signal } from '@angular/core';
import { ADMIN_ROLE, AuthUser } from '../models/auth.model';

// Estado de la sesión: el usuario y su rol. Solo guarda datos: AuthService hace el login/logout
// y lo actualiza. La señal privada solo se modifica desde aquí. Los tokens no están aquí:
// van en cookies httpOnly que el navegador manda solo
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _user = signal<AuthUser | null>(null);

  readonly user = this._user.asReadonly();
  readonly role = computed(() => this._user()?.role ?? null);

  readonly isAuthenticated = computed(() => !!this._user());
  readonly isAdmin = computed(() => this.role() === ADMIN_ROLE);

  // Iniciales para el avatar (ej. "Admin PlanVLC" → "AP")
  readonly initials = computed(() =>
    (this._user()?.name ?? '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(word => word[0].toUpperCase())
      .join(''),
  );

  hasRole(role: string): boolean {
    return this.role() === role;
  }

  setUser(user: AuthUser): void {
    this._user.set(user);
  }

  // Cambia datos del usuario (ej. el avatar al editar el perfil)
  updateUser(changes: Partial<AuthUser>): void {
    this._user.update(user => (user ? { ...user, ...changes } : user));
  }

  clear(): void {
    this._user.set(null);
  }
}
