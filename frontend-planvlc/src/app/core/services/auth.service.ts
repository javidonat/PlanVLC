import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthStore } from '../stores/auth.store';
import { ApiResponse } from '../models/api.model';
import { AuthUser, LoginPayload, LoginResponse } from '../models/auth.model';

// Claves de localStorage. El token lo lee también el interceptor de autenticación
export const TOKEN_KEY = 'planvlc.token';
const USER_KEY = 'planvlc.user';

// Login y logout: habla con la API, guarda el JWT en localStorage y actualiza AuthStore
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly store = inject(AuthStore);

  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await this.api.post<ApiResponse<LoginResponse>>('auth/login', payload);
    const { token, user } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.store.setSession(token, user);
    return user;
  }

  // El backend invalida el token; aunque falle (sin conexión, token caducado...) la sesión se cierra igual
  async logout(): Promise<void> {
    try {
      if (this.store.token()) await this.api.post('auth/logout', {});
    } catch {
      // nada: se limpia la sesión de todas formas
    } finally {
      this.clearSession();
    }
  }

  // Al cambiar el avatar en el perfil: actualiza el navbar y la sesión guardada
  updateAvatar(avatar: string | null): void {
    this.store.updateUser({ avatar });
    const user = this.store.user();
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  // Borra el token y el usuario (logout o 401 del backend)
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.store.clear();
  }

  // Al arrancar la app: recupera la sesión guardada si el token no ha caducado
  restoreSession(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = this.readUser();
    if (!token || !user || isExpired(token)) {
      this.clearSession();
      return;
    }
    this.store.setSession(token, user);
  }

  private readUser(): AuthUser | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as AuthUser | null;
    } catch {
      return null;
    }
  }
}

// El payload del JWT es JSON en base64url; exp va en segundos
function isExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const { exp } = JSON.parse(atob(payload)) as { exp?: number };
    return !exp || Date.now() >= exp * 1000;
  } catch {
    return true;
  }
}
