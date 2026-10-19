import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucidePlus } from '@lucide/angular';
import { Category } from '../../../../core/models/category.model';
import { AlertService } from '../../../../core/services/alert.service';
import { CategoriesService } from '../../../../core/services/categories.service';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { CategoryTable } from '../../components/category-table/category-table';

@Component({
  selector: 'app-category-list',
  imports: [RouterLink, LucidePlus, SkeletonLoader, EmptyState, ErrorState, CategoryTable],
  templateUrl: './category-list.html',
})
export class CategoryList implements OnInit {
  readonly store = inject(CategoriesStore);
  private readonly service = inject(CategoriesService);
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

  onView(category: Category): void {
    void this.router.navigate(['/admin/categorias', category._id]);
  }

  onEdit(category: Category): void {
    void this.router.navigate(['/admin/categorias', category._id, 'editar']);
  }

  async onToggle(category: Category): Promise<void> {
    try {
      this.store.setBusy(category._id);
      const res = await this.service.setActive(category._id, !category.isActive);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error.
    } finally {
      this.store.setBusy(null);
    }
  }

  async onDelete(category: Category): Promise<void> {
    const confirmed = await this.alerts.confirm('Eliminar categoría', `Se eliminará «${category.name}» y no se podrá recuperar desde el panel.`, 'Eliminar');
    if (!confirmed) return;
    try {
      this.store.setBusy(category._id);
      const res = await this.service.softDelete(category._id);
      this.store.upsert(res.data);
    } catch {
      // El interceptor ya muestra el error (p. ej. 409 si la usan planes).
    } finally {
      this.store.setBusy(null);
    }
  }
}
