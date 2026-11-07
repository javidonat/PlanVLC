import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideTicket } from '@lucide/angular';
import { ShopCategory, ShopOrganizer, ShopVenue } from '../../../../core/models/shop.model';
import { ShopService } from '../../../../core/services/shop.service';
import { ShopStore } from '../../../../core/stores/shop.store';
import { apiError } from '../../../../core/interceptors/error.interceptor';
import { Carousel } from '../../../../shared/components/carousel/carousel';
import { SkeletonLoader } from '../../../../shared/components/skeleton-loader/skeleton-loader';
import { ErrorState } from '../../../../shared/components/error-state/error-state';
import { CategoryCard } from '../../components/category-card/category-card';
import { OrganizerCard } from '../../components/organizer-card/organizer-card';
import { VenueCard } from '../../components/venue-card/venue-card';

// Home: carruseles de categorías, organizadores y lugares.
// Al pulsar una card se va al shop ya filtrado (deep-linking: /planes?category=<id>)
@Component({
  selector: 'app-home-page',
  imports: [RouterLink, LucideTicket, Carousel, SkeletonLoader, ErrorState, CategoryCard, OrganizerCard, VenueCard],
  templateUrl: './home-page.html',
})
export class HomePage implements OnInit {
  readonly store = inject(ShopStore);
  private readonly service = inject(ShopService);
  private readonly router = inject(Router);

  ngOnInit(): void {
    // El catálogo se comparte con los filtros del shop: si ya se cargó, no se repite la petición
    if (!this.store.catalogLoaded()) void this.loadCatalog();
  }

  async loadCatalog(): Promise<void> {
    try {
      this.store.setCatalogLoading(true);
      this.store.setCatalogError(null);
      const [categories, organizers, venues] = await Promise.all([
        this.service.getCategories(),
        this.service.getOrganizers(),
        this.service.getVenues(),
      ]);
      this.store.setCatalog(categories.data, organizers.data, venues.data);
    } catch (error) {
      this.store.setCatalogError(apiError(error).message);
    } finally {
      this.store.setCatalogLoading(false);
    }
  }

  onCategory(category: ShopCategory): void {
    void this.router.navigate(['/planes'], { queryParams: { category: category.slug } });
  }

  onOrganizer(organizer: ShopOrganizer): void {
    void this.router.navigate(['/planes'], { queryParams: { organizer: organizer.slug } });
  }

  onVenue(venue: ShopVenue): void {
    void this.router.navigate(['/planes'], { queryParams: { venue: venue.slug } });
  }
}
