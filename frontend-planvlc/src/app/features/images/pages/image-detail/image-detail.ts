import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { imageEntityTypeLabel, imageTypeLabel } from '../../../../core/models/image.model';
import { ImagesService } from '../../../../core/services/images.service';
import { ImagesStore } from '../../../../core/stores/images.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';

// Ficha de solo lectura. Usa la lista del panel (GET /api/images), que incluye
// imágenes desactivadas y eliminadas: GET /api/images/:id solo devuelve activas.
@Component({
  selector: 'app-image-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './image-detail.html',
})
export class ImageDetail implements OnInit {
  private readonly service = inject(ImagesService);
  private readonly store = inject(ImagesStore);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly image = computed(() => this.store.findById(this.id()) ?? null);

  readonly imageEntityTypeLabel = imageEntityTypeLabel;
  readonly imageTypeLabel = imageTypeLabel;

  ngOnInit(): void {
    // Al venir desde el listado la imagen ya está en el store; si se entra por URL, se carga la lista
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

  // Fecha de creación, modificación o borrado
  dateText(iso: string | null): string {
    if (!iso) return '—';
    return new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }
}
