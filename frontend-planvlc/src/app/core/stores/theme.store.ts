import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'planvlc-theme';

// Modo claro / oscuro. Siempre empieza en claro: solo se pone oscuro si el usuario lo elige
// con el botón (ThemeToggle). La elección se guarda en el navegador (localStorage). El tema se aplica con la clase "dark" en <html> (ver styles.css).
// index.html la pone antes de que arranque Angular para que la página no parpadee en blanco.
@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly _theme = signal<Theme>(this.initialTheme());
  readonly theme = this._theme.asReadonly();

  constructor() {
    effect(() => {
      const theme = this._theme();
      document.documentElement.classList.toggle('dark', theme === 'dark');
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // sin localStorage (modo privado...) el tema dura hasta recargar
      }
    });
  }

  toggle(): void {
    this._theme.update(theme => (theme === 'dark' ? 'light' : 'dark'));
  }

  private initialTheme(): Theme {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'dark') return 'dark';
    } catch {
      // sin localStorage: claro
    }
    return 'light';
  }
}
