import { Component, computed, input } from '@angular/core';
import { AuthUser } from '../../../../core/models/auth.model';
import { Profile } from '../../../../core/models/profile.model';

// Ficha de solo lectura con los datos del usuario y de su perfil
@Component({
  selector: 'app-profile-card',
  templateUrl: './profile-card.html',
})
export class ProfileCard {
  user = input.required<AuthUser>();
  profile = input<Profile | null>(null);
  initials = input('');

  readonly fullName = computed(() => {
    const profile = this.profile();
    return [profile?.firstName, profile?.lastName].filter(Boolean).join(' ');
  });
}
