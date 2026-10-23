import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideMapPin } from '@lucide/angular';

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, LucideMapPin],
  templateUrl: './navbar.html',
})
export class Navbar {}
