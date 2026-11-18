import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideMapPin } from '@lucide/angular';
import { RegisterPayload } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { RegisterForm } from '../../components/register-form/register-form';

// Registro de clientes (/registro). Al crear la cuenta lleva al login para entrar con ella
@Component({
  selector: 'app-register-page',
  imports: [RouterLink, LucideMapPin, RegisterForm],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  async onSubmit(payload: RegisterPayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      await this.auth.register(payload);
      // ?registro=ok: el login enseña "Cuenta creada"
      await this.router.navigate(['/login'], { queryParams: { registro: 'ok' } });
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
