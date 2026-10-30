import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthStore } from '../stores/auth.store';
import { ApiResponse } from '../models/api.model';
import { AuthUser, LoginPayload, LoginResponse } from '../models/auth.model';

// Clave de localStorage del token. La lee también el interceptor de autenticación.
// Solo se guarda el token: los datos del usuario se piden al backend con GET /api/auth/me
export const TOKEN_KEY = 'planvlc.token';

// Login, logout y me: habla con la API, guarda el JWT en localStorage y actualiza AuthStore
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly store = inject(AuthStore);

  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await this.api.post<ApiResponse<LoginResponse>>('auth/login', payload);
    const { token, user } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
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

  // Al cambiar el avatar en el perfil: actualiza el navbar
  updateAvatar(avatar: string | null): void {
    this.store.updateUser({ avatar });
  }

  // Borra el token y el usuario (logout o 401 del backend)
  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    this.store.clear();
  }

  // Al arrancar la app: si hay un token sin caducar, pide al backend quién es el usuario (GET /api/auth/me).
  // Así el nombre y el rol vienen siempre del servidor y no de localStorage, donde se podrían modificar.
  // Si el backend lo rechaza (logout, usuario desactivado...), se cierra la sesión
  async restoreSession(): Promise<void> {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || isExpired(token)) {
      this.clearSession();
      return;
    }
    try {
      const res = await this.api.get<ApiResponse<AuthUser>>('auth/me');
      this.store.setSession(token, res.data);
    } catch {
      this.clearSession();
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
