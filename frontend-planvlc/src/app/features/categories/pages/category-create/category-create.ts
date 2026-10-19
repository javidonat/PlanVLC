import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CategoryPayload } from '../../../../core/models/category.model';
import { CategoriesService } from '../../../../core/services/categories.service';
import { CategoriesStore } from '../../../../core/stores/categories.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { CategoryForm } from '../../components/category-form/category-form';

@Component({
  selector: 'app-category-create',
  imports: [RouterLink, CategoryForm],
  templateUrl: './category-create.html',
})
export class CategoryCreate {
  private readonly service = inject(CategoriesService);
  private readonly store = inject(CategoriesStore);
  readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  async onSubmit(payload: CategoryPayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
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
