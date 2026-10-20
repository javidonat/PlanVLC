// Rol de un usuario: admin, editor, organizer, user... Backend: models/role.model.js

export interface Role {
  _id: string;
  name: string; // único, en minúsculas
  description: string;
  permissions: string[]; // formato "recurso:acción", ej. "plans:write"
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que devuelve GET /api/roles/active (opciones del formulario de usuarios)
export type RoleRef = Pick<Role, '_id' | 'name' | 'description'>;

// Lo que acepta POST /api/roles y PATCH /api/roles/:id
export interface RolePayload {
  name: string;
  description: string;
  permissions: string[];
}
