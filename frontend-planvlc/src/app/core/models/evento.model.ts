// Tipos que reflejan EXACTAMENTE lo que devuelve el backend
// (ver backend-planvlc/src/models/evento.model.js y ctrls/eventos.ctrl.js)

// Mismas categorías que el "enum" del modelo de Mongoose
export type Categoria =
  | 'fiesta'
  | 'concierto'
  | 'tardeo'
  | 'festival'
  | 'espectaculo'
  | 'deporte'
  | 'otro';

// Un evento tal y como llega del backend (las fechas viajan como texto ISO en JSON)
export interface Evento {
  _id: string;
  nombre: string;
  descripcion: string;
  categoria: Categoria;
  fecha: string; // ej: "2025-10-04T00:00:00.000Z"
  hora: string; // ej: "23:00"
  lugar: string;
  precio: number; // 0 = gratis
  edadMinima: number; // 0 = todas las edades
  entradasDisponibles: number | null; // null = sin límite
  imagen: string; // URL o cadena vacía
  createdAt: string;
  updatedAt: string;
  status: 'borrador' | 'publicado' | 'cancelado' | 'finalizado';
  slug: string;
  isActive: boolean;
  deletedAt: string | null;
}

// GET /api/eventos  →  { ok, total, datos }
export interface RespuestaListaEventos {
  ok: boolean;
  total: number;
  datos: Evento[];
}

// GET por id o slug, POST y PATCH → { ok, mensaje?, datos }
export interface RespuestaEvento {
  ok: boolean;
  mensaje?: string;
  datos: Evento;
}

// Datos permitidos por el backend para crear (POST) o editar (PATCH) un evento
export type DatosEvento = Pick<Evento, 'nombre' | 'descripcion' | 'categoria' | 'fecha' | 'hora' | 'lugar'> &
  Partial<Pick<Evento, 'precio' | 'edadMinima' | 'entradasDisponibles' | 'imagen' | 'status'>>;

// Para PATCH se envían solo los campos que cambian
export type CambiosEvento = Partial<DatosEvento>;

// Errores del backend (middleware/errorHandler.js)  →  { ok: false, status, mensaje }
export interface RespuestaError {
  ok: false;
  status?: number;
  mensaje: string;
}

// Lista de categorías para pintar los filtros y las etiquetas
export const CATEGORIAS: { valor: Categoria; etiqueta: string }[] = [
  { valor: 'fiesta', etiqueta: 'Fiesta' },
  { valor: 'concierto', etiqueta: 'Concierto' },
  { valor: 'tardeo', etiqueta: 'Tardeo' },
  { valor: 'festival', etiqueta: 'Festival' },
  { valor: 'espectaculo', etiqueta: 'Espectáculo' },
  { valor: 'deporte', etiqueta: 'Deporte' },
  { valor: 'otro', etiqueta: 'Otro' },
];

export function etiquetaCategoria(categoria: Categoria): string {
  return CATEGORIAS.find((c) => c.valor === categoria)?.etiqueta ?? categoria;
}
