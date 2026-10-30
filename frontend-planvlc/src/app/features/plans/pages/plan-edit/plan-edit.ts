import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Plan, PlanPayload } from '../../../../core/models/plan.model';
import { PlansService } from '../../../../core/services/plans.service';
import { CategoriesService } from '../../../../core/services/categories.service';
import { VenuesService } from '../../../../core/services/venues.service';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ActiveSwitch } from '../../../../shared/components/active-switch/active-switch';
import { PlanForm } from '../../components/plan-form/plan-form';
import { PlanRefs } from '../../utils/plans.utils';

@Component({
  selector: 'app-plan-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, ActiveSwitch, PlanForm],
  templateUrl: './plan-edit.html',
})
export class PlanEdit implements OnInit {
  private readonly service = inject(PlansService);
  private readonly categoriesService = inject(CategoriesService);
  private readonly venuesService = inject(VenuesService);
  private readonly organizersService = inject(OrganizersService);
  private readonly store = inject(PlansStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly plan = signal<Plan | null>(null);
  readonly refs = signal<PlanRefs>({ categories: [], venues: [], organizers: [] });
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});
  readonly toggling = signal(false);

  ngOnInit(): void {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      // El plan se pide siempre al backend (datos frescos y con relaciones pobladas).
      // GET /:id solo devuelve planes activos: un plan desactivado da 404.
      const [planResponse, categories, venues, organizers] = await Promise.all([
        this.service.getById(this.id()),
        this.categoriesService.getActive(),
        this.venuesService.getActive(),
        this.organizersService.getActive(),
      ]);
      this.plan.set(planResponse.data);
      this.refs.set({ categories: categories.data, venues: venues.data, organizers: organizers.data });
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // Desactivar desde la página de editar. El backend solo deja editar lo que está activo,
  // así que después se vuelve al listado (allí se puede volver a activar)
  async onDeactivate(): Promise<void> {
    const current = this.plan();
    if (!current) return;
    try {
      this.toggling.set(true);
      const res = await this.service.setActive(current._id, false);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/planes']);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.toggling.set(false);
    }
  }

  async onSubmit(payload: PlanPayload): Promise<void> {
    const plan = this.plan();
    if (!plan) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(plan._id, payload);
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
