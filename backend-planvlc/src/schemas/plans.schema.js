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
  coverImageId: objectId("El id de la portada no es válido", "El id de la portada no es válido")
    .nullable()
    .optional(),
  galleryImageIds: z
    .array(objectId("Falta el id de una imagen", "Alguna imagen de la galería no tiene un id válido"), {
      error: "La galería debe ser una lista de ids",
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
