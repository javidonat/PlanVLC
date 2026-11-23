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

// Media de valoraciones del plan (average null si aún no hay comentarios)
export interface CommentStats {
  count: number;
  average: number | null;
}

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
