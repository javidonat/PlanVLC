import { z } from "zod";

// Esquema de POST /api/ai/plan-chat (Zod). Todo tiene un tamaño máximo:
// así nadie puede mandar textos enormes al modelo (gastan créditos y facilitan las trampas al prompt)

const text = (max, label) => z.string({ error: `${label} debe ser un texto` }).trim().max(max, `${label} no puede superar los ${max} caracteres`);
const optionalText = (max, label) => text(max, label).optional().default("");
const date = (label) => z.iso.datetime({ offset: true, error: `${label} no es una fecha válida` });

// Lo que el frontend sabe del plan (lo mismo que se ve en la página de detalle)
const plan = z.object({
  title: text(200, "El título").min(1, "El título es obligatorio"),
  shortDescription: optionalText(500, "La descripción corta"),
  description: optionalText(5000, "La descripción"),
  categories: z.array(text(100, "La categoría")).max(10, "Demasiadas categorías").default([]),
  organizer: text(200, "El organizador").nullable().default(null),
  venue: z.object({
    name: text(200, "El lugar"),
    address: optionalText(300, "La dirección"),
    neighborhood: optionalText(100, "El barrio"),
    city: optionalText(100, "La ciudad"),
  }),
  priceFrom: z.number({ error: "El precio debe ser un número" }).min(0).max(100000),
  minAge: z.number({ error: "La edad mínima debe ser un número" }).int().min(0).max(120).default(0),
  tags: z.array(text(50, "La etiqueta")).max(30, "Demasiadas etiquetas").default([]),
});

// Sesiones (fechas) que se pueden reservar
const session = z.object({
  startDateTime: date("La fecha de inicio"),
  endDateTime: date("La fecha de fin").nullable().default(null),
  price: z.number({ error: "El precio debe ser un número" }).min(0).max(100000),
  stock: z.number().int().min(0).nullable().default(null), // plazas libres; null = sin límite
});

// Conversación: los últimos mensajes (el último, la pregunta del usuario)
const message = z.object({
  role: z.enum(["user", "assistant"], { error: "El rol del mensaje no es válido" }),
  content: text(1000, "El mensaje").min(1, "El mensaje está vacío"),
});

export const planChatSchema = z.object({
  plan,
  sessions: z.array(session).max(50, "Demasiadas sesiones").default([]),
  messages: z.array(message).min(1, "Falta la pregunta").max(12, "La conversación es demasiado larga"),
}).refine((body) => body.messages.at(-1).role === "user", { error: "El último mensaje debe ser la pregunta del usuario", path: ["messages"] });
