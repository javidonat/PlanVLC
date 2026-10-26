import { z } from "zod";

// Texto opcional con longitud máxima. null = vaciar el campo
const optionalText = (label, max) =>
  z
    .string({ error: `${label} debe ser un texto` })
    .trim()
    .max(max, `${label} no puede superar los ${max} caracteres`)
    .nullable()
    .optional();

// PATCH: todos opcionales
export const updateProfileSchema = z.object({
  firstName: optionalText("El nombre", 100),
  lastName: optionalText("Los apellidos", 100),
  phone: optionalText("El teléfono", 30),
  bio: optionalText("La biografía", 2000),
});

// :userId de MongoDB
export const userIdParamsSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i, "El id del usuario no es válido"),
});
