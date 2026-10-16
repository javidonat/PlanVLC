import { Component, computed, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { CategoryRef, ImageRef, OrganizerRef, Plan, PlanPayload, VenueRef } from '../../../../core/models/plan.model';
import { STATUSES, Status } from '../../../../core/models/status.model';
import { refId } from '../../utils/plans.utils';

// Igual que el backend: al menos 1 categoría y como máximo 5
const categoriesValidator = (control: AbstractControl<string[]>): ValidationErrors | null => {
  const ids = control.value ?? [];
  if (ids.length === 0) return { required: true };
  if (ids.length > 5) return { maxCategories: true };
  return null;
};

// Formulario reutilizable para crear y editar. No llama a la API:
// recibe las opciones por input y emite el payload listo para enviar.
@Component({
  selector: 'app-plan-form',
  imports: [ReactiveFormsModule],
  templateUrl: './plan-form.html',
})
export class PlanForm {
  plan = input<Plan | null>(null);
  categories = input<CategoryRef[]>([]);
  venues = input<VenueRef[]>([]);
  organizers = input<OrganizerRef[]>([]);
  images = input<ImageRef[]>([]);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<PlanPayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly statuses = STATUSES;
  readonly editMode = computed(() => !!this.plan());

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.maxLength(150)]],
    shortDescription: ['', [Validators.maxLength(200)]],
    description: ['', [Validators.required]],
    categoryIds: [[] as string[], [categoriesValidator]],
    venueId: ['', [Validators.required]],
    organizerId: [''],
    coverImageId: [''],
    minAge: [18, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    status: ['published' as Status, [Validators.required]],
  });

  constructor() {
    // Rellena el formulario cuando llega el plan a editar
    effect(() => {
      const plan = this.plan();
      if (!plan) return;
      this.form.patchValue({
        title: plan.title,
        shortDescription: plan.shortDescription ?? '',
        description: plan.description,
        categoryIds: plan.categoryIds.map(c => refId(c)),
        venueId: refId(plan.venueId),
        organizerId: refId(plan.organizerId),
        coverImageId: refId(plan.coverImageId),
        minAge: plan.minAge,
        status: plan.status,
      });
    });
  }

  isCategorySelected(id: string): boolean {
    return this.form.controls.categoryIds.value.includes(id);
  }

  toggleCategory(id: string, checked: boolean): void {
    const control = this.form.controls.categoryIds;
    const current = control.value.filter(value => value !== id);
    control.setValue(checked ? [...current, id] : current);
    control.markAsTouched();
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('required')) return field === 'categoryIds' ? 'Elige al menos una categoría.' : 'Este campo es obligatorio.';
    if (control.hasError('maxCategories')) return 'Máximo 5 categorías.';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('min') || control.hasError('pattern')) return 'Debe ser un número entero igual o mayor que cero.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      title: raw.title.trim(),
      shortDescription: raw.shortDescription.trim(),
      description: raw.description.trim(),
      categoryIds: raw.categoryIds,
      venueId: raw.venueId,
      organizerId: raw.organizerId || null,
      coverImageId: raw.coverImageId || null,
      minAge: Number(raw.minAge),
      status: raw.status,
    });
  }
}
