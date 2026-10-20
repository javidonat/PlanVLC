import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Image } from '../../../../core/models/image.model';
import { AlertService } from '../../../../core/services/alert.service';
import { ImagesService } from '../../../../core/services/images.service';
import { ImagesStore } from '../../../../core/stores/images.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { ImageTable } from '../../components/image-table/image-table';

@Component({
  selector: 'app-image-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, ImageTable],
  templateUrl: './image-list.html',
})
export class ImageList implements OnInit {
  readonly store = inject(ImagesStore);
  private readonly service = inject(ImagesService);
  private readonly alerts = inject(AlertService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // Siempre se pide de nuevo: las imágenes también cambian desde los formularios
    // de planes, lugares, categorías, organizadores y usuarios
    void this.load();
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

  onView(image: Image): void {
    void this.router.navigate(['/admin/imagenes', image._id]);
  }

  onEdit(image: Image): void {
    void this.router.navigate(['/admin/imagenes', image._id, 'editar']);
  }

  async onToggle(image: Image): Promise<void> {
    try {
      this.store.setBusy(image._id);
      const res = await this.service.setActive(image._id, !image.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si ya hay otra portada activa).
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(image: Image): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar imagen', `Se eliminará la imagen de «${image.entityName ?? 'sin nombre'}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(image._id);
      const res = await this.service.softDelete(image._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }
}
