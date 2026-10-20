import { z } from "zod";
import { ORGANIZER_STATUSES, ORGANIZER_TYPES } from "../models/constants.js";

// Esquemas de validación de las rutas de organizadores (Zod).
// Los campos que no aparecen aquí (slug, isActive, deletedAt...) se descartan del body.

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

// Datos de contacto: todos opcionales. "" = sin dato
const contact = z.object(
  {
    email: z
      .string({ error: "El email debe ser un texto" })
      .trim()
      .regex(/^(\S+@\S+\.\S+)?$/, "El email no es válido")
      .optional(),
    phone: z
      .string({ error: "El teléfono debe ser un texto" })
      .trim()
      .max(20, "El teléfono no puede superar los 20 caracteres")
      .optional(),
    website: z
      .string({ error: "La web debe ser un texto" })
      .trim()
      .regex(/^(https?:\/\/\S+)?$/, "La web debe empezar por http:// o https://")
      .optional(),
    instagram: z
      .string({ error: "El Instagram debe ser un texto" })
      .trim()
      .max(50, "El Instagram no puede superar los 50 caracteres")
      .optional(),
  },
  { error: "El contacto debe ser un objeto" }
);

const required = {
  name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(
    100,
    "El nombre no puede superar los 100 caracteres"
  ),
};

const optional = {
  type: z.enum(ORGANIZER_TYPES, { error: (issue) => `El tipo '${issue.input}' no es válido` }).optional(),
  description: z
    .string({ error: "La descripción debe ser un texto" })
    .trim()
    .max(500, "La descripción no puede superar los 500 caracteres")
    .optional(),
  contact: contact.optional(),
  // Usuarios que gestionan el organizador
  userIds: z
    .array(objectId("Falta el id de un usuario", "Algún usuario no tiene un id válido"), {
      error: "Los usuarios deben ser una lista de ids",
    })
    .max(20, "Un organizador no puede tener más de 20 usuarios")
    .optional(),
  status: z.enum(ORGANIZER_STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
  // Logo: se envía la URL y el servidor lo guarda en "images" (entityType "organizer")
  logoImageUrl: imageUrl("La URL del logo no es válida")
    .nullable() // null = sin logo
    .optional(),
};

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
export const createOrganizerSchema = z.object({ ...required, ...optional });

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updateOrganizerSchema = z.object({ ...required, ...optional }).partial();

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id del organizador no es válido"),
});
