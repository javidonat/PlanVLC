import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../../shared/components/navbar/navbar';
import { Loader } from '../../shared/components/loader/loader';

@Component({
  selector: 'app-main-layout',
  imports: [RouterOutlet, Navbar, Loader],
  template: `<app-navbar /><app-loader /><main class="min-h-[calc(100vh-8rem)]"><router-outlet /></main><footer class="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">PlanVLC · Planes y eventos en Valencia</footer>`,
})
export class MainLayout {}
