import { Component, computed, effect, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Role, RolePayload } from '../../../../core/models/role.model';

// Igual que el backend: cada permiso con formato "recurso:acción" (ej. plans:write)
const PERMISSION_PATTERN = /^[a-z]+:[a-z]+$/;

// Los permisos se escriben uno por línea (se ignoran las líneas vacías)
const permissionLines = (value: string): string[] => value.split('\n').map(line => line.trim()).filter(Boolean);

const permissionsValidator = (control: AbstractControl<string>): ValidationErrors | null => {
  const permissions = permissionLines(control.value ?? '');
  if (permissions.some(permission => !PERMISSION_PATTERN.test(permission))) return { permission: true };
  if (permissions.length > 30) return { maxPermissions: true };
  return null;
};

// Formulario reutilizable para crear y editar. No llama a la API: emite el payload listo para enviar.
@Component({
  selector: 'app-role-form',
  imports: [ReactiveFormsModule],
  templateUrl: './role-form.html',
})
export class RoleForm {
  role = input<Role | null>(null);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<RolePayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly editMode = computed(() => !!this.role());

  // Mismos límites que el backend (schemas/roles.schema.js)
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9_-]+$/)]],
    description: ['', [Validators.maxLength(200)]],
    permissions: ['', [permissionsValidator]],
  });

  constructor() {
    // Rellena el formulario cuando llega el rol a editar
    effect(() => {
      const role = this.role();
      if (!role) return;
      this.form.patchValue({
        name: role.name,
        description: role.description ?? '',
        permissions: (role.permissions ?? []).join('\n'),
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
    if (control.hasError('pattern')) return 'Solo letras, números, - y _ (sin espacios).';
    if (control.hasError('permission')) return 'Cada línea debe tener el formato recurso:acción (ej. plans:write).';
    if (control.hasError('maxPermissions')) return 'Máximo 30 permisos.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      name: raw.name.trim().toLowerCase(),
      description: raw.description.trim(),
      permissions: permissionLines(raw.permissions),
    });
  }
}
