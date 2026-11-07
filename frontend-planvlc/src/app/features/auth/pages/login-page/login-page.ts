import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LucideMapPin } from '@lucide/angular';
import { LoginPayload } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthStore } from '../../../../core/stores/auth.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { LoginForm } from '../../components/login-form/login-form';

// Página de login (fuera del panel: sin menú lateral). No hay registro: los usuarios los crea un admin
@Component({
  selector: 'app-login-page',
  imports: [LucideMapPin, LoginForm],
  templateUrl: './login-page.html',
})
export class LoginPage {
  private readonly auth = inject(AuthService);
  private readonly authStore = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  async onSubmit(payload: LoginPayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      await this.auth.login(payload);
      // Vuelve a la página que pedía el guard o, si no, el admin al panel y el resto al home
      const home = this.authStore.isAdmin() ? '/admin/planes' : '/';
      await this.router.navigateByUrl(this.route.snapshot.queryParamMap.get('returnUrl') || home);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
