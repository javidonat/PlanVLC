import { Injectable, computed, signal } from '@angular/core';
import { ADMIN_ROLE, AuthUser } from '../models/auth.model';

// Estado de la sesión. Solo guarda datos: AuthService hace el login/logout
// y lo actualiza. Las señales privadas solo se modifican desde aquí.
@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly _token = signal<string | null>(null);
  private readonly _user = signal<AuthUser | null>(null);

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();

  readonly isAuthenticated = computed(() => !!this._token() && !!this._user());
  readonly isAdmin = computed(() => this._user()?.role === ADMIN_ROLE);

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
    return this._user()?.role === role;
  }

  setSession(token: string, user: AuthUser): void {
    this._token.set(token);
    this._user.set(user);
  }

  clear(): void {
    this._token.set(null);
    this._user.set(null);
  }
}
