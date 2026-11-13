import { z } from "zod";
import { listShape, querySort } from "./list.schema.js";

// Texto opcional con longitud máxima. null = vaciar el campo
const optionalText = (label, max) =>
  z
    .string({ error: `${label} debe ser un texto` })
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .nullable()
    .optional();

// URL de imagen (http o https). null = volver al avatar por defecto (robot)
const imageUrl = z
  .string({ error: "La URL del avatar no es válida" })
  .trim()
  .pipe(z.url({ protocol: /^https?$/, error: "La URL del avatar no es válida" }))
  .nullable()
  .optional();

// PATCH: todos opcionales
export const updateProfileSchema = z.object({
  firstName: optionalText("El nombre", 100),
  lastName: optionalText("Los apellidos", 100),
  phone: optionalText("El teléfono", 30),
  bio: optionalText("La biografía", 2000),
  avatar: imageUrl,
});

// :userId de MongoDB
export const userIdParamsSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "El id del usuario no es válido"),
});

// Órdenes del listado (ver SORTS en repos/profiles.repo.js). Por defecto, los más nuevos
export const PROFILE_SORTS = ["recent", "oldest"];

// GET /api/profiles?search=&state=&sort=&page=&limit=
// search busca en el nombre y el email del usuario y en el nombre, apellidos y teléfono del perfil
export const listProfilesQuerySchema = z.object({
  ...listShape,
  sort: querySort(PROFILE_SORTS),
});
