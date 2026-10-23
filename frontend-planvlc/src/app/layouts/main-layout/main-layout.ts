import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LucideBuilding2, LucideCalendarDays, LucideImage, LucideMapPin, LucideShieldCheck, LucideTags, LucideTicket, LucideUsers } from '@lucide/angular';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Loader } from '../../shared/components/loader/loader';

// Navbar lateral: una entrada por cada sección del panel.
// En escritorio el menú es una columna blanca fija a la izquierda (con el logo arriba);
// en móvil pasa a ser una fila de pestañas debajo de la barra superior.
@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, LucideTicket, LucideCalendarDays, LucideMapPin, LucideBuilding2, LucideTags, LucideUsers, LucideShieldCheck, LucideImage, Navbar, Loader],
  template: `
    <app-navbar /><app-loader />
    <aside class="sticky top-16 z-30 flex flex-col border-b border-gris-200 bg-white md:fixed md:inset-y-0 md:left-0 md:top-0 md:w-64 md:border-b-0 md:border-r">
      <a routerLink="/" class="hidden h-16 shrink-0 items-center gap-2.5 px-6 text-xl font-extrabold tracking-tight text-gris-900 md:flex" aria-label="PlanVLC, ir al inicio">
        <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-marca-500 to-marca-700 text-white shadow-sm" aria-hidden="true"><svg lucideMapPin width="18" height="18"></svg></span>
        <span>Plan<span class="text-marca-600">VLC</span></span>
      </a>
      <nav class="flex gap-1 overflow-x-auto px-3 py-2 md:flex-1 md:flex-col md:overflow-y-auto md:px-4 md:pb-4 md:pt-0" aria-label="Navegación lateral">
        <p class="menu-titulo hidden md:block">Contenido</p>
        <a routerLink="/admin/planes" routerLinkActive="activo" class="menu-link"><svg lucideTicket width="18" height="18"></svg> Planes</a>
        <a routerLink="/admin/sesiones" routerLinkActive="activo" class="menu-link"><svg lucideCalendarDays width="18" height="18"></svg> Sesiones</a>
        <a routerLink="/admin/lugares" routerLinkActive="activo" class="menu-link"><svg lucideMapPin width="18" height="18"></svg> Lugares</a>
        <a routerLink="/admin/organizadores" routerLinkActive="activo" class="menu-link"><svg lucideBuilding2 width="18" height="18"></svg> Organizadores</a>
        <a routerLink="/admin/categorias" routerLinkActive="activo" class="menu-link"><svg lucideTags width="18" height="18"></svg> Categorías</a>
        <a routerLink="/admin/imagenes" routerLinkActive="activo" class="menu-link"><svg lucideImage width="18" height="18"></svg> Imágenes</a>
        <p class="menu-titulo hidden md:block">Acceso</p>
        <a routerLink="/admin/usuarios" routerLinkActive="activo" class="menu-link"><svg lucideUsers width="18" height="18"></svg> Usuarios</a>
        <a routerLink="/admin/roles" routerLinkActive="activo" class="menu-link"><svg lucideShieldCheck width="18" height="18"></svg> Roles</a>
      </nav>
      <p class="hidden border-t border-gris-200 px-6 py-4 text-xs text-gris-400 md:block">PlanVLC · Panel de administración</p>
    </aside>
    <div class="flex min-h-[calc(100vh-4rem)] min-w-0 flex-col md:ml-64">
      <main class="min-w-0 flex-1"><router-outlet /></main>
      <footer class="border-t border-gris-200 py-6 text-center text-sm text-gris-500">PlanVLC · Planes y eventos en Valencia</footer>
    </div>
  `,
})
export class MainLayout {}
