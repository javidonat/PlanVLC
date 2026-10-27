import { Component, OnInit, inject, signal } from '@angular/core';
import { Profile } from '../../../../core/models/profile.model';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ProfileCard } from '../../components/profile-card/profile-card';

// Perfil del usuario autenticado: sus datos (AuthStore) y su perfil (GET /api/profiles/:userId)
@Component({
  selector: 'app-profile-page',
  imports: [SkeletonLoader, ErrorState, ProfileCard],
  templateUrl: './profile-page.html',
})
export class ProfilePage implements OnInit {
  private readonly service = inject(ProfilesService);
  readonly auth = inject(AuthStore);

  readonly profile = signal<Profile | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);

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
}
