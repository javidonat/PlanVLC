import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Plan } from '../../../../core/models/plan.model';
import { AlertService } from '../../../../core/services/alert.service';
import { PlansService } from '../../../../core/services/plans.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { PlanTable } from '../../components/plan-table/plan-table';

@Component({
  selector: 'app-plan-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, PlanTable],
  templateUrl: './plan-list.html',
})
export class PlanList implements OnInit {
  readonly store = inject(PlansStore);
  private readonly service = inject(PlansService);
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

  onEdit(plan: Plan): void {
    void this.router.navigate(['/admin/planes', plan._id, 'editar']);
  }

  async onToggle(plan: Plan): Promise<void> {
    try {
      this.store.setBusy(plan._id);
      const res = await this.service.setActive(plan._id, !plan.isActive);
      this.store.upsert(this.keepRelations(plan, res.data));
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(plan: Plan): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar plan', `Se eliminará «${plan.title}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(plan._id);
      const res = await this.service.softDelete(plan._id);
      this.store.upsert(this.keepRelations(plan, res.data));
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  // PATCH /active y /softdelete devuelven el plan sin populate (relaciones como ids).
  // Solo cambian isActive/deletedAt, así que se conservan las relaciones ya cargadas.
  private keepRelations(current: Plan, updated: Plan): Plan {
    return { ...current, isActive: updated.isActive, deletedAt: updated.deletedAt, updatedAt: updated.updatedAt };
  }
}
