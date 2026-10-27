// Autenticación con JWT. Backend: routes/auth.routes.js (solo login y logout, no hay registro)

// Rol tal y como lo guarda el backend en roles.name (admin, editor, organizer, user)
export const ADMIN_ROLE = 'admin';

// Usuario autenticado: lo que devuelve el login (y lo que se guarda en localStorage)
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
}

// Lo que acepta POST /api/auth/login
export interface LoginPayload {
  email: string;
  password: string;
}

// data de la respuesta de POST /api/auth/login
export interface LoginResponse {
  token: string;
  tokenType: 'Bearer';
  expiresIn: string;
  user: AuthUser;
}
