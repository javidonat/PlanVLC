// Perfil del usuario (User 1 → 1 Profile). Backend: models/profile.model.js
// Si el usuario aún no tiene perfil, el backend lo devuelve vacío (sin _id ni fechas)
export interface Profile {
  _id?: string;
  userId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  avatar: string | null; // URL de la imagen. Por defecto, un robot de DiceBear
  isActive?: boolean; // sigue al usuario: se desactiva o elimina con él (integridad referencial)
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

// Perfil del listado del panel (GET /api/profiles): userId llega poblado con el nombre y el email
export type ProfileUserRef = { _id: string; name: string; email: string };

export interface AdminProfile extends Omit<Profile, 'userId'> {
  _id: string;
  userId: ProfileUserRef | null; // null si el usuario ya no existe
}

// Lo que acepta PATCH /api/profiles/:userId (null = vaciar el campo; en avatar, volver al robot)
export interface ProfilePayload {
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
}
