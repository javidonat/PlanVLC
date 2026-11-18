// Autenticación con cookies. Backend: routes/auth.routes.js (register, login, refresh, logout y me).
// La sesión va en dos cookies httpOnly (access_token y refresh_token) que pone el backend:
// el frontend no ve ni guarda ningún token

// Rol tal y como lo guarda el backend en roles.name (admin, editor, organizer, user)
export const ADMIN_ROLE = 'admin';

// Usuario de la sesión: lo que devuelven el login y GET /api/auth/me (no se guarda en localStorage)
export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null; // avatar del perfil (URL). Si no llega, el navbar muestra las iniciales
}

// Lo que acepta POST /api/auth/login
export interface LoginPayload {
  email: string;
  password: string;
}

// Lo que acepta POST /api/auth/register (alta de un cliente: el rol lo pone el backend)
export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}
