import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile, ProfilePayload } from '../../../../core/models/profile.model';

// Texto vacío → null (el backend lo guarda como campo vacío)
const orNull = (value: string): string | null => value.trim() || null;

// Formulario para editar el perfil. No llama a la API: emite el payload listo para enviar.
@Component({
  selector: 'app-profile-form',
  imports: [ReactiveFormsModule],
  templateUrl: './profile-form.html',
})
export class ProfileForm {
  profile = input<Profile | null>(null);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<ProfilePayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);

  // Mismos límites que el backend (schemas/profiles.schema.js)
  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.maxLength(100)]],
    lastName: ['', [Validators.maxLength(100)]],
    phone: ['', [Validators.maxLength(30)]],
    bio: ['', [Validators.maxLength(2000)]],
  });

  constructor() {
    // Rellena el formulario con el perfil actual
    effect(() => {
      const profile = this.profile();
      if (!profile) return;
      this.form.patchValue({
        firstName: profile.firstName ?? '',
        lastName: profile.lastName ?? '',
        phone: profile.phone ?? '',
        bio: profile.bio ?? '',
      });
    });
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      firstName: orNull(raw.firstName),
      lastName: orNull(raw.lastName),
      phone: orNull(raw.phone),
      bio: orNull(raw.bio),
    });
  }
}
