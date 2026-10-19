import { z } from "zod";
import { CATEGORY_GROUPS, CATEGORY_STATUSES } from "../models/constants.js";

// Esquemas de validación de las rutas de categorías (Zod).
// Los campos que no aparecen aquí (slug, isActive, deletedAt...) se descartan del body.

const optionalText = (type, max, maxMessage) => z.string({ error: type }).trim().max(max, maxMessage).optional();

const fields = {
  name: z
    .string({ error: (issue) => (issue.input === undefined ? "El nombre es obligatorio" : "El nombre debe ser un texto") })
    .trim()
    .min(1, "El nombre es obligatorio")
    .max(60, "El nombre no puede superar los 60 caracteres"),
  description: optionalText("La descripción debe ser un texto", 300, "La descripción no puede superar los 300 caracteres"),
  icon: optionalText("El icono debe ser un texto", 50, "El icono no puede superar los 50 caracteres"),
  group: z.enum(CATEGORY_GROUPS, { error: (issue) => `El grupo '${issue.input}' no es válido` }).optional(),
  status: z.enum(CATEGORY_STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
  // Portada: se envía la URL y el servidor la guarda en "images" (entityType "category"). null = sin portada
  coverImageUrl: z
    .string({ error: "La URL de la portada no es válida" })
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: "La URL de la portada no es válida" }))
    .nullable()
    .optional(),
};

// POST: name obligatorio, el resto opcional (si falta, se usan los valores por defecto del modelo)
export const createCategorySchema = z.object(fields);

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updateCategorySchema = z.object(fields).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id de la categoría no es válido"),
});
