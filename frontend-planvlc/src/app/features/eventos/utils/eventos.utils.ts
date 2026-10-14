// Funciones pequeñas para mostrar los datos de un evento en español.

// Las fechas del backend son medianoche UTC ("2025-10-04T00:00:00.000Z").
// Usamos timeZone 'UTC' para que el día mostrado nunca se desplace.
const opcionesUTC = { timeZone: 'UTC' } as const;

export function diaDelMes(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-ES', { ...opcionesUTC, day: '2-digit' });
}

export function mesCorto(fechaIso: string): string {
  return new Date(fechaIso)
    .toLocaleDateString('es-ES', { ...opcionesUTC, month: 'short' })
    .replace('.', '');
}

export function fechaLarga(fechaIso: string): string {
  return new Date(fechaIso).toLocaleDateString('es-ES', {
    ...opcionesUTC,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Un evento es "pasado" si su fecha es anterior al día de hoy
export function esPasado(fechaIso: string): boolean {
  const hoy = new Date();
  const inicioHoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  return new Date(fechaIso).getTime() < inicioHoyUTC;
}

export function precioTexto(precio: number): string {
  if (precio === 0) return 'Gratis';
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    // 10 € (sin decimales) pero 12,50 € si tiene céntimos
    minimumFractionDigits: Number.isInteger(precio) ? 0 : 2,
  }).format(precio);
}

export function edadTexto(edadMinima: number): string {
  return edadMinima === 0 ? 'Todas las edades' : `Mayores de ${edadMinima} años`;
}

export function entradasTexto(entradas: number | null): string {
  if (entradas === null || entradas === undefined) return 'Sin límite de aforo';
  if (entradas === 0) return 'Agotadas';
  return `${entradas} disponibles`;
}

// Quita tildes y pasa a minúsculas para buscar sin fallar por acentos ("ruzafa" = "Ruzafa")
export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}
