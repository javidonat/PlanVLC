// Estados del ciclo editorial. Los usan Plan y Session.
// (draft = borrador, published = publicado, cancelled = cancelado, finished = finalizado)
export const STATUSES = ["draft", "published", "cancelled", "finished"];

// Estados propios de cada entidad. No sustituyen a isActive (interruptor del panel)
// ni a deletedAt (soft delete): describen la situación real de cada documento.

// Grupos de categorías (para agruparlas en el frontend)
export const CATEGORY_GROUPS = ["nightlife", "sports", "activities", "other"];

// Categoría: draft = en preparación, published = visible, archived = ya no se usa en planes nuevos
export const CATEGORY_STATUSES = ["draft", "published", "archived"];

// Lugar: open = abierto, renovation = en obras, temporarily_closed = cerrado temporalmente,
// permanently_closed = cerrado definitivamente
export const VENUE_STATUSES = ["open", "renovation", "temporarily_closed", "permanently_closed"];

// Tipos de organizador: discoteca, empresa, club, promotora
export const ORGANIZER_TYPES = ["nightclub", "company", "club", "promoter"];

// Organizador: pending = pendiente de verificar, verified = verificado, suspended = suspendido
export const ORGANIZER_STATUSES = ["pending", "verified", "suspended"];

// Usuario: active = cuenta normal, suspended = suspendido temporalmente, banned = bloqueado
export const USER_STATUSES = ["active", "suspended", "banned"];

// Imágenes: a qué entidades puede pertenecer una imagen (images.entityType)
// y qué tipos de imagen admite cada una (images.type)
export const IMAGE_ENTITY_TYPES = {
  plan: ["cover", "gallery"],
  venue: ["cover", "gallery"],
  category: ["cover"],
  organizer: ["logo"],
  user: ["avatar"],
};
