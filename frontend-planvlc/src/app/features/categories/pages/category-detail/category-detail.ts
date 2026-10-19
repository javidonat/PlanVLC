import { Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucidePencil } from '@lucide/angular';
import { CATEGORY_GROUPS, CATEGORY_STATUSES } from '../../../../core/models/category.model';
import { CategoriesService } from '../../../../core/services/categories.service';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { dateTimeText, optionLabel } from '../../../../shared/utils/format.utils';

// Ficha de solo lectura. Usa la lista del panel (GET /api/categories), que incluye
// categorías desactivadas y eliminadas: GET /api/categories/:id solo devuelve activas.
@Component({
  selector: 'app-category-detail',
  imports: [RouterLink, LucidePencil, SkeletonLoader, ErrorState],
  templateUrl: './category-detail.html',
})
export class CategoryDetail implements OnInit {
  private readonly service = inject(CategoriesService);
  private readonly store = inject(CategoriesStore);

  readonly id = input.required<string>();

  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly category = computed(() => this.store.findById(this.id()) ?? null);
  readonly statusLabel = computed(() => {
    const category = this.category();
    return category ? optionLabel(CATEGORY_STATUSES, category.status) : '';
  });
  readonly groupLabel = computed(() => {
    const category = this.category();
    return category ? optionLabel(CATEGORY_GROUPS, category.group) : '';
  });

  readonly dateTimeText = dateTimeText;

  ngOnInit(): void {
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
