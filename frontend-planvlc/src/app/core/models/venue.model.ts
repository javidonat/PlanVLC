import { ImageRef } from './plan.model';

// Lugar: sitio físico donde ocurre un plan (sala, estadio, recinto...). Backend: models/venue.model.js

// Estados propios del lugar (backend: models/constants.js → VENUE_STATUSES)
export type VenueStatus = 'open' | 'renovation' | 'temporarily_closed' | 'permanently_closed';

export const VENUE_STATUSES: { value: VenueStatus; label: string }[] = [
  { value: 'open', label: 'Abierto' },
  { value: 'renovation', label: 'En obras' },
  { value: 'temporarily_closed', label: 'Cerrado temporalmente' },
  { value: 'permanently_closed', label: 'Cerrado definitivamente' },
];

export function venueStatusLabel(status: VenueStatus): string {
  return VENUE_STATUSES.find(s => s.value === status)?.label ?? status;
}

export interface Venue {
  _id: string;
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  postalCode: string;
  capacity: number | null; // null = sin dato
  // GeoJSON: coordinates es [longitud, latitud]
  location?: { type: 'Point'; coordinates: [number, number] } | null;
  coverImage?: ImageRef | null; // colección images con entityType "venue"
  galleryImages?: ImageRef[];
  status: VenueStatus;
  isActive: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Lo que acepta POST /api/venues y PATCH /api/venues/:id.
// Las coordenadas se envían sueltas (el servidor las guarda en location) y las imágenes como URLs.
export interface VenuePayload {
  name: string;
  address: string;
  neighborhood: string;
  city: string;
  province: string;
  postalCode: string;
  capacity: number | null;
  latitude: number | null; // null = sin ubicación
  longitude: number | null;
  status: VenueStatus;
  coverImageUrl: string | null; // null = sin portada
  galleryImageUrls: string[]; // [] = galería vacía
}
