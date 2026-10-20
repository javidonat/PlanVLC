import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { VenuePayload } from '../../../../core/models/venue.model';
import { VenuesService } from '../../../../core/services/venues.service';
import { VenuesStore } from '../../../../core/stores/venues.store';
import { apiError, fieldErrors } from '../../../../core/interceptors/error.interceptor';
import { VenueForm } from '../../components/venue-form/venue-form';

@Component({
  selector: 'app-venue-create',
  imports: [RouterLink, VenueForm],
  templateUrl: './venue-create.html',
})
export class VenueCreate {
  private readonly service = inject(VenuesService);
  private readonly store = inject(VenuesStore);
  readonly router = inject(Router);

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly serverErrors = signal<Record<string, string>>({});

  async onSubmit(payload: VenuePayload): Promise<void> {
    try {
      this.submitting.set(true);
      this.error.set(null);
      this.serverErrors.set({});
      const res = await this.service.create(payload);
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
