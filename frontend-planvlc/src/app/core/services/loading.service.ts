import { Injectable, computed, inject, signal } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly spinner = inject(NgxSpinnerService);
  private readonly pending = signal(0);
  readonly loading = computed(() => this.pending() > 0);

  show(): void {
    this.pending.update(n => n + 1);
    void this.spinner.show('global-loader');
  }

  hide(): void {
    this.pending.update(n => Math.max(0, n - 1));
    if (!this.loading()) void this.spinner.hide('global-loader');
  }
}
