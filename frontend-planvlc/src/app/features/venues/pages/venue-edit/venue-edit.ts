import { Component, OnInit, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Venue, VenuePayload } from '../../../../core/models/venue.model';
import { VenuesService } from '../../../../core/services/venues.service';
import { VenuesStore } from '../../../../core/stores/venues.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { VenueForm } from '../../components/venue-form/venue-form';

@Component({
  selector: 'app-venue-edit',
  imports: [RouterLink, SkeletonLoader, ErrorState, VenueForm],
  templateUrl: './venue-edit.html',
})
export class VenueEdit implements OnInit {
  private readonly service = inject(VenuesService);
  private readonly store = inject(VenuesStore);
  readonly router = inject(Router);

  // :id de la URL (withComponentInputBinding en app.config.ts)
  readonly id = input.required<string>();

  readonly venue = signal<Venue | null>(null);
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
      // Siempre al backend (datos frescos). GET /:id solo devuelve lugares activos
      const res = await this.service.getById(this.id());
      this.venue.set(res.data);
    } catch (error) {
      this.loadError.set(apiError(error).message);
    } finally {
      this.pageLoading.set(false);
    }
  }

  async onSubmit(payload: VenuePayload): Promise<void> {
    const venue = this.venue();
    if (!venue) return;
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.update(venue._id, payload);
      this.store.upsert(res.data);
      await this.router.navigate(['/admin/lugares']);
    } catch (error) {
      const failure = apiError(error);
      this.error.set(failure.message);
      this.serverErrors.set(fieldErrors(failure));
    } finally {
      this.submitting.set(false);
    }
  }
}
