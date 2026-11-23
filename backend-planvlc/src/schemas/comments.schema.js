import { z } from "zod";
import { listShape, queryId } from "./list.schema.js";

// Esquemas de validación de las rutas de comentarios (Zod)

// GET /api/comments?plan=<slug>&page=&limit=
export const listCommentsQuerySchema = z.object({
  plan: z
    .string({ error: "El plan es obligatorio" })
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "El plan no es válido")
    .max(200, "El plan no es válido"),
  page: listShape.page,
  limit: listShape.limit,
});

// POST /api/comments. El autor no se envía: es el usuario de la sesión
export const createCommentSchema = z.object({
  planId: queryId("El id del plan no es válido"),
  rating: z
    .number({ error: "La valoración debe ser un número del 1 al 5" })
    .int("La valoración debe ser un número entero")
    .min(1, "La valoración mínima es 1")
    .max(5, "La valoración máxima es 5"),
  text: z
    .string({ error: (issue) => (issue.input === undefined ? "El comentario es obligatorio" : "El comentario debe ser un texto") })
    .trim()
    .min(3, "El comentario debe tener al menos 3 caracteres")
    .max(1000, "El comentario no puede superar los 1000 caracteres"),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id del comentario no es válido"),
});
