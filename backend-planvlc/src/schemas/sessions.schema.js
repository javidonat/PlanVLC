import { z } from "zod";
import { STATUSES } from "../models/constants.js";

// Esquemas de validación de las rutas de sesiones (Zod).
// Los campos que no aparecen aquí (sku, isActive, deletedAt...) se descartan del body.

// id de MongoDB (ObjectId: 24 caracteres hexadecimales)
const objectId = (required, invalid) =>
  z
    .string({ error: (issue) => (issue.input === undefined ? required : invalid) })
    .regex(/^[a-f\d]{24}$/i, invalid);

// Fecha en formato ISO con zona horaria (ej. "2025-10-12T15:00:00.000Z")
const date = (required, invalid) =>
  z.iso.datetime({ offset: true, error: (issue) => (issue.input === undefined ? required : invalid) });

// Número entero >= 0. null = sin límite (aforo y stock)
const limit = (type, negative) =>
  z.number({ error: type }).int(type).min(0, negative).nullable().optional();

const required = {
  planId: objectId("El plan es obligatorio", "El id del plan no es válido"),
  startDateTime: date("La fecha de inicio es obligatoria", "La fecha de inicio no es válida"),
};

const optional = {
  endDateTime: date("La fecha de fin no es válida", "La fecha de fin no es válida")
    .nullable() // null = sin hora de fin
    .optional(),
  price: z
    .number({ error: "El precio debe ser un número" })
    .min(0, "El precio no puede ser negativo")
    .optional(),
  capacity: limit("El aforo debe ser un número entero", "El aforo no puede ser negativo"),
  stock: limit("El stock debe ser un número entero", "El stock no puede ser negativo"),
  status: z.enum(STATUSES, { error: (issue) => `El estado '${issue.input}' no es válido` }).optional(),
};

// Reglas entre campos: la fecha de fin, después de la de inicio; el stock, como mucho el aforo.
// Solo se comprueban si vienen los dos campos (en un PATCH el servicio las comprueba con los datos guardados)
const checkDates = (data) => !data.endDateTime || !data.startDateTime || new Date(data.endDateTime) > new Date(data.startDateTime);
const checkStock = (data) => data.stock == null || data.capacity == null || data.stock <= data.capacity;

const DATES_ERROR = { message: "La fecha de fin debe ser posterior a la de inicio", path: ["endDateTime"] };
const STOCK_ERROR = { message: "El stock no puede superar el aforo", path: ["stock"] };

// POST: obligatorios + opcionales (si faltan los opcionales, usa los valores por defecto del modelo)
export const createSessionSchema = z
  .object({ ...required, ...optional })
  .refine(checkDates, DATES_ERROR)
  .refine(checkStock, STOCK_ERROR);

// PATCH: todos opcionales. El plan no se puede cambiar: la sesión pertenece siempre al mismo plan
export const updateSessionSchema = z
  .object({ startDateTime: required.startDateTime, ...optional })
  .partial()
  .refine(checkDates, DATES_ERROR)
  .refine(checkStock, STOCK_ERROR);

// PATCH /:id/active
export const activeSchema = z.object({
  isActive: z.boolean({ error: "isActive es obligatorio y debe ser true o false" }),
});

// :id de MongoDB
export const idParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "El id de la sesión no es válido"),
});
