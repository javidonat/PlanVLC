import { z } from "zod";
import { queryId } from "./list.schema.js";

// Esquemas del carrito (Zod). Solo se envía qué sesión y cuántas entradas: precios y totales los calcula el backend
const quantity = z
  .number({ error: "La cantidad debe ser un número" })
  .int("La cantidad debe ser un número entero")
  .min(1, "La cantidad mínima es 1");

// POST /api/cart/items (sin quantity → 1)
export const addCartItemSchema = z.object({
  sessionId: queryId("La fecha elegida no es válida"),
  quantity: quantity.default(1),
});

// PUT /api/cart/items/:id: nueva cantidad y/o nueva fecha (otra sesión del mismo plan)
export const updateCartItemSchema = z
  .object({
    quantity: quantity.optional(),
    sessionId: queryId("La fecha elegida no es válida").optional(),
  })
  .refine((data) => data.quantity !== undefined || data.sessionId !== undefined, { message: "Indica la cantidad o la fecha" });

// Cabecera If-Match: versión del carrito que tiene el cliente (concurrencia). Opcional: "3" o 3
export const cartVersionSchema = z.coerce
  .number({ error: "La cabecera If-Match debe ser la versión del carrito" })
  .int("La cabecera If-Match debe ser la versión del carrito")
  .min(0, "La cabecera If-Match debe ser la versión del carrito")
  .optional();

export const cartItemParamsSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "La línea del carrito no es válida"),
});
