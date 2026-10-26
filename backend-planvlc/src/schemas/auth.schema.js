import { z } from "zod";

// POST /api/auth/login
export const loginSchema = z.object({
  email: z
    .string({ error: (issue) => (issue.input === undefined ? "El email es obligatorio" : "El email debe ser un texto") })
    .trim()
    .min(1, "El email es obligatorio")
    .regex(/^\S+@\S+\.\S+$/, "El email no es válido"),
  password: z
    .string({ error: (issue) => (issue.input === undefined ? "La contraseña es obligatoria" : "La contraseña debe ser un texto") })
    .min(1, "La contraseña es obligatoria"),
});
