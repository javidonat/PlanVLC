import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AdminProfile } from '../../../../core/models/profile.model';
import { ProfilesService } from '../../../../core/services/profiles.service';
import { ProfilesStore } from '../../../../core/stores/profiles.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ProfileTable } from '../../components/profile-table/profile-table';

@Component({
  selector: 'app-profile-list',
  imports: [SkeletonLoader, EmptyState, ErrorState, ProfileTable],
  templateUrl: './profile-list.html',
})
export class ProfileList implements OnInit {
  readonly store = inject(ProfilesStore);
  private readonly service = inject(ProfilesService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Siempre se recarga: el estado del perfil cambia al activar, desactivar o eliminar su usuario
    void this.load();
  }

  async load(): Promise<void> {
    try {
      this.store.setLoading(true);
      this.store.setError(null);
      const res = await this.service.getAll();
      this.store.setItems(res.data);
    } catch (error) {
      this.store.setError(apiError(error).message);
    } finally {
      this.store.setLoading(false);
    }
  }

  onEdit(profile: AdminProfile): void {
    if (!profile.userId) return;
    void this.router.navigate(['/admin/perfiles', profile.userId._id, 'editar']);
  }
}
