import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { VENUE_STATUSES, Venue, VenuePayload, VenueStatus } from '../../../../core/models/venue.model';

// Igual que el backend: URLs http(s) y como máximo 10 imágenes en la galería
const URL_PATTERN = /^https?:\/\/\S+$/i;
const MAX_GALLERY = 10;

// La galería se escribe con una URL por línea (se ignoran las líneas vacías)
const urlLines = (value: string): string[] => value.split('\n').map(line => line.trim()).filter(Boolean);

const galleryValidator = (control: AbstractControl<string>): ValidationErrors | null => {
  const urls = urlLines(control.value ?? '');
  if (urls.some(url => !URL_PATTERN.test(url))) return { url: true };
  if (urls.length > MAX_GALLERY) return { maxImages: true };
  return null;
};

// Igual que el backend: las coordenadas van juntas, o las dos o ninguna
const coordinatesValidator = (group: AbstractControl): ValidationErrors | null => {
  const { latitude, longitude } = group.value;
  return (latitude == null) !== (longitude == null) ? { coordinates: true } : null;
};

// Formulario reutilizable para crear y editar. No llama a la API: emite el payload listo para enviar.
@Component({
  selector: 'app-venue-form',
  imports: [ReactiveFormsModule],
  templateUrl: './venue-form.html',
})
export class VenueForm {
  venue = input<Venue | null>(null);
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<VenuePayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly statuses = VENUE_STATUSES;
  readonly editMode = computed(() => !!this.venue());

  // Mismos límites que el backend (schemas/venues.schema.js)
  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.maxLength(100)]],
      address: ['', [Validators.maxLength(200)]],
      neighborhood: ['', [Validators.maxLength(80)]],
      city: ['Valencia', [Validators.maxLength(80)]],
      province: ['Valencia', [Validators.maxLength(80)]],
      postalCode: ['', [Validators.pattern(/^\d{5}$/)]],
      capacity: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
      longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
      status: ['open' as VenueStatus, [Validators.required]],
      coverImageUrl: ['', [Validators.pattern(URL_PATTERN)]],
      galleryImageUrls: ['', [galleryValidator]],
    },
    { validators: [coordinatesValidator] }
  );

  // Vista previa de la portada y la galería (solo las URLs válidas)
  private readonly coverValue = toSignal(this.form.controls.coverImageUrl.valueChanges, { initialValue: '' });
  private readonly galleryValue = toSignal(this.form.controls.galleryImageUrls.valueChanges, { initialValue: '' });
  readonly coverPreview = computed(() => {
    const url = this.coverValue().trim();
    return URL_PATTERN.test(url) ? url : null;
  });
  readonly galleryPreview = computed(() => urlLines(this.galleryValue()).filter(url => URL_PATTERN.test(url)));

  constructor() {
    // Rellena el formulario cuando llega el lugar a editar
    effect(() => {
      const venue = this.venue();
      if (!venue) return;
      const coordinates = venue.location?.coordinates; // [longitud, latitud]
      this.form.patchValue({
        name: venue.name,
        address: venue.address ?? '',
        neighborhood: venue.neighborhood ?? '',
        city: venue.city ?? '',
        province: venue.province ?? '',
        postalCode: venue.postalCode ?? '',
        capacity: venue.capacity,
        latitude: coordinates ? coordinates[1] : null,
        longitude: coordinates ? coordinates[0] : null,
        status: venue.status,
        coverImageUrl: venue.coverImage?.url ?? '',
        galleryImageUrls: (venue.galleryImages ?? []).map(image => image.url).join('\n'),
      });
    });
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty)) return null;
    // Error entre campos (lo guarda el formulario, no el campo)
    if (field === 'longitude' && this.form.hasError('coordinates')) return 'Indica la latitud y la longitud, o ninguna de las dos.';
    if (!control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (field === 'postalCode') return 'El código postal debe tener 5 números.';
    if (field === 'coverImageUrl') return 'Escribe una URL que empiece por http:// o https://.';
    if (control.hasError('url')) return 'Cada línea debe ser una URL que empiece por http:// o https://.';
    if (control.hasError('maxImages')) return `Máximo ${MAX_GALLERY} imágenes.`;
    if (field === 'latitude') return 'La latitud debe estar entre -90 y 90.';
    if (field === 'longitude') return 'La longitud debe estar entre -180 y 180.';
    if (control.hasError('min') || control.hasError('pattern')) return 'Debe ser un número entero igual o mayor que cero.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      name: raw.name.trim(),
      address: raw.address.trim(),
      neighborhood: raw.neighborhood.trim(),
      city: raw.city.trim(),
      province: raw.province.trim(),
      postalCode: raw.postalCode.trim(),
      capacity: raw.capacity === null ? null : Number(raw.capacity),
      latitude: raw.latitude === null ? null : Number(raw.latitude),
      longitude: raw.longitude === null ? null : Number(raw.longitude),
      status: raw.status,
      coverImageUrl: raw.coverImageUrl.trim() || null,
      galleryImageUrls: urlLines(raw.galleryImageUrls),
    });
  }
}
