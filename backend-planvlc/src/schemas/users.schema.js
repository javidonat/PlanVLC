import { z } from "zod";
import { USER_STATUSES } from "../models/constants.js";

// Esquemas de validación de las rutas de usuarios (Zod).
// Los campos que no aparecen aquí (passwordHash, lastLoginAt, isActive, deletedAt...) se descartan del body.

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

// URL de imagen (http o https)
const imageUrl = (invalid) =>
  z
    .string({ error: invalid })
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: invalid }));

// La contraseña llega en claro (por HTTPS) y el servidor guarda solo su hash
const password = z
  .string({ error: (issue) => (issue.input === undefined ? "La contraseña es obligatoria" : "La contraseña debe ser un texto") })
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no puede superar los 72 caracteres");

const required = {
  name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(
    100,
    "El nombre no puede superar los 100 caracteres"
  ),
  email: text("El email es obligatorio", "El email debe ser un texto").regex(/^\S+@\S+\.\S+$/, "El email no es válido"),
  roleId: objectId("El rol es obligatorio", "El id del rol no es válido"),
};

const optional = {
  status: z.enum(USER_STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
  // Avatar: se envía la URL y el servidor la guarda en "images" (entityType "user")
  avatarImageUrl: imageUrl("La URL del avatar no es válida")
    .nullable() // null = sin avatar
    .optional(),
};

// POST: obligatorios + contraseña + opcionales
export const createUserSchema = z.object({ ...required, password, ...optional });

// PATCH: todos opcionales. La contraseña solo se envía si se quiere cambiar
export const updateUserSchema = z.object({ ...required, password, ...optional }).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id del usuario no es válido"),
});
