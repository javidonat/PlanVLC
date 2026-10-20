import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Organizer, OrganizerPayload } from '../../../../core/models/organizer.model';
import { OrganizersService } from '../../../../core/services/organizers.service';
import { OrganizersStore } from '../../../../core/stores/organizers.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { OrganizerForm } from '../../components/organizer-form/organizer-form';

@Component({
  selector: 'app-organizer-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, OrganizerForm],
  templateUrl: './organizer-edit.html',
})
export class OrganizerEdit implements OnInit {
  private readonly service = inject(OrganizersService);
  private readonly store = inject(OrganizersStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly organizer = signal<Organizer | null>(null);
  readonly pageLoading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  ngOnInit(): void {
    void this.loadPage();
  }

  async loadPage(): Promise<void> {
    try {
      this.pageLoading.set(true);
      this.loadError.set(null);
      // Siempre al backend (datos frescos). GET /:id solo devuelve organizadores activos
      const res = await this.service.getById(this.id());
      this.organizer.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: OrganizerPayload): Promise<void> {
    const organizer = this.organizer();
    if (!organizer) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(organizer._id, payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/organizadores']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
