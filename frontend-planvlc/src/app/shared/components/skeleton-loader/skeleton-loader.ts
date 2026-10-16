import { Component, computed, input } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

// Skeleton reutilizable en formato listado: se usa en el listado de planes y en los formularios
@Component({
  selector: 'app-skeleton-loader',
  imports: [NgxSkeletonLoaderModule],
  template: `
    <div class="space-y-3" role="status" [attr.aria-label]="label()">
      @for (item of items(); track $index) {
        <div class="rounded-2xl border border-slate-200 bg-white px-5 pb-3 pt-5">
          <ngx-skeleton-loader [theme]="{ height: '18px', width: '45%', 'border-radius': '8px', 'margin-bottom': '10px' }" />
          <ngx-skeleton-loader [theme]="{ height: '12px', width: '70%', 'border-radius': '8px' }" />
        </div>
      }
    </div>
  `,
})
export class SkeletonLoader {
  count = input(4);
  label = input('Cargando…');
  readonly items = computed(() => Array.from({ length: this.count() }));
}
