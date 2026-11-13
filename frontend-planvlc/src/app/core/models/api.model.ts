// Formato común de las respuestas del backend (ver backend-planvlc/src/ctrls y middleware/errorHandler.js)

// GET por id, POST y PATCH → { ok, message?, data }
export interface ApiResponse<T> {
  ok: boolean;
  message?: string;
  data: T;
}

// GET de listas → { ok, total, data: [...] }
export interface ApiListResponse<T> extends ApiResponse<T[]> {
  total: number;
}

// Error de validación de un campo concreto (Zod en validate.js)
export interface ApiFieldError {
  field: string;
  message: string;
}

// Errores → { ok: false, status, message, errors? }
export interface ApiErrorResponse {
  ok: false;
  status: number;
  message: string;
  errors?: ApiFieldError[];
}

// GET de listas paginadas (?page=2) → { ok, total, page, limit, totalPages, data: [...] }
export interface ApiPagedResponse<T> extends ApiListResponse<T> {
  page: number;
  limit: number;
  totalPages: number;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const EMPTY_PAGINATION: Pagination = { total: 0, page: 1, limit: 10, totalPages: 0 };
