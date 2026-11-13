import { Component, input, output } from '@angular/core';
import { LucideMoon, LucideSun } from '@lucide/angular';

// Botón de modo claro / oscuro (solo UI): enseña el icono del modo al que se cambia y avisa al padre
@Component({
  selector: 'app-theme-toggle',
  imports: [LucideMoon, LucideSun],
  template: `
    <button type="button" (click)="toggle.emit()" [attr.aria-label]="dark() ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'" [title]="dark() ? 'Modo claro' : 'Modo oscuro'"
      class="flex h-10 w-10 items-center justify-center rounded-xl text-gris-600 hover:bg-gris-100 hover:text-gris-900">
      @if (dark()) { <svg lucideSun width="18" height="18"></svg> } @else { <svg lucideMoon width="18" height="18"></svg> }
    </button>
  `,
})
export class ThemeToggle {
  dark = input(false);
  toggle = output<void>();
}
