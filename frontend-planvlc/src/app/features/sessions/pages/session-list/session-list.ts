import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Session } from '../../../../core/models/session.model';
import { AlertService } from '../../../../core/services/alert.service';
import { PlansService } from '../../../../core/services/plans.service';
import { SessionsService } from '../../../../core/services/sessions.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { SessionsStore } from '../../../../core/stores/sessions.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { SessionTable } from '../../components/session-table/session-table';

@Component({
  selector: 'app-session-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, SessionTable],
  templateUrl: './session-list.html',
})
export class SessionList implements OnInit {
  readonly store = inject(SessionsStore);
  private readonly service = inject(SessionsService);
  private readonly plansStore = inject(PlansStore);
  private readonly plansService = inject(PlansService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Si ya se cargó antes (p. ej. al volver de crear/editar) no se repite la petición
    if (!this.store.loaded()) void this.load();
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

  onView(session: Session): void {
    void this.router.navigate(['/admin/sesiones', session._id]);
  }

  onEdit(session: Session): void {
    void this.router.navigate(['/admin/sesiones', session._id, 'editar']);
  }

  async onToggle(session: Session): Promise<void> {
    try {
      this.store.setBusy(session._id);
      const res = await this.service.setActive(session._id, !session.isActive);
      this.store.upsert(res.data);
      await this.refreshPlans();
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(session: Session): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar sesión', `Se eliminará la sesión ${session.sku} y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(session._id);
      const res = await this.service.softDelete(session._id);
      this.store.upsert(res.data);
      await this.refreshPlans();
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
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
