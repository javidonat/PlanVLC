import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { AdminProfile, Profile, ProfilePayload } from '../models/profile.model';

// Solo habla con la API. El backend solo deja ver el perfil propio (o cualquiera si eres admin)
@Injectable({ providedIn: 'root' })
export class ProfilesService {
  private readonly api = inject(ApiService);
  private readonly path = 'profiles';

  // Todos los perfiles, con el nombre y el email de su usuario (solo admin, para el panel)
  async getAll(): Promise<ApiListResponse<AdminProfile>> {
    return this.api.get<ApiListResponse<AdminProfile>>(this.path);
  }

  async getByUserId(userId: string): Promise<ApiResponse<Profile>> {
    return this.api.get<ApiResponse<Profile>>(`${this.path}/${encodeURIComponent(userId)}`);
  }

  async update(userId: string, payload: ProfilePayload): Promise<ApiResponse<Profile>> {
    return this.api.patch<ApiResponse<Profile>>(`${this.path}/${encodeURIComponent(userId)}`, payload);
  }
}
