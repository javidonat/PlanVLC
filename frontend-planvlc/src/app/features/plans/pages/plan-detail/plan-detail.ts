import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { Plan } from '../../../../core/models/plan.model';
import { statusLabel } from '../../../../core/models/status.model';
import { PlansService } from '../../../../core/services/plans.service';
import { PlansStore } from '../../../../core/stores/plans.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { categoriesLabel, planPriceText, sessionDateText, venueLabel } from '../../utils/plans.utils';

// Ficha de solo lectura para revisar un plan sin entrar a editarlo.
// Usa la lista del panel (GET /api/plans), que incluye planes desactivados y eliminados:
// GET /api/plans/:id solo devuelve planes activos.
@Component({
  selector: 'app-plan-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './plan-detail.html',
})
export class PlanDetail implements OnInit {
  private readonly service = inject(PlansService);
  private readonly store = inject(PlansStore);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly plan = computed(() => this.store.findById(this.id()) ?? null);
  readonly organizerName = computed(() => {
    const organizer = this.plan()?.organizerId;
    return organizer && typeof organizer === 'object' ? organizer.name : 'Sin organizador';
  });

  readonly statusLabel = statusLabel;
  readonly categoriesLabel = categoriesLabel;
  readonly venueLabel = venueLabel;
  readonly planPriceText = planPriceText;
  readonly sessionDateText = sessionDateText;

  ngOnInit(): void {
    // Al venir desde el listado el plan ya está en el store; si se entra por URL, se carga la lista
    if (!this.store.loaded()) void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      const res = await this.service.getAll();
      this.store.setItems(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  // Fecha de creación, modificación o borrado (sessionDateText está pensada para sesiones)
  dateText(iso: string | null): string {
    return iso ? sessionDateText(iso) : '—';
  }

  ageText(plan: Plan): string {
    return plan.minAge > 0 ? `+${plan.minAge}` : 'Todas las edades';
  }
}
