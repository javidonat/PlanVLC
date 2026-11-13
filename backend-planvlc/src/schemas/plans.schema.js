import { z } from "zod";
import { STATUSES } from "../models/constants.js";

// Esquemas de validación de las rutas de planes (Zod).
// Los campos que no aparecen aquí (slug, priceFrom, nextSessionAt, isActive, deletedAt...) se descartan del body.

// Texto obligatorio: distingue "falta" de "no es texto"
const text = (required, type) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : type) })
    .trim()
    .min(1, required);

// id de MongoDB (ObjectId: 24 caracteres hexadecimales)
const objectId = (required, invalid) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : invalid) })
    .regex(/^[a-f\d]{24}$/i, invalid);

const number = (type) => z.number({ error: type });

// URL de imagen (http o https)
const imageUrl = (invalid) =>
  z
    .string({ error: invalid })
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: invalid }));

const required = {
  title: text("El título del plan es obligatorio", "El título debe ser un texto").max(
    150,
    "El título no puede superar los 150 caracteres"
  ),
  description: text("La descripción es obligatoria", "La descripción debe ser un texto"),
  categoryIds: z
    .array(objectId("Falta el id de una categoría", "Alguna categoría no tiene un id válido"), {
      error: (issue) =>
        issue.input === undefined
          ? "Las categorías son obligatorias"
          : "Las categorías deben ser una lista de ids",
    })
    .min(1, "El plan necesita al menos una categoría")
    .max(5, "Un plan no puede tener más de 5 categorías"),
  venueId: objectId("El lugar es obligatorio", "El id del lugar no es válido"),
};

const optional = {
  shortDescription: z
    .string({ error: "La descripción corta debe ser un texto" })
    .trim()
    .max(200, "La descripción corta no puede superar los 200 caracteres")
    .optional(),
  organizerId: objectId("El id del organizador no es válido", "El id del organizador no es válido")
    .nullable() // null = sin organizador
    .optional(),
  // Imágenes: se envían URLs y el servidor las guarda en "images" (entityType "plan")
  coverImageUrl: imageUrl("La URL de la portada no es válida")
    .nullable() // null = sin portada
    .optional(),
  galleryImageUrls: z
    .array(imageUrl("Alguna URL de la galería no es válida"), {
      error: "La galería debe ser una lista de URLs",
    })
    .max(10, "La galería no puede tener más de 10 imágenes")
    .optional(),
  minAge: number("La edad mínima debe ser un número entero")
    .int("La edad mínima debe ser un número entero")
    .min(0, "La edad mínima no puede ser negativa")
    .optional(),
  tags: z
    .array(z.string({ error: "Las etiquetas deben ser textos" }).trim().min(1, "Una etiqueta está vacía"), {
      error: "Las etiquetas deben ser una lista de textos",
    })
    .max(10, "Un plan no puede tener más de 10 etiquetas")
    .optional(),
  status: z.enum(STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
};

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
// ---------- Listado del panel (GET /?search=&status=&state=&sort=&page=&limit=) ----------
// Los query params llegan como texto. Todos son opcionales; sin page se devuelven todos (para los desplegables)

const queryId = (invalid) => z.string({ error: invalid }).regex(/^[a-f\d]{24}$/i, invalid);
const queryInt = (invalid) => z.coerce.number({ error: invalid }).int(invalid).min(1, invalid);

// Disponibilidad: activos, desactivados (no eliminados) o eliminados
export const LIST_STATES = ["active", "inactive", "deleted"];

const listShape = {
  search: z.string({ error: "La búsqueda debe ser un texto" }).trim().max(100, "La búsqueda no puede superar los 100 caracteres").optional(),
  status: z.enum(STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
  state: z.enum(LIST_STATES, { error: `La disponibilidad debe ser una de: ${LIST_STATES.join(", ")}` }).optional(),
  page: queryInt("La página debe ser un número mayor que 0").optional(),
  limit: queryInt("El límite debe ser un número mayor que 0").max(100, "El límite no puede ser mayor que 100").optional(),
};

// Órdenes del listado de planes (ver SORTS en repos/plans.repo.js). Por defecto, por próxima sesión
export const PLAN_SORTS = ["date", "recent", "title", "price_asc", "price_desc", "popular"];

// GET /api/plans?search=&status=&state=&category=&organizer=&venue=&sort=&page=&limit=
export const listPlansQuerySchema = z.object({
  ...listShape,
  category: queryId("La categoría no es válida").optional(),
  organizer: queryId("El organizador no es válido").optional(),
  venue: queryId("El lugar no es válido").optional(),
  sort: z.enum(PLAN_SORTS, { error: `El orden debe ser uno de: ${PLAN_SORTS.join(", ")}` }).optional(),
});

export const createPlanSchema = z.object({ ...required, ...optional });

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updatePlanSchema = z.object({ ...required, ...optional }).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id del plan no es válido"),
});
