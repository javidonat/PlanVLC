import { ImageRef } from './plan.model';

// Carrito del usuario. Backend: routes/cart.routes.js (todo con sesión).
// Todas las rutas devuelven el carrito completo y recalculado por el backend: el frontend
// solo envía qué sesión (fecha) y cuántas entradas; precios, subtotales y total no se calculan aquí

export interface CartItem {
  _id: string;
  quantity: number;
  unitPrice: number; // precio actual de la sesión
  subtotal: number; // unitPrice × quantity
  available: boolean; // false si ya no se puede comprar (no cuenta en el total)
  issue: string | null; // por qué no (fecha pasada, sin plazas...)
  plan: { _id: string; title: string; slug: string; coverImage: ImageRef | null } | null;
  session: { _id: string; startDateTime: string; endDateTime: string | null; price: number; currency: string; stock: number | null } | null;
}

export interface Cart {
  _id: string | null; // null si el usuario aún no ha añadido nada nunca
  items: CartItem[];
  totalItems: number; // entradas (suma de cantidades) de las líneas disponibles
  total: number;
  currency: string;
  hasIssues: boolean; // alguna línea no se puede comprar
  maxQuantity: number; // máximo de entradas por línea
}

export const EMPTY_CART: Cart = { _id: null, items: [], totalItems: 0, total: 0, currency: 'EUR', hasIssues: false, maxQuantity: 10 };

// POST /api/cart/items
export interface AddCartItemPayload {
  sessionId: string;
  quantity: number;
}

// PUT /api/cart/items/:id (cantidad y/o otra fecha del mismo plan)
export interface UpdateCartItemPayload {
  quantity?: number;
  sessionId?: string;
}
