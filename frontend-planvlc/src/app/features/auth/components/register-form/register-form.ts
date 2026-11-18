import { Component, inject, input, output } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { RegisterPayload } from '../../../../core/models/auth.model';

// Las dos contraseñas tienen que coincidir (validador del formulario entero)
const passwordsMatch = (group: AbstractControl): ValidationErrors | null =>
  group.get('password')?.value === group.get('confirmPassword')?.value ? null : { passwordMismatch: true };

// Formulario de registro de un cliente. No llama a la API: emite el nombre, el email y la contraseña.
// Las reglas son las mismas que comprueba el backend (schemas/auth.schema.js)
@Component({
  selector: 'app-register-form',
  imports: [ReactiveFormsModule],
  templateUrl: './register-form.html',
})
export class RegisterForm {
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<RegisterPayload>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(72), Validators.pattern(/^(?=.*[a-zA-Z])(?=.*\d).+$/)]],
    confirmPassword: ['', [Validators.required]],
  }, { validators: passwordsMatch });

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty)) return null;
    if (field === 'confirmPassword' && !control.hasError('required') && this.form.hasError('passwordMismatch')) return 'Las contraseñas no coinciden.';
    if (!control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('email')) return 'El email no es válido.';
    if (control.hasError('minlength')) return `Debe tener al menos ${control.getError('minlength').requiredLength} caracteres.`;
    if (control.hasError('maxlength')) return `No puede superar los ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('pattern')) return 'Debe tener al menos una letra y un número.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({ name: raw.name.trim(), email: raw.email.trim(), password: raw.password });
  }
}
