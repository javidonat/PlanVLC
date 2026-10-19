import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Category, CategoryPayload } from '../../../../core/models/category.model';
import { CategoriesService } from '../../../../core/services/categories.service';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, CategoryForm],
  templateUrl: './category-edit.html',
})
export class CategoryEdit implements OnInit {
  private readonly service = inject(CategoriesService);
  private readonly store = inject(CategoriesStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly category = signal<Category | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      // Siempre al backend (datos frescos). GET /:id solo devuelve categorías activas
      const res = await this.service.getById(this.id());
      this.category.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: CategoryPayload): Promise<void> {
    const category = this.category();
    if (!category) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(category._id, payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/categorias']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
