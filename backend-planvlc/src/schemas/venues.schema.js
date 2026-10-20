import { z } from "zod";
import { VENUE_STATUSES } from "../models/constants.js";

// Esquemas de validación de las rutas de lugares (Zod).
// Los campos que no aparecen aquí (location, isActive, deletedAt...) se descartan del body.
// Las coordenadas se envían como latitude y longitude; el servidor las guarda en location (GeoJSON).

// Texto obligatorio: distingue "falta" de "no es texto"
const text = (required, type) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : type) })
    .trim()
    .min(1, required);

// Texto opcional con longitud máxima
const optionalText = (type, max, maxMessage) => z.string({ error: type }).trim().max(max, maxMessage).optional();

// URL de imagen (http o https)
const imageUrl = (invalid) =>
  z
    .string({ error: invalid })
    .trim()
    .pipe(z.url({ protocol: /^https?$/, error: invalid }));

const required = {
  name: text("El nombre es obligatorio", "El nombre debe ser un texto").max(
    100,
    "El nombre no puede superar los 100 caracteres"
  ),
};

const optional = {
  address: optionalText("La dirección debe ser un texto", 200, "La dirección no puede superar los 200 caracteres"),
  neighborhood: optionalText("El barrio debe ser un texto", 80, "El barrio no puede superar los 80 caracteres"),
  city: optionalText("La ciudad debe ser un texto", 80, "La ciudad no puede superar los 80 caracteres"),
  province: optionalText("La provincia debe ser un texto", 80, "La provincia no puede superar los 80 caracteres"),
  postalCode: z
    .string({ error: "El código postal debe ser un texto" })
    .trim()
    .regex(/^(\d{5})?$/, "El código postal debe tener 5 números")
    .optional(),
  capacity: z
    .number({ error: "El aforo debe ser un número entero" })
    .int("El aforo debe ser un número entero")
    .min(0, "El aforo no puede ser negativo")
    .nullable() // null = sin dato
    .optional(),
  latitude: z
    .number({ error: "La latitud debe ser un número" })
    .min(-90, "La latitud debe estar entre -90 y 90")
    .max(90, "La latitud debe estar entre -90 y 90")
    .nullable()
    .optional(),
  longitude: z
    .number({ error: "La longitud debe ser un número" })
    .min(-180, "La longitud debe estar entre -180 y 180")
    .max(180, "La longitud debe estar entre -180 y 180")
    .nullable()
    .optional(),
  status: z.enum(VENUE_STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
  // Imágenes: se envían URLs y el servidor las guarda en "images" (entityType "venue")
  coverImageUrl: imageUrl("La URL de la portada no es válida")
    .nullable() // null = sin portada
    .optional(),
  galleryImageUrls: z
    .array(imageUrl("Alguna URL de la galería no es válida"), {
      error: "La galería debe ser una lista de URLs",
    })
    .max(10, "La galería no puede tener más de 10 imágenes")
    .optional(),
};

// Las coordenadas van juntas: o las dos o ninguna
const checkCoordinates = (data) => (data.latitude == null) === (data.longitude == null);
const COORDINATES_ERROR = { message: "Indica la latitud y la longitud, o ninguna de las dos", path: ["longitude"] };

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
export const createVenueSchema = z.object({ ...required, ...optional }).refine(checkCoordinates, COORDINATES_ERROR);

// PATCH: todos los campos son opcionales (se modifican solo los que se envían)
export const updateVenueSchema = z
  .object({ ...required, ...optional })
  .partial()
  .refine(checkCoordinates, COORDINATES_ERROR);

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id del lugar no es válido"),
});
