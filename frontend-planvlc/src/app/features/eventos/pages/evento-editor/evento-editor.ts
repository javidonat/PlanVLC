import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CATEGORIAS, DatosEvento, Evento } from '../../../../core/models/evento.model';
import { EventosService } from '../../../../core/services/eventos.service';
import { AdminEventosStore } from '../../../../core/stores/admin-eventos.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';

const imageValidator = (control: { value: string | null }) => {
  const value = control.value?.trim();
  if (!value) return null;
  try { return ['http:', 'https:'].includes(new URL(value).protocol) ? null : { url: true }; }
  catch { return { url: true }; }
};

@Component({
  selector: 'app-evento-editor',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './evento-editor.html',
})
export class EventoEditor implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(EventosService);
  private readonly store = inject(AdminEventosStore);

  readonly categorias = CATEGORIAS;
  readonly estados: Evento['status'][] = ['borrador', 'publicado', 'cancelado', 'finalizado'];
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly error = signal<string | null>(null);
  readonly erroresServidor = signal<Record<string, string>>({});

  readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion: ['', Validators.required],
    categoria: ['fiesta', Validators.required],
    fecha: ['', Validators.required],
    hora: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
    lugar: ['', Validators.required],
    precio: [0, [Validators.required, Validators.min(0)]],
    edadMinima: [18, [Validators.required, Validators.min(0), Validators.pattern(/^\d+$/)]],
    entradasDisponibles: [null as number | null, [Validators.min(0), Validators.pattern(/^\d+$/)]],
    imagen: ['', imageValidator],
    status: ['publicado', Validators.required],
  });

  async ngOnInit(): Promise<void> {
    if (!this.id) return;
    this.cargando.set(true);
    try {
      // GET /:id solo devuelve activos. El listado general contiene también inactivos.
      const evento = (await this.service.obtenerTodos()).find(item => item._id === this.id);
      if (!evento || evento.deletedAt) throw new Error('Evento no encontrado.');
      if (!evento.isActive) throw new Error('Activa el evento en el listado antes de editarlo.');
      this.form.patchValue({
        nombre: evento.nombre, descripcion: evento.descripcion, categoria: evento.categoria,
        fecha: evento.fecha.slice(0, 10), hora: evento.hora, lugar: evento.lugar,
        precio: evento.precio, edadMinima: evento.edadMinima,
        entradasDisponibles: evento.entradasDisponibles, imagen: evento.imagen, status: evento.status,
      });
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : apiError(error).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  fieldError(field: string): string | null {
    const server = this.erroresServidor()[field];
    if (server) return server;
    const control = this.form.get(field);
    if (!control || !(control.touched || control.dirty) || !control.invalid) return null;
    if (control.hasError('required')) return 'Este campo es obligatorio.';
    if (control.hasError('maxlength')) return 'Máximo 150 caracteres.';
    if (control.hasError('min')) return 'Debe ser un número igual o mayor que cero.';
    if (control.hasError('pattern')) return field === 'hora' ? 'Usa el formato HH:mm.' : 'Debe ser un número entero.';
    if (control.hasError('url')) return 'Introduce una URL http o https.';
    return 'Valor no válido.';
  }

  async guardar(): Promise<void> {
    this.form.markAllAsTouched();
    this.erroresServidor.set({});
    this.error.set(null);
    if (this.form.invalid || this.guardando()) return;
    const value = this.form.getRawValue();
    const datos: DatosEvento = {
      nombre: value.nombre!.trim(), descripcion: value.descripcion!.trim(),
      categoria: value.categoria as Evento['categoria'], fecha: value.fecha!,
      hora: value.hora!, lugar: value.lugar!.trim(), precio: Number(value.precio),
      edadMinima: Number(value.edadMinima),
      entradasDisponibles: value.entradasDisponibles === null || value.entradasDisponibles === ('' as unknown) ? null : Number(value.entradasDisponibles),
      imagen: value.imagen!.trim(), status: value.status as Evento['status'],
    };
    this.guardando.set(true);
    try {
      const saved = this.id ? await this.service.modificarEvento(this.id, datos) : await this.service.crearEvento(datos);
      this.store.replace(saved);
      await this.router.navigate(['/admin/eventos']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.mensaje);
      this.erroresServidor.set(Object.fromEntries((failure.errores ?? []).map(item => [item.campo, item.mensaje])));
    } finally {
      this.guardando.set(false);
    }
  }
}
