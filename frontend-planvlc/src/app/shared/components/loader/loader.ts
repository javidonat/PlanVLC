import { Component } from '@angular/core';
import { NgxSpinnerComponent } from 'ngx-spinner';

@Component({
  selector: 'app-loader',
  imports: [NgxSpinnerComponent],
  template: `<ngx-spinner name="global-loader" type="ball-clip-rotate" [fullScreen]="true" [zIndex]="2000" [disableAnimation]="true" bdColor="rgba(15,23,42,.25)" color="#2563eb"><p class="mt-4 text-white">Cargando…</p></ngx-spinner>`,
})
export class Loader {}