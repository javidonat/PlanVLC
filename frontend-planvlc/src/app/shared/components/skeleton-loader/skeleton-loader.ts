import { Component } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-skeleton-loader',
  imports: [NgxSkeletonLoaderModule],
  template: `<div class="space-y-3" aria-label="Cargando eventos">@for (item of [1,2,3,4]; track item) {<div class="rounded-2xl border border-slate-200 bg-white p-5"><ngx-skeleton-loader [theme]="{ height: '24px', 'border-radius': '8px' }" /></div>}</div>`,
})
export class SkeletonLoader {}
