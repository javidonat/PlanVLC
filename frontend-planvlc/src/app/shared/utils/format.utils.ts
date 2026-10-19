// Utilidades de formato comunes a todas las secciones del panel

// Fecha y hora en hora de Valencia (creación, modificación, borrado...). Sin fecha → '—'
export function dateTimeText(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

// Texto de una opción ({ value, label }) a partir de su valor: estados, grupos, tipos...
export function optionLabel<T extends string>(options: { value: T; label: string }[], value: T): string {
  return options.find(option => option.value === value)?.label ?? value;
}

// Igual que el backend: URLs de imagen http(s)
export const IMAGE_URL_PATTERN = /^https?:\/\/\S+$/i;
