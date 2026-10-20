import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ORGANIZER_STATUSES,
  ORGANIZER_TYPES,
  Organizer,
  OrganizerPayload,
  OrganizerStatus,
  OrganizerType,
} from '../../../../core/models/organizer.model';
import { UserRef } from '../../../../core/models/user.model';
import { refId } from '../../../plans/utils/plans.utils';

// Igual que el backend: URL http(s)
const URL_PATTERN = /^https?:\/\/\S+$/i;

// Formulario reutilizable para crear y editar. No llama a la API: emite el payload listo para enviar.
@Component({
  selector: 'app-organizer-form',
  imports: [ReactiveFormsModule],
  templateUrl: './organizer-form.html',
})
export class OrganizerForm {
  organizer = input<Organizer | null>(null);
  users = input<UserRef[]>([]); // usuarios que pueden gestionar el organizador
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<OrganizerPayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly statuses = ORGANIZER_STATUSES;
  readonly types = ORGANIZER_TYPES;
  readonly editMode = computed(() => !!this.organizer());

  // Mismos límites que el backend (schemas/organizers.schema.js)
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    type: ['company' as OrganizerType, [Validators.required]],
    description: ['', [Validators.maxLength(500)]],
    email: ['', [Validators.email]],
    phone: ['', [Validators.maxLength(20)]],
    website: ['', [Validators.pattern(URL_PATTERN)]],
    instagram: ['', [Validators.maxLength(50)]],
    userIds: [[] as string[]],
    status: ['pending' as OrganizerStatus, [Validators.required]],
    logoImageUrl: ['', [Validators.pattern(URL_PATTERN)]],
  });

  // Vista previa del logo (solo si la URL es válida)
  private readonly logoValue = toSignal(this.form.controls.logoImageUrl.valueChanges, { initialValue: '' });
  readonly logoPreview = computed(() => {
    const url = this.logoValue().trim();
    return URL_PATTERN.test(url) ? url : null;
  });

  constructor() {
    // Rellena el formulario cuando llega el organizador a editar
    effect(() => {
      const organizer = this.organizer();
      if (!organizer) return;
      this.form.patchValue({
        name: organizer.name,
        type: organizer.type,
        description: organizer.description ?? '',
        email: organizer.contact?.email ?? '',
        phone: organizer.contact?.phone ?? '',
        website: organizer.contact?.website ?? '',
        instagram: organizer.contact?.instagram ?? '',
        userIds: (organizer.userIds ?? []).map(user => refId(user)),
        status: organizer.status,
        logoImageUrl: organizer.logo?.url ?? '',
      });
    });
  }

  isUserSelected(id: string): boolean {
    return this.form.controls.userIds.value.includes(id);
  }

  toggleUser(id: string, checked: boolean): void {
    const control = this.form.controls.userIds;
    const current = control.value.filter(value => value !== id);
    control.setValue(checked ? [...current, id] : current);
    control.markAsTouched();
  }

  fieldError(field: string): string | null {
    // Los errores del backend en el contacto llegan como "contact" (fieldErrors se queda con la primera parte de "contact.email")
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (control.hasError('email')) return 'El email no es válido.';
    if (control.hasError('pattern')) return 'Escribe una URL que empiece por http:// o https://.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      name: raw.name.trim(),
      type: raw.type,
      description: raw.description.trim(),
      contact: {
        email: raw.email.trim(),
        phone: raw.phone.trim(),
        website: raw.website.trim(),
        instagram: raw.instagram.trim(),
      },
      userIds: raw.userIds,
      status: raw.status,
      logoImageUrl: raw.logoImageUrl.trim() || null,
    });
  }
}
