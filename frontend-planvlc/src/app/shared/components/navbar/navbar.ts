import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideLogOut, LucideMapPin } from '@lucide/angular';
import { AuthService } from '../../../core/services/auth.service';
import { AuthStore } from '../../../core/stores/auth.store';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, LucideMapPin, LucideLogOut],
  templateUrl: './navbar.html',
})
export class Navbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly store = inject(AuthStore);

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
