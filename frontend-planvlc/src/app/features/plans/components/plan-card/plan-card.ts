import { Component, input, output } from '@angular/core';
import { LucideCalendarDays, LucideEye, LucideImage, LucideMapPin, LucidePencil, LucideTrash2 } from '@lucide/angular';
import { Plan } from '../../../../core/models/plan.model';
import { statusLabel } from '../../../../core/models/status.model';
import { categoriesLabel, planPriceText, sessionDateText, venueLabel } from '../../utils/plans.utils';

// Tarjeta de un plan en la vista de tarjetas del panel (las mismas acciones que la fila de la tabla).
// No llama a la API: avisa al padre con outputs.
@Component({
  selector: 'app-admin-plan-card',
  imports: [LucideCalendarDays, LucideEye, LucideImage, LucideMapPin, LucidePencil, LucideTrash2],
  host: { class: 'block' },
  template: `
    <article class="flex h-full flex-col overflow-hidden rounded-2xl border border-gris-200 bg-superficie shadow-sm" [class.opacity-70]="!!plan().deletedAt">
      <div class="relative bg-gris-100">
        @if (plan().coverImage; as cover) {
          <img [src]="cover.url" [alt]="cover.alt || plan().title" class="aspect-[16/9] w-full object-cover" loading="lazy" />
        } @else {
          <div class="flex aspect-[16/9] w-full items-center justify-center text-gris-400"><svg lucideImage width="32" height="32"></svg></div>
        }
        <span class="absolute left-3 top-3 rounded-full bg-superficie/95 px-2.5 py-1 text-xs font-semibold text-gris-700 shadow-sm">{{ statusLabel(plan().status) }}</span>
      </div>
      <div class="flex flex-1 flex-col p-4">
        <p class="text-xs font-semibold text-marca-600">{{ categoriesLabel(plan()) }}</p>
        <h3 class="mt-1 line-clamp-2 font-bold text-gris-900">{{ plan().title }}</h3>
        <p class="mt-1 text-sm font-semibold text-gris-700">{{ planPriceText(plan()) }}</p>
        <div class="mt-3 flex-1 space-y-1 text-sm text-gris-600">
          <p class="flex items-center gap-1.5"><svg lucideCalendarDays width="15" height="15" class="shrink-0"></svg> {{ sessionDateText(plan().nextSessionAt) }}</p>
          <p class="flex items-center gap-1.5"><svg lucideMapPin width="15" height="15" class="shrink-0"></svg> <span class="truncate">{{ venueLabel(plan()) }}</span></p>
        </div>
        <div class="mt-4 flex items-center justify-between gap-2 border-t border-gris-100 pt-4">
          @if (plan().deletedAt) {
            <span class="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">Eliminado</span>
          } @else {
            <button type="button" role="switch" [attr.aria-checked]="plan().isActive" [disabled]="busy()" (click)="toggleClick.emit(plan())" [attr.aria-label]="(plan().isActive ? 'Desactivar ' : 'Activar ') + plan().title" [class]="plan().isActive ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'border-red-300 bg-red-100 text-red-800 hover:bg-red-200'" class="inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60"><span class="h-2 w-2 rounded-full" [class.bg-emerald-600]="plan().isActive" [class.bg-red-600]="!plan().isActive"></span>{{ plan().isActive ? 'Activo' : 'Inactivo' }}</button>
          }
          <div class="flex gap-1.5">
            <button type="button" (click)="viewClick.emit(plan())" class="rounded-lg border border-gris-200 p-2 text-gris-600 hover:bg-gris-100 hover:text-gris-900" [attr.aria-label]="'Ver ' + plan().title"><svg lucideEye width="16" height="16"></svg></button>
            @if (!plan().deletedAt) {
              @if (plan().isActive) {
                <button type="button" (click)="editClick.emit(plan())" class="rounded-lg border border-gris-200 p-2 text-gris-600 hover:bg-marca-50 hover:text-marca-700" [attr.aria-label]="'Editar ' + plan().title"><svg lucidePencil width="16" height="16"></svg></button>
              }
              <button type="button" [disabled]="busy()" (click)="deleteClick.emit(plan())" class="rounded-lg border border-gris-200 p-2 text-red-600 hover:bg-red-50" [attr.aria-label]="'Eliminar ' + plan().title"><svg lucideTrash2 width="16" height="16"></svg></button>
            }
          </div>
        </div>
      </div>
    </article>
  `,
})
export class AdminPlanCard {
  plan = input.required<Plan>();
  busy = input(false);
  viewClick = output<Plan>();
  editClick = output<Plan>();
  toggleClick = output<Plan>();
  deleteClick = output<Plan>();

  readonly categoriesLabel = categoriesLabel;
  readonly venueLabel = venueLabel;
  readonly planPriceText = planPriceText;
  readonly sessionDateText = sessionDateText;
  readonly statusLabel = statusLabel;
}
