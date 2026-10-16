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
