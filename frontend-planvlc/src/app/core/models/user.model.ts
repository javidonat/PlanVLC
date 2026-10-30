import { ImageRef } from './plan.model';

// Usuario del sistema. El rol va en el usuario (roleId). Backend: models/user.model.js
// La contraseña nunca llega al frontend (el backend guarda solo su hash y no lo devuelve)

// Estados propios del usuario (backend: models/constants.js → USER_STATUSES)
export type UserStatus = 'active' | 'suspended' | 'banned';

export const USER_STATUSES: { value: UserStatus; label: string }[] = [
  { value: 'active', label: 'Normal' },
  { value: 'suspended', label: 'Suspendido' },
  { value: 'banned', label: 'Bloqueado' },
];

export function userStatusLabel(status: UserStatus): string {
  return USER_STATUSES.find(s => s.value === status)?.label ?? status;
}

// Rol tal y como llega con populate() (backend: repos/users.repo.js → POPULATE)
export type UserRoleRef = { _id: string; name: string };

// Avatar que se muestra en el panel: el del perfil (como en el navbar y en Perfiles);
// si no tiene perfil, el de "images"
export function userAvatarUrl(user: User): string | null {
  return user.profile?.avatar || user.avatar?.url || null;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  roleId: string | UserRoleRef; // puede llegar poblado o solo como id
  avatar?: ImageRef | null; // colección images con entityType "user"
  profile?: { avatar: string | null } | null; // perfil del usuario (profiles), con su avatar
  lastLoginAt: string | null;
  status: UserStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que devuelve GET /api/users/active (opciones del formulario de organizadores)
export type UserRef = Pick<User, '_id' | 'name' | 'email'>;

// Lo que acepta POST /api/users y PATCH /api/users/:id.
// password es obligatoria al crear; al editar solo se envía si se quiere cambiar
export interface UserPayload {
  name: string;
  email: string;
  roleId: string;
  password?: string;
  status: UserStatus;
  avatarImageUrl: string | null; // null = sin avatar
}
