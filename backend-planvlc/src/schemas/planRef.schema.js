import { z } from "zod";
import { queryId } from "./list.schema.js";

// Esquemas de likes y lista de deseos (Zod): solo llevan el id del plan.
// El usuario no se envía nunca: es el de la sesión

// POST /api/likes y POST /api/wishlist
export const planBodySchema = z.object({
  planId: queryId("El id del plan no es válido"),
});

// DELETE /api/likes/:planId, DELETE /api/wishlist/:planId y GET /api/likes/:planId
export const planParamsSchema = z.object({
  planId: z.string().regex(/^[a-f\d]{24}$/i, "El id del plan no es válido"),
});
