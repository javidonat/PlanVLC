import { Component, computed, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RoleRef } from '../../../../core/models/role.model';
import { USER_STATUSES, User, UserPayload, UserStatus } from '../../../../core/models/user.model';
import { refId } from '../../../plans/utils/plans.utils';

// Formulario reutilizable para crear y editar. No llama a la API:
// recibe los roles por input y emite el payload listo para enviar.
// El avatar no está aquí: se cambia desde Perfiles (profiles.avatar)
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule],
  templateUrl: './user-form.html',
})
export class UserForm {
  user = input<User | null>(null);
  roles = input<RoleRef[]>([]);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<UserPayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly statuses = USER_STATUSES;
  readonly editMode = computed(() => !!this.user());

  // Mismos límites que el backend (schemas/users.schema.js).
  // La contraseña es obligatoria al crear; al editar, vacía = no se cambia
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    roleId: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72)]],
    status: ['active' as UserStatus, [Validators.required]],
  });

  constructor() {
    // Rellena el formulario cuando llega el usuario a editar
    effect(() => {
      const user = this.user();
      if (!user) return;
      this.form.patchValue({
        name: user.name,
        email: user.email,
        roleId: refId(user.roleId),
        status: user.status,
      });
      // Al editar, la contraseña es opcional
      this.form.controls.password.setValidators([Validators.minLength(8), Validators.maxLength(72)]);
      this.form.controls.password.updateValueAndValidity();
    });
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('minlength')) return `Mínimo ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('email')) return 'El email no es válido.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    const payload: UserPayload = {
      name: raw.name.trim(),
      email: raw.email.trim().toLowerCase(),
      roleId: raw.roleId,
      status: raw.status,
    };
    // La contraseña solo se envía si se ha escrito (al editar, vacía = no se cambia)
    if (raw.password) payload.password = raw.password;
    this.formSubmit.emit(payload);
  }
}
