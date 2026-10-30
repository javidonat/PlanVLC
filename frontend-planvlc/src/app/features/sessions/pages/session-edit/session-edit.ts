import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Session, SessionPayload } from '../../../../core/models/session.model';
import { PlansService } from '../../../../core/services/plans.service';
import { SessionsService } from '../../../../core/services/sessions.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { SessionsStore } from '../../../../core/stores/sessions.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ActiveSwitch } from '../../../../shared/components/active-switch/active-switch';
import { SessionForm } from '../../components/session-form/session-form';

@Component({
  selector: 'app-session-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, ActiveSwitch, SessionForm],
  templateUrl: './session-edit.html',
})
export class SessionEdit implements OnInit {
  private readonly service = inject(SessionsService);
  private readonly plansService = inject(PlansService);
  private readonly store = inject(SessionsStore);
  private readonly plansStore = inject(PlansStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly session = signal<Session | null>(null);
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
      // La sesión se pide siempre al backend (datos frescos y con el plan poblado).
      // GET /:id solo devuelve sesiones activas: una desactivada da 404.
      const res = await this.service.getById(this.id());
      this.session.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // Desactivar desde la página de editar. El backend solo deja editar lo que está activo,
  // así que después se vuelve al listado (allí se puede volver a activar)
  async onDeactivate(): Promise<void> {
    const current = this.session();
    if (!current) return;
    try {
      this.toggling.set(true);
      const res = await this.service.setActive(current._id, false);
      this.store.upsert(res.data);
      await this.refreshPlans();
      await this.router.navigate(['/admin/sesiones']);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409).
    } finally {
      this.toggling.set(false);
    }
  }

  async onSubmit(payload: SessionPayload): Promise<void> {
    const session = this.session();
    if (!session) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      // El plan no se envía: una sesión no se cambia de plan
      const { planId, ...changes } = payload;
      const res = await this.service.update(session._id, changes);
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
