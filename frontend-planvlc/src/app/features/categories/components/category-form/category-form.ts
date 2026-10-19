import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CATEGORY_GROUPS,
  CATEGORY_STATUSES,
  Category,
  CategoryGroup,
  CategoryPayload,
  CategoryStatus,
} from '../../../../core/models/category.model';
import { IMAGE_URL_PATTERN } from '../../../../shared/utils/format.utils';

// Formulario reutilizable para crear y editar. No llama a la API: emite el payload listo para enviar.
@Component({
  selector: 'app-category-form',
  imports: [ReactiveFormsModule],
  templateUrl: './category-form.html',
})
export class CategoryForm {
  category = input<Category | null>(null);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<CategoryPayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly statuses = CATEGORY_STATUSES;
  readonly groups = CATEGORY_GROUPS;
  readonly editMode = computed(() => !!this.category());

  // Mismos límites que el backend (schemas/categories.schema.js)
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(60)]],
    description: ['', [Validators.maxLength(300)]],
    icon: ['', [Validators.maxLength(50)]],
    group: ['other' as CategoryGroup, [Validators.required]],
    status: ['published' as CategoryStatus, [Validators.required]],
    coverImageUrl: ['', [Validators.pattern(IMAGE_URL_PATTERN)]],
  });

  // Vista previa de la portada (solo si la URL es válida)
  private readonly coverValue = toSignal(this.form.controls.coverImageUrl.valueChanges, { initialValue: '' });
  readonly coverPreview = computed(() => {
    const url = this.coverValue().trim();
    return IMAGE_URL_PATTERN.test(url) ? url : null;
  });

  constructor() {
    // Rellena el formulario cuando llega la categoría a editar
    effect(() => {
      const category = this.category();
      if (!category) return;
      this.form.patchValue({
        name: category.name,
        description: category.description ?? '',
        icon: category.icon ?? '',
        group: category.group,
        status: category.status,
        coverImageUrl: category.coverImage?.url ?? '',
      });
    });
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('pattern')) return 'Escribe una URL que empiece por http:// o https://.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      name: raw.name.trim(),
      description: raw.description.trim(),
      icon: raw.icon.trim(),
      group: raw.group,
      status: raw.status,
      coverImageUrl: raw.coverImageUrl.trim() || null,
    });
  }
}
