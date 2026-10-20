import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Plan } from '../../../../core/models/plan.model';
import { SessionPayload } from '../../../../core/models/session.model';
import { PlansService } from '../../../../core/services/plans.service';
import { SessionsService } from '../../../../core/services/sessions.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { SessionsStore } from '../../../../core/stores/sessions.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SessionForm } from '../../components/session-form/session-form';

@Component({
  selector: 'app-session-create',
  imports: [RouterLink, SkeletonLoader, ErrorState, SessionForm],
  templateUrl: './session-create.html',
})
export class SessionCreate implements OnInit {
  private readonly service = inject(SessionsService);
  private readonly plansService = inject(PlansService);
  private readonly store = inject(SessionsStore);
  private readonly plansStore = inject(PlansStore);
  readonly router = inject(Router);

  readonly plans = signal<Plan[]>([]);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadReferences();
  }

  // Opciones del desplegable de planes (solo los activos)
  async loadReferences(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const res = await this.plansService.getActive();
      this.plans.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: SessionPayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
      this.store.upsert(res.data);
      await this.refreshPlans();
      await this.router.navigate(['/admin/sesiones']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }

  // El backend recalcula el precio y la próxima fecha del plan: si el listado de planes
  // ya estaba cargado, se vuelve a pedir para que no muestre datos viejos
  private async refreshPlans(): Promise<void> {
    if (!this.plansStore.loaded()) return;
    const res = await this.plansService.getAll();
    this.plansStore.setItems(res.data);
  }
}
