// Estados del ciclo editorial. Plan y Session usan los mismos (backend: models/constants.js)
export type Status = 'draft' | 'published' | 'cancelled' | 'finished';

export const STATUSES: { value: Status; label: string }[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'cancelled', label: 'Cancelado' },
  { value: 'finished', label: 'Finalizado' },
];

export function statusLabel(status: Status): string {
  return STATUSES.find(s => s.value === status)?.label ?? status;
}
