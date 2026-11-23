import { z } from "zod";

// Esquema de POST /api/ai/reviews-analysis (Zod). Todo tiene tamaño máximo (créditos y trampas al prompt)
export const reviewsAnalysisSchema = z.object({
  plan: z.object({
    title: z.string({ error: "El título debe ser un texto" }).trim().min(1, "El título es obligatorio").max(200, "El título no puede superar los 200 caracteres"),
  }),
  // Los comentarios que se analizan (el frontend manda los más recientes)
  comments: z
    .array(
      z.object({
        rating: z.number({ error: "La valoración debe ser un número" }).int().min(1).max(5),
        text: z.string({ error: "El comentario debe ser un texto" }).trim().min(1).max(1000, "El comentario no puede superar los 1000 caracteres"),
      })
    )
    .min(1, "No hay comentarios que analizar")
    .max(50, "Como mucho se analizan 50 comentarios"),
});
