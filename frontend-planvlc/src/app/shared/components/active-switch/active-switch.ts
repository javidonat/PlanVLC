import { Component, input, output } from '@angular/core';

// Interruptor Activo/Inactivo de las páginas de editar (mismo aspecto que el de los listados).
// No llama a la API: avisa al padre con toggle
@Component({
  selector: 'app-active-switch',
  template: `
    <button type="button" role="switch" [attr.aria-checked]="active()" [disabled]="busy()" (click)="toggle.emit()" [attr.aria-label]="(active() ? 'Desactivar ' : 'Activar ') + name()" [class]="active() ? 'border-emerald-300 bg-emerald-100 text-emerald-800 hover:bg-emerald-200' : 'border-red-300 bg-red-100 text-red-800 hover:bg-red-200'" class="inline-flex min-w-[7rem] cursor-pointer items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60"><span class="h-2 w-2 rounded-full" [class.bg-emerald-600]="active()" [class.bg-red-600]="!active()"></span>{{ active() ? (feminine() ? 'Activa' : 'Activo') : (feminine() ? 'Inactiva' : 'Inactivo') }}</button>
  `,
})
export class ActiveSwitch {
  active = input.required<boolean>();
  busy = input(false);
  name = input(''); // para el aria-label
  feminine = input(false); // "Activa" / "Inactiva" (categoría, imagen, sesión)
  toggle = output<void>();
}
