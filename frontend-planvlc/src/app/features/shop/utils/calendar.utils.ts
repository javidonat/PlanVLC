import { ShopCalendarSession } from '../../../core/models/shop.model';

// Cálculos del calendario mensual (vista calendario del shop). Las fechas se ven en hora de Valencia

const TIME_ZONE = 'Europe/Madrid';

export interface CalendarDay {
  date: string; // AAAA-MM-DD
  day: number;
  inMonth: boolean; // false = relleno del mes anterior o siguiente
  isToday: boolean;
  sessions: ShopCalendarSession[];
}

// Día (AAAA-MM-DD) en Valencia de una fecha ISO
export function dayOf(iso: string | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(iso));
}

export function timeOf(iso: string): string {
  return new Intl.DateTimeFormat('es-ES', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

// '2027-10' → 'octubre de 2027'
export function monthLabel(month: string): string {
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, m - 1, 1)));
}

// Título del calendario: 'Octubre de 2027'
export function monthTitle(month: string): string {
  return capitalize(monthLabel(month));
}

// '2027-10' + 1 → '2027-11'
export function addMonths(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

// Semanas del mes (de lunes a domingo) con las sesiones de cada día
export function buildMonth(month: string, sessions: ShopCalendarSession[]): CalendarDay[][] {
  const [year, m] = month.split('-').map(Number);
  const byDay = new Map<string, ShopCalendarSession[]>();
  for (const session of sessions) {
    const key = dayOf(session.startDateTime);
    byDay.set(key, [...(byDay.get(key) ?? []), session]);
  }

  const today = dayOf(new Date());
  const first = new Date(Date.UTC(year, m - 1, 1));
  const offset = (first.getUTCDay() + 6) % 7; // lunes = 0
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < totalCells; i++) {
    const date = new Date(Date.UTC(year, m - 1, 1 + i - offset));
    const key = date.toISOString().slice(0, 10);
    const day: CalendarDay = {
      date: key,
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === m - 1,
      isToday: key === today,
      sessions: date.getUTCMonth() === m - 1 ? (byDay.get(key) ?? []) : [],
    };
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1].push(day);
  }
  return weeks;
}

// Para la agenda del móvil: '2027-10-05' → 'Martes, 5 de octubre'
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return capitalize(new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m - 1, d))));
}
