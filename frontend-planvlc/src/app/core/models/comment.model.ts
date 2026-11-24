import { ApiPagedResponse } from './api.model';

// Comentarios (opiniones) de los planes. Backend: routes/comments.routes.js
// Cualquiera los lee; para escribir hay que estar logueado y cada usuario solo borra los suyos (el admin, todos)

// Autor del comentario (populate de userId con su nombre y el avatar del perfil)
export interface CommentAuthor {
  _id: string;
  name: string;
  profile?: { avatar?: string | null } | null;
}

export interface PlanComment {
  _id: string;
  planId: string;
  userId: CommentAuthor | null; // null si el usuario ya no existe
  rating: number; // 1 a 5 estrellas
  text: string;
  createdAt: string;
}

// Resumen de valoraciones del plan (average y recommendPercent son null si aún no hay comentarios)
export interface CommentStats {
  count: number;
  average: number | null;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>; // cuántas opiniones hay de cada estrella
  recommendPercent: number | null; // % de opiniones con 4 o 5 estrellas
}

export const EMPTY_COMMENT_STATS: CommentStats = { count: 0, average: null, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, recommendPercent: null };

// GET /api/comments?plan=<slug>&page=&limit= → lista paginada + stats
export interface CommentsResponse extends ApiPagedResponse<PlanComment> {
  stats: CommentStats;
}

// Lo que escribe el usuario en el formulario
export interface CommentDraft {
  rating: number;
  text: string;
}

// POST /api/comments (el autor lo pone el backend con el usuario de la sesión)
export interface CommentPayload extends CommentDraft {
  planId: string;
}

// GET /api/comments/summary (admin): un resumen por plan con comentarios
export interface CommentsSummaryItem {
  planId: string;
  title: string;
  slug: string;
  count: number;
  average: number | null;
  lastCommentAt: string;
}
