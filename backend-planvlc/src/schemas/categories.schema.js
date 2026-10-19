import { z } from "zod";
import { CATEGORY_GROUPS, CATEGORY_STATUSES } from "../models/constants.js";

// Esquemas de validación de las rutas de categorías (Zod).
// Los campos que no aparecen aquí (slug, isActive, deletedAt...) se descartan del body.

// Texto obligatorio: distingue "falta" de "no es texto"
const text = (required, type) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : type) })
    .trim()
    .min(1, required);

// URL de imagen (http o https)
const imageUrl = (invalid) =>
  z
    .string({ error: invalid })
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: invalid }));

const required = {
  name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(
    60,
    "El nombre no puede superar los 60 caracteres"
  ),
};

const optional = {
  description: z
    .string({ error: "La descripción debe ser un texto" })
    .trim()
    .max(300, "La descripción no puede superar los 300 caracteres")
    .optional(),
  icon: z
    .string({ error: "El icono debe ser un texto" })
    .trim()
    .max(50, "El icono no puede superar los 50 caracteres")
    .optional(),
  group: z.enum(CATEGORY_GROUPS, { error: (issue) => `El grupo '${issue.input}' no es válido` }).optional(),
  status: z.enum(CATEGORY_STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
  // Portada: se envía la URL y el servidor la guarda en "images" (entityType "category")
  coverImageUrl: imageUrl("La URL de la portada no es válida")
    .nullable() // null = sin portada
    .optional(),
};

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
export const createCategorySchema = z.object({ ...required, ...optional });

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updateCategorySchema = z.object({ ...required, ...optional }).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id de la categoría no es válido"),
});
