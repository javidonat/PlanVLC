import { z } from "zod";
import { IMAGE_ENTITY_TYPES, IMAGE_TYPES } from "../models/constants.js";

// Esquemas de validación de las rutas de imágenes (Zod).
// Los campos que no aparecen aquí (isActive, deletedAt...) se descartan del body.

// id de MongoDB (ObjectId: 24 caracteres hexadecimales)
const objectId = (required, invalid) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : invalid) })
    .regex(/^[a-f\d]{24}$/i, invalid);

// URL de imagen (http o https)
const imageUrl = (required, invalid) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : invalid) })
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: invalid }));

const required = {
  url: imageUrl("La URL de la imagen es obligatoria", "La URL de la imagen no es válida"),
  entityType: z.enum(Object.keys(IMAGE_ENTITY_TYPES), {
    error: (issue) => (issue.input === undefined ? "La entidad es obligatoria" : `La entidad '${issue.input}' no es válida`),
  }),
  entityId: objectId("El id de la entidad es obligatorio", "El id de la entidad no es válido"),
  type: z.enum(IMAGE_TYPES, {
    error: (issue) => (issue.input === undefined ? "El tipo es obligatorio" : `El tipo '${issue.input}' no es válido`),
  }),
};

const optional = {
  alt: z
    .string({ error: "El texto alternativo debe ser un texto" })
    .trim()
    .max(150, "El texto alternativo no puede superar los 150 caracteres")
    .optional(),
  // Orden dentro de la galería (0 = la primera)
  position: z
    .number({ error: "La posición debe ser un número entero" })
    .int("La posición debe ser un número entero")
    .min(0, "La posición no puede ser negativa")
    .optional(),
};

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
export const createImageSchema = z.object({ ...required, ...optional });

// PATCH: todos opcionales. La entidad no se puede cambiar: la imagen pertenece siempre al mismo documento
export const updateImageSchema = z.object({ url: required.url, type: required.type, ...optional }).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id de la imagen no es válido"),
});
