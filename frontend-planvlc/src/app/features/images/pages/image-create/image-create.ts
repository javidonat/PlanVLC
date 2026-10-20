import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { EntityOptions, ImagePayload } from '../../../../core/models/image.model';
import { ImagesService } from '../../../../core/services/images.service';
import { PlansService } from '../../../../core/services/plans.service';
import { VenuesService } from '../../../../core/services/venues.service';
import { CategoriesService } from '../../../../core/services/categories.service';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { UsersService } from '../../../../core/services/users.service';
import { ImagesStore } from '../../../../core/stores/images.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ImageForm } from '../../components/image-form/image-form';

@Component({
  selector: 'app-image-create',
  imports: [RouterLink, SkeletonLoader, ErrorState, ImageForm],
  templateUrl: './image-create.html',
})
export class ImageCreate implements OnInit {
  private readonly service = inject(ImagesService);
  private readonly plansService = inject(PlansService);
  private readonly venuesService = inject(VenuesService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly organizersService = inject(OrganizersService);
  private readonly usersService = inject(UsersService);
  private readonly store = inject(ImagesStore);
  readonly router = inject(Router);

  readonly entities = signal<EntityOptions | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadReferences();
  }

  // Opciones del desplegable "Pertenece a" (solo los activos de cada entidad)
  async loadReferences(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const [plans, venues, categories, organizers, users] = await Promise.all([
        this.plansService.getActive(),
        this.venuesService.getActive(),
        this.categoriesService.getActive(),
        this.organizersService.getActive(),
        this.usersService.getActive(),
      ]);
      this.entities.set({
        plan: plans.data.map(plan => ({ _id: plan._id, name: plan.title })),
        venue: venues.data,
        category: categories.data,
        organizer: organizers.data,
        user: users.data.map(user => ({ _id: user._id, name: `${user.name} (${user.email})` })),
      });
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: ImagePayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/imagenes']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
