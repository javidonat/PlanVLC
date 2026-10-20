import { ImageRef } from './plan.model';
import { UserRef } from './user.model';

// Organizador: quién organiza el plan (discoteca, empresa, club, promotora). Backend: models/organizer.model.js

// Estados propios del organizador (backend: models/constants.js → ORGANIZER_STATUSES)
export type OrganizerStatus = 'pending' | 'verified' | 'suspended';
// Tipos de organizador (backend: ORGANIZER_TYPES)
export type OrganizerType = 'nightclub' | 'company' | 'club' | 'promoter';

export const ORGANIZER_STATUSES: { value: OrganizerStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente de verificar' },
  { value: 'verified', label: 'Verificado' },
  { value: 'suspended', label: 'Suspendido' },
];

export const ORGANIZER_TYPES: { value: OrganizerType; label: string }[] = [
  { value: 'nightclub', label: 'Discoteca' },
  { value: 'company', label: 'Empresa' },
  { value: 'club', label: 'Club' },
  { value: 'promoter', label: 'Promotora' },
];

export function organizerStatusLabel(status: OrganizerStatus): string {
  return ORGANIZER_STATUSES.find(s => s.value === status)?.label ?? status;
}

export function organizerTypeLabel(type: OrganizerType): string {
  return ORGANIZER_TYPES.find(t => t.value === type)?.label ?? type;
}

// Datos de contacto (embebidos en el organizador). Todos opcionales
export interface OrganizerContact {
  email?: string;
  phone?: string;
  website?: string;
  instagram?: string;
}

export interface Organizer {
  _id: string;
  name: string;
  slug: string; // lo genera el servidor a partir del nombre
  type: OrganizerType;
  description: string;
  contact?: OrganizerContact;
  userIds: (string | UserRef)[]; // usuarios que gestionan el organizador (llegan poblados)
  logo?: ImageRef | null; // colección images con entityType "organizer"
  status: OrganizerStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que acepta POST /api/organizers y PATCH /api/organizers/:id
export interface OrganizerPayload {
  name: string;
  type: OrganizerType;
  description: string;
  contact: OrganizerContact;
  userIds: string[]; // solo ids
  status: OrganizerStatus;
  logoImageUrl: string | null; // null = sin logo
}
