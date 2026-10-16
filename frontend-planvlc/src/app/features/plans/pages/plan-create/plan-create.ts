import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PlanPayload } from '../../../../core/models/plan.model';
import { PlansService } from '../../../../core/services/plans.service';
import { CategoriesService } from '../../../../core/services/categories.service';
import { VenuesService } from '../../../../core/services/venues.service';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { ImagesService } from '../../../../core/services/images.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PlanForm } from '../../components/plan-form/plan-form';
import { PlanRefs } from '../../utils/plans.utils';

@Component({
  selector: 'app-plan-create',
  imports: [RouterLink, SkeletonLoader, ErrorState, PlanForm],
  templateUrl: './plan-create.html',
})
export class PlanCreate implements OnInit {
  private readonly service = inject(PlansService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly venuesService = inject(VenuesService);
  private readonly organizersService = inject(OrganizersService);
  private readonly imagesService = inject(ImagesService);
  private readonly store = inject(PlansStore);
  readonly router = inject(Router);

  readonly refs = signal<PlanRefs>({ categories: [], venues: [], organizers: [], images: [] });
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadReferences();
  }

  // Opciones de los desplegables (categorías, lugares, organizadores, portadas)
  async loadReferences(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const [categories, venues, organizers, images] = await Promise.all([
        this.categoriesService.getActive(),
        this.venuesService.getActive(),
        this.organizersService.getActive(),
        this.imagesService.getActive(),
      ]);
      this.refs.set({ categories: categories.data, venues: venues.data, organizers: organizers.data, images: images.data });
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: PlanPayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/planes']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
