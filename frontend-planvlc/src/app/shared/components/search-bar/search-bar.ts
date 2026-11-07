import { Component, OnDestroy, input, linkedSignal, output } from '@angular/core';
import { LucideSearch, LucideX } from '@lucide/angular';

// Buscador reutilizable (solo UI). Emite el texto cuando se deja de escribir (debounce),
// así no se lanza una petición por cada tecla. Enter o la X emiten al momento.
@Component({
  selector: 'app-search-bar',
  imports: [LucideSearch, LucideX],
  template: `
    <div class="relative">
      <svg lucideSearch width="18" height="18" class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gris-400"></svg>
      <input type="search" [value]="text()" (input)="onInput($any($event.target).value)" (keydown.enter)="emitNow()"
        [placeholder]="placeholder()" [attr.aria-label]="placeholder()" maxlength="100"
        class="field-input pl-10 pr-10 [&::-webkit-search-cancel-button]:hidden" />
      @if (text()) {
        <button type="button" (click)="clear()" aria-label="Borrar búsqueda" class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gris-400 hover:bg-gris-100 hover:text-gris-700"><svg lucideX width="16" height="16"></svg></button>
      }
    </div>
  `,
})
export class SearchBar implements OnDestroy {
  value = input(''); // búsqueda actual (ej. la de la URL)
  placeholder = input('Buscar…');
  delay = input(400); // ms sin escribir antes de emitir
  searchChange = output<string>();

  // Lo que hay escrito. Si cambia value (ej. volver atrás en el navegador), se actualiza
  readonly text = linkedSignal(() => this.value());
  private timer: ReturnType<typeof setTimeout> | undefined;

  onInput(value: string): void {
    this.text.set(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.emitNow(), this.delay());
  }

  emitNow(): void {
    clearTimeout(this.timer);
    const value = this.text().trim();
    if (value !== this.value()) this.searchChange.emit(value);
  }

  clear(): void {
    this.text.set('');
    this.emitNow();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timer);
  }
}
