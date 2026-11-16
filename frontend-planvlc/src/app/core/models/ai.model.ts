// Chatbot del detalle de un plan. Backend: servicio de IA (ai-planvlc), a través de la API Gateway

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Lo que el asistente sabe del plan: los mismos datos que se ven en la página (la IA no accede a la base de datos)
export interface PlanChatContext {
  title: string;
  shortDescription: string;
  description: string;
  categories: string[];
  organizer: string | null;
  venue: { name: string; address: string; neighborhood: string; city: string };
  priceFrom: number;
  minAge: number;
  tags: string[];
}

export interface PlanChatSession {
  startDateTime: string;
  endDateTime: string | null;
  price: number;
  stock: number | null; // null = sin límite
}

// POST /api/ai/plan-chat (el último mensaje es la pregunta del usuario)
export interface PlanChatRequest {
  plan: PlanChatContext;
  sessions: PlanChatSession[];
  messages: ChatMessage[];
}
