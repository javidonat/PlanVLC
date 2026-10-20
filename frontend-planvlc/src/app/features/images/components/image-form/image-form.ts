import { Component, computed, effect, inject, input, output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  EntityOptions,
  IMAGE_ENTITY_TYPES,
  IMAGE_TYPES,
  Image,
  ImageEntityType,
  ImagePayload,
  ImageType,
  imageEntityTypeLabel,
} from '../../../../core/models/image.model';

// Igual que el backend: URL http(s)
const URL_PATTERN = /^https?:\/\/\S+$/i;

// Tipos de imagen que admite cada entidad (un plan no tiene avatar, un usuario no tiene galería...)
const typesOf = (entityType: ImageEntityType) => {
  const allowed = IMAGE_ENTITY_TYPES.find(e => e.value === entityType)?.types ?? [];
  return IMAGE_TYPES.filter(t => allowed.includes(t.value));
};

// Formulario reutilizable para crear y editar. No llama a la API: emite el payload listo para enviar.
@Component({
  selector: 'app-image-form',
  imports: [ReactiveFormsModule],
  templateUrl: './image-form.html',
})
export class ImageForm {
  image = input<Image | null>(null);
  entities = input<EntityOptions | null>(null); // opciones de cada entidad (solo al crear)
  submitting = input(false);
  serverErrors = input<Record<string, string>>({}); // errores 400 por campo que devuelve el backend
  formSubmit = output<ImagePayload>();
  cancelClick = output<void>();

  private readonly fb = inject(FormBuilder);
  readonly entityTypes = IMAGE_ENTITY_TYPES;
  readonly imageEntityTypeLabel = imageEntityTypeLabel;
  readonly editMode = computed(() => !!this.image());

  // Mismos límites que el backend (schemas/images.schema.js)
  readonly form = this.fb.nonNullable.group({
    entityType: ['plan' as ImageEntityType, [Validators.required]],
    entityId: ['', [Validators.required]],
    type: ['cover' as ImageType, [Validators.required]],
    url: ['', [Validators.required, Validators.pattern(URL_PATTERN)]],
    alt: ['', [Validators.maxLength(150)]],
    position: [0, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
  });

  // La entidad elegida decide qué documentos y qué tipos de imagen se pueden elegir
  private readonly entityTypeValue = toSignal(this.form.controls.entityType.valueChanges, { initialValue: 'plan' as ImageEntityType });
  readonly entityOptions = computed(() => this.entities()?.[this.entityTypeValue()] ?? []);
  readonly types = computed(() => typesOf(this.entityTypeValue()));

  // Vista previa (solo si la URL es válida)
  private readonly urlValue = toSignal(this.form.controls.url.valueChanges, { initialValue: '' });
  readonly preview = computed(() => {
    const url = this.urlValue().trim();
    return URL_PATTERN.test(url) ? url : null;
  });

  constructor() {
    // Rellena el formulario cuando llega la imagen a editar
    effect(() => {
      const image = this.image();
      if (!image) return;
      this.form.patchValue({
        entityType: image.entityType,
        entityId: image.entityId,
        type: image.type,
        url: image.url,
        alt: image.alt ?? '',
        position: image.position,
      });
    });
  }

  // Al cambiar de entidad se vacía el documento y se pone el primer tipo que admite
  onEntityTypeChange(entityType: ImageEntityType): void {
    this.form.patchValue({ entityId: '', type: typesOf(entityType)[0]?.value ?? 'cover' });
  }

  fieldError(field: string): string | null {
    const server = this.serverErrors()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) return `Máximo ${control.getError('maxlength').requiredLength} caracteres.`;
    if (field === 'url' && control.hasError('pattern')) return 'Escribe una URL que empiece por http:// o https://.';
    if (control.hasError('min') || control.hasError('pattern')) return 'Debe ser un número entero igual o mayor que cero.';
    return 'Valor no válido.';
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.submitting()) return;

    const raw = this.form.getRawValue();
    this.formSubmit.emit({
      entityType: raw.entityType,
      entityId: raw.entityId,
      type: raw.type,
      url: raw.url.trim(),
      alt: raw.alt.trim(),
      position: Number(raw.position),
    });
  }
}
