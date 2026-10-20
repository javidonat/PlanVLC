import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideCalendarDays, LucideMapPin, LucideTags, LucideTicket } from '@lucide/angular';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Loader } from '../../shared/components/loader/loader';

// Navbar lateral: una entrada por cada sección del panel
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideTicket, LucideCalendarDays, LucideMapPin, LucideTags, Navbar, Loader],
  template: `
    <app-navbar /><app-loader />
    <div class="flex min-h-[calc(100vh-8rem)] flex-col md:flex-row">
      <aside class="shrink-0 border-b border-slate-200 bg-white md:w-60 md:border-b-0 md:border-r">
        <nav class="flex gap-1 overflow-x-auto p-3 md:sticky md:top-16 md:flex-col md:p-4" aria-label="Navegación lateral">
          <a routerLink="/admin/planes" routerLinkActive="bg-blue-50 text-blue-700" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"><svg lucideTicket width="18" height="18"></svg> Planes</a>
          <a routerLink="/admin/sesiones" routerLinkActive="bg-blue-50 text-blue-700" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"><svg lucideCalendarDays width="18" height="18"></svg> Sesiones</a>
          <a routerLink="/admin/lugares" routerLinkActive="bg-blue-50 text-blue-700" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"><svg lucideMapPin width="18" height="18"></svg> Lugares</a>
          <a routerLink="/admin/categorias" routerLinkActive="bg-blue-50 text-blue-700" class="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"><svg lucideTags width="18" height="18"></svg> Categorías</a>
        </nav>
      </aside>
      <main class="min-w-0 flex-1"><router-outlet /></main>
    </div>
    <footer class="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">PlanVLC · Planes y eventos en Valencia</footer>
  `,
})
export class MainLayout {}
