import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { AuthStore } from '../stores/auth.store';
import { ApiResponse } from '../models/api.model';
import { AuthUser, LoginPayload, RegisterPayload } from '../models/auth.model';

// Registro, login, logout, refresh y loadUser: habla con la API y actualiza AuthStore.
// Los tokens van en cookies httpOnly: los pone y los borra el backend, y el navegador los manda solo
// en cada petición (withCredentials, lo añade authInterceptor). Aquí nunca se ven ni se guardan
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly store = inject(AuthStore);

  // Refresh en curso: si fallan varias peticiones a la vez con 401, todas esperan al mismo refresh
  private refreshing: Promise<boolean> | null = null;

  // Crea la cuenta de cliente. No inicia sesión: después se va al login
  async register(payload: RegisterPayload): Promise<void> {
    await this.api.post<ApiResponse<AuthUser>>('auth/register', payload);
  }

  // El backend deja las cookies y devuelve el usuario
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await this.api.post<ApiResponse<AuthUser>>('auth/login', payload);
    this.store.setUser(res.data);
    return res.data;
  }

  // El backend revoca los tokens y borra las cookies; aunque falle (sin conexión...) la sesión se cierra igual
  async logout(): Promise<void> {
    try {
      await this.api.post('auth/logout', {});
    } catch {
      // nada: se limpia la sesión de todas formas
    } finally {
      this.store.clear();
    }
  }

  // Al arrancar la app (F5): pide al backend quién es el usuario de las cookies (GET /api/auth/me).
  // Si el access token ha caducado, authInterceptor hace el refresh y repite la petición.
  // Sin sesión (o si el refresh también falla) el usuario queda a null
  async loadUser(): Promise<void> {
    try {
      const res = await this.api.get<ApiResponse<AuthUser>>('auth/me');
      this.store.setUser(res.data);
    } catch {
      this.store.clear();
    }
  }

  // Pide cookies nuevas con el refresh token (POST /api/auth/refresh). true si ha ido bien
  refresh(): Promise<boolean> {
    this.refreshing ??= this.api.post('auth/refresh', {})
      .then(() => true)
      .catch(() => false)
      .finally(() => (this.refreshing = null));
    return this.refreshing;
  }

  // Al cambiar el avatar en el perfil: actualiza el navbar
  updateAvatar(avatar: string | null): void {
    this.store.updateUser({ avatar });
  }

  // Borra el usuario de la sesión (el refresh ha fallado: las cookies ya no valen)
  clearSession(): void {
    this.store.clear();
  }
}
