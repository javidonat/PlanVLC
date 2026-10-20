import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { statusLabel } from '../../../../core/models/status.model';
import { SessionsService } from '../../../../core/services/sessions.service';
import { SessionsStore } from '../../../../core/stores/sessions.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { dateTimeText, limitText, planTitle, priceText, sessionPlan } from '../../utils/sessions.utils';

// Ficha de solo lectura. Usa la lista del panel (GET /api/sessions), que incluye
// sesiones desactivadas y eliminadas: GET /api/sessions/:id solo devuelve activas.
@Component({
  selector: 'app-session-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './session-detail.html',
})
export class SessionDetail implements OnInit {
  private readonly service = inject(SessionsService);
  private readonly store = inject(SessionsStore);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly session = computed(() => this.store.findById(this.id()) ?? null);

  readonly statusLabel = statusLabel;
  readonly planTitle = planTitle;
  readonly sessionPlan = sessionPlan;
  readonly dateTimeText = dateTimeText;
  readonly priceText = priceText;
  readonly limitText = limitText;

  ngOnInit(): void {
    // Al venir desde el listado la sesión ya está en el store; si se entra por URL, se carga la lista
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
}
