import { Component, computed, input, output } from '@angular/core';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';
import { ShopCalendarSession } from '../../../../core/models/shop.model';
import { addMonths, buildMonth, dayLabel, monthTitle, timeOf } from '../../utils/calendar.utils';
import { priceText } from '../../utils/shop.utils';

// Calendario mensual de sesiones (solo UI). Recibe el mes y sus sesiones; avisa al padre
// al cambiar de mes o al pulsar una sesión. En escritorio es una rejilla; en móvil, una agenda por días.
@Component({
  selector: 'app-plan-calendar',
  imports: [LucideChevronLeft, LucideChevronRight],
  template: `
    <div class="overflow-hidden rounded-2xl border border-gris-200 bg-superficie shadow-xs">
      <div class="flex items-center justify-between gap-3 border-b border-gris-200 px-4 py-3">
        <button type="button" (click)="monthChange.emit(prevMonth())" aria-label="Mes anterior" class="flex h-9 w-9 items-center justify-center rounded-xl text-gris-600 hover:bg-gris-100"><svg lucideChevronLeft width="18" height="18"></svg></button>
        <h2 class="text-lg font-bold text-gris-900">{{ title() }}</h2>
        <button type="button" (click)="monthChange.emit(nextMonth())" aria-label="Mes siguiente" class="flex h-9 w-9 items-center justify-center rounded-xl text-gris-600 hover:bg-gris-100"><svg lucideChevronRight width="18" height="18"></svg></button>
      </div>

      <!-- Escritorio: rejilla de lunes a domingo -->
      <div class="hidden sm:block">
        <div class="grid grid-cols-7 border-b border-gris-200 bg-gris-50 text-center text-xs font-semibold uppercase tracking-wide text-gris-500">
          @for (name of weekDays; track name) { <div class="py-2">{{ name }}</div> }
        </div>
        @for (week of weeks(); track week[0].date) {
          <div class="grid grid-cols-7 border-b border-gris-100 last:border-b-0">
            @for (day of week; track day.date) {
              <div class="min-h-28 border-r border-gris-100 p-1.5 last:border-r-0" [class.bg-gris-50]="!day.inMonth">
                <span class="mb-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                  [class]="day.isToday ? 'bg-marca-600 text-white' : day.inMonth ? 'text-gris-700' : 'text-gris-300'">{{ day.day }}</span>
                <div class="space-y-1">
                  @for (session of day.sessions; track session._id) {
                    <button type="button" (click)="sessionSelect.emit(session)" [title]="session.planId.title"
                      class="block w-full truncate rounded-md bg-marca-50 px-1.5 py-1 text-left text-xs font-semibold text-marca-700 hover:bg-marca-100"
                      [class.opacity-50]="session.stock === 0">
                      <span class="font-normal">{{ timeOf(session.startDateTime) }}</span> {{ session.planId.title }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Móvil: solo los días con sesiones -->
      <div class="sm:hidden">
        @for (day of daysWithSessions(); track day.date) {
          <div class="border-b border-gris-100 px-4 py-3 last:border-b-0">
            <p class="mb-2 text-sm font-semibold text-gris-900">{{ dayLabel(day.date) }}</p>
            <div class="space-y-2">
              @for (session of day.sessions; track session._id) {
                <button type="button" (click)="sessionSelect.emit(session)" class="flex w-full items-center justify-between gap-3 rounded-xl bg-marca-50 px-3 py-2.5 text-left hover:bg-marca-100" [class.opacity-50]="session.stock === 0">
                  <span class="min-w-0">
                    <span class="block truncate text-sm font-semibold text-marca-700">{{ session.planId.title }}</span>
                    <span class="text-xs text-gris-500">{{ timeOf(session.startDateTime) }}{{ session.stock === 0 ? ' · Agotada' : '' }}</span>
                  </span>
                  <span class="shrink-0 text-sm font-bold text-gris-900">{{ priceText(session.price) }}</span>
                </button>
              }
            </div>
          </div>
        }
      </div>

      @if (!sessions().length) {
        <p class="border-t border-gris-100 px-4 py-6 text-center text-sm text-gris-500">No hay sesiones este mes con estos filtros.</p>
      }
    </div>
  `,
})
export class PlanCalendar {
  month = input.required<string>(); // AAAA-MM
  sessions = input<ShopCalendarSession[]>([]);
  monthChange = output<string>();
  sessionSelect = output<ShopCalendarSession>();

  readonly weekDays = ['lun', 'mar', 'mié', 'jue', 'vie', 'sáb', 'dom'];
  readonly weeks = computed(() => buildMonth(this.month(), this.sessions()));
  readonly daysWithSessions = computed(() => this.weeks().flat().filter(day => day.sessions.length));
  readonly title = computed(() => monthTitle(this.month()));
  readonly prevMonth = computed(() => addMonths(this.month(), -1));
  readonly nextMonth = computed(() => addMonths(this.month(), 1));

  readonly timeOf = timeOf;
  readonly dayLabel = dayLabel;
  readonly priceText = priceText;
}
