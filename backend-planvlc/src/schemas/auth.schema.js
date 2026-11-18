import { z } from "zod";

const email = z
  .string({ error: (issue) => (issue.input === undefined ? "El email es obligatorio" : "El email debe ser un texto") })
  .trim()
  .min(1, "El email es obligatorio")
  .max(254, "El email no puede superar los 254 caracteres")
  .regex(/^\S+@\S+\.\S+$/, "El email no es válido");

// POST /api/auth/register: alta de un cliente. El rol no se envía: siempre es el de cliente
export const registerSchema = z.object({
  name: z
    .string({ error: (issue) => (issue.input === undefined ? "El nombre es obligatorio" : "El nombre debe ser un texto") })
    .trim()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede superar los 100 caracteres"),
  email,
  // Mismos límites que al crear un usuario desde el panel, y además letras y números
  password: z
    .string({ error: (issue) => (issue.input === undefined ? "La contraseña es obligatoria" : "La contraseña debe ser un texto") })
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72, "La contraseña no puede superar los 72 caracteres")
    .regex(/[a-zA-Z]/, "La contraseña debe tener al menos una letra")
    .regex(/\d/, "La contraseña debe tener al menos un número"),
});

// POST /api/auth/login
export const loginSchema = z.object({
  email,
  password: z
    .string({ error: (issue) => (issue.input === undefined ? "La contraseña es obligatoria" : "La contraseña debe ser un texto") })
    .min(1, "La contraseña es obligatoria"),
});
