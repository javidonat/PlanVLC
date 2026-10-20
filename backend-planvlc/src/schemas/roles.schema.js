import { z } from "zod";

// Esquemas de validación de las rutas de roles (Zod).
// Los campos que no aparecen aquí (isActive, deletedAt...) se descartan del body.

// Texto obligatorio: distingue "falta" de "no es texto"
const text = (required, type) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : type) })
    .trim()
    .min(1, required);

const required = {
  // Se guarda en minúsculas (admin, editor...). Solo letras, números, - y _
  name: text("El nombre es obligatorio", "El nombre debe ser un texto")
    .max(30, "El nombre no puede superar los 30 caracteres")
    .regex(/^[a-zA-Z0-9_-]+$/, "El nombre solo puede tener letras, números, - y _ (sin espacios)"),
};

const optional = {
  description: z
    .string({ error: "La descripción debe ser un texto" })
    .trim()
    .max(200, "La descripción no puede superar los 200 caracteres")
    .optional(),
  // Permisos con formato "recurso:acción", ej. "plans:write"
  permissions: z
    .array(
      z
        .string({ error: "Los permisos deben ser textos" })
        .trim()
        .regex(/^[a-z]+:[a-z]+$/, "Cada permiso debe tener el formato recurso:acción (ej. plans:write)"),
      { error: "Los permisos deben ser una lista de textos" }
    )
    .max(30, "Un rol no puede tener más de 30 permisos")
    .optional(),
};

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
export const createRoleSchema = z.object({ ...required, ...optional });

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updateRoleSchema = z.object({ ...required, ...optional }).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id del rol no es válido"),
});
