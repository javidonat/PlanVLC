import { z } from "zod";

// Piezas comunes de los listados del panel (GET /api/<recurso>?search=&status=&state=&sort=&page=&limit=).
// Los query params llegan como texto. Todos son opcionales; sin page se devuelven todos (para los desplegables)

export const queryId = (invalid) => z.string({ error: invalid }).regex(/^[a-f\d]{24}$/i, invalid);
const queryInt = (invalid) => z.coerce.number({ error: invalid }).int(invalid).min(1, invalid);

// Disponibilidad: activos, desactivados (no eliminados) o eliminados
export const LIST_STATES = ["active", "inactive", "deleted"];

// Valor de una lista cerrada (estado, tipo, grupo...)
export const queryEnum = (values, label) =>
  z.enum(values, { error: (issue) => `${label} '${issue.input}' no es válido` }).optional();

// Orden del listado: uno de sorts
export const querySort = (sorts) => z.enum(sorts, { error: `El orden debe ser uno de: ${sorts.join(", ")}` }).optional();

export const listShape = {
  search: z.string({ error: "La búsqueda debe ser un texto" }).trim().max(100, "La búsqueda no puede superar los 100 caracteres").optional(),
  state: z.enum(LIST_STATES, { error: `La disponibilidad debe ser una de: ${LIST_STATES.join(", ")}` }).optional(),
  page: queryInt("La página debe ser un número mayor que 0").optional(),
  limit: queryInt("El límite debe ser un número mayor que 0").max(100, "El límite no puede ser mayor que 100").optional(),
};
