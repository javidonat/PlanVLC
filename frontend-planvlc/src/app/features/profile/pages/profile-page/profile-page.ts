import { Component, OnInit, inject, signal } from '@angular/core';
import { LucidePencil } from '@lucide/angular';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ProfileCard } from '../../components/profile-card/profile-card';
import { ProfileForm } from '../../components/profile-form/profile-form';

// Perfil del usuario autenticado: sus datos (AuthStore) y su perfil (GET /api/profiles/:userId).
// Con "Editar" se cambia la ficha por el formulario (PATCH /api/profiles/:userId)
@Component({
  selector: 'app-profile-page',
  imports: [LucidePencil, SkeletonLoader, ErrorState, ProfileCard, ProfileForm],
  templateUrl: './profile-page.html',
})
export class ProfilePage implements OnInit {
  private readonly service = inject(ProfilesService);
  private readonly authService = inject(AuthService);
  readonly auth = inject(AuthStore);

  readonly profile = signal<Profile | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly editing = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});
  readonly saved = signal(false);

  ngOnInit(): void {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const res = await this.service.getByUserId(user._id);
      this.profile.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  startEdit(): void {
    this.error.set(null);
    this.serverErrors.set({});
    this.saved.set(false);
    this.editing.set(true);
  }

  async onSubmit(payload: ProfilePayload): Promise<void> {
    const user = this.auth.user();
    if (!user) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(user._id, payload);
      this.profile.set(res.data);
      this.authService.updateAvatar(res.data.avatar); // el navbar muestra el avatar nuevo
      this.editing.set(false);
      this.saved.set(true);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
