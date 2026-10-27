// Perfil del usuario (User 1 → 1 Profile). Backend: models/profile.model.js
// Si el usuario aún no tiene perfil, el backend lo devuelve vacío (sin _id ni fechas)
export interface Profile {
  _id?: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Lo que acepta PATCH /api/profiles/:userId (null = vaciar el campo)
export interface ProfilePayload {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
}
