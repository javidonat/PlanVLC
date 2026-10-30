import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { AuthStore } from '../../../../core/stores/auth.store';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ProfileForm } from '../../../profile/components/profile-form/profile-form';

// Un admin edita el perfil de cualquier usuario. Reutiliza el formulario de "Mi perfil"
@Component({
  selector: 'app-profile-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, ProfileForm],
  templateUrl: './profile-edit.html',
})
export class ProfileEdit implements OnInit {
  private readonly service = inject(ProfilesService);
  private readonly store = inject(ProfilesStore);
  private readonly auth = inject(AuthStore);
  private readonly authService = inject(AuthService);
  readonly router = inject(Router);

  // :userId de la URL (withComponentInputBinding en app.config.ts)
  readonly userId = input.required<string>();

  // Nombre del usuario para la cabecera (viene del listado)
  readonly userName = computed(() => this.store.findByUserId(this.userId())?.userId?.name ?? null);

  readonly profile = signal<Profile | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const res = await this.service.getByUserId(this.userId());
      this.profile.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: ProfilePayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(this.userId(), payload);
      // Si el admin edita su propio perfil, el navbar muestra el avatar nuevo
      if (this.auth.user()?._id === this.userId()) this.authService.updateAvatar(res.data.avatar);
      await this.router.navigate(['/admin/perfiles']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
