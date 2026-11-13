import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideLogOut, LucideMapPin } from '@lucide/angular';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';
import { ThemeStore } from '../../../core/stores/theme.store';
import { ThemeToggle } from '../theme-toggle/theme-toggle';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, LucideMapPin, LucideLogOut, ThemeToggle],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly store = inject(AuthStore);
  readonly theme = inject(ThemeStore);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
