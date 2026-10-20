import { Component, computed, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Plan } from '../../../../core/models/plan.model';
import { Session, SessionPayload } from '../../../../core/models/session.model';
import { STATUSES, Status } from '../../../../core/models/status.model';
import { fromLocalInput, planTitle, toLocalInput } from '../../utils/sessions.utils';
import { refId } from '../../../plans/utils/plans.utils';

// Igual que el backend: la fecha de fin, después de la de inicio; el stock, como mucho el aforo
const rulesValidator = (group: AbstractControl): ValidationErrors | null => {
  const { startDateTime, endDateTime, capacity, stock } = group.value;
  const errors: ValidationErrors = {};
  if (startDateTime && endDateTime && new Date(endDateTime) <= new Date(startDateTime)) errors['endBeforeStart'] = true;
  if (stock != null && capacity != null && stock > capacity) errors['stockOverCapacity'] = true;
  return Object.keys(errors).length ? errors : null;
};

// Formulario reutilizable para crear y editar. No llama a la API:
// recibe las opciones por input y emite el payload listo para enviar.
@Component({
  selector: 'app-session-form',
  imports: [ReactiveFormsModule],
  templateUrl: './session-form.html',
})
export class SessionForm {
  session = input<Session | null>(null);
  plans = input<Plan[]>([]);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<SessionPayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly statuses = STATUSES;
  readonly editMode = computed(() => !!this.session());
  readonly planTitle = planTitle;

  // Aforo y stock vacíos = sin límite (null)
  readonly form = this.fb.nonNullable.group(
    {
      planId: ['', [Validators.required]],
      startDateTime: ['', [Validators.required]],
      endDateTime: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      capacity: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      stock: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      status: ['published' as Status, [Validators.required]],
    },
    { validators: [rulesValidator] }
  );

  constructor() {
    // Rellena el formulario cuando llega la sesión a editar. El plan no se puede cambiar
    effect(() => {
      const session = this.session();
      if (!session) return;
      this.form.patchValue({
        planId: refId(session.planId),
        startDateTime: toLocalInput(session.startDateTime),
        endDateTime: toLocalInput(session.endDateTime),
        price: session.price,
        capacity: session.capacity,
        stock: session.stock,
        status: session.status,
      });
      this.form.controls.planId.disable();
    });
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty)) return null;
    // Errores entre campos (los guarda el formulario, no el campo)
    if (field === 'endDateTime' && this.form.hasError('endBeforeStart')) return 'La fecha de fin debe ser posterior a la de inicio.';
    if (field === 'stock' && this.form.hasError('stockOverCapacity')) return 'El stock no puede superar el aforo.';
    if (!control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('min') || control.hasError('pattern')) {
      return field === 'price' ? 'Debe ser un número igual o mayor que cero.' : 'Debe ser un número entero igual o mayor que cero.';
    }
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      planId: raw.planId,
      startDateTime: fromLocalInput(raw.startDateTime) as string,
      endDateTime: fromLocalInput(raw.endDateTime),
      price: Number(raw.price),
      capacity: raw.capacity === null ? null : Number(raw.capacity),
      stock: raw.stock === null ? null : Number(raw.stock),
      status: raw.status,
    });
  }
}
