import { Injectable, inject } from '@angular/core';
import { ApiService, QueryParams } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { ShopCategory, ShopFilters, ShopOrganizer, ShopPlan, ShopPlansResponse, ShopSession, ShopVenue } from '../models/shop.model';

// Solo habla con la API de la tienda (no guarda estado: eso es cosa de ShopStore)
@Injectable({ providedIn: 'root' })
export class ShopService {
  private readonly api = inject(ApiService);
  private readonly path = 'shop';

  async getCategories(): Promise<ApiListResponse<ShopCategory>> {
    return this.api.get<ApiListResponse<ShopCategory>>(`${this.path}/categories`);
  }

  async getOrganizers(): Promise<ApiListResponse<ShopOrganizer>> {
    return this.api.get<ApiListResponse<ShopOrganizer>>(`${this.path}/organizers`);
  }

  async getVenues(): Promise<ApiListResponse<ShopVenue>> {
    return this.api.get<ApiListResponse<ShopVenue>>(`${this.path}/venues`);
  }

  // Listado con filtros, búsqueda y paginación. signal cancela la petición si llega otra más nueva
  async getPlans(filters: ShopFilters, signal?: AbortSignal): Promise<ShopPlansResponse> {
    return this.api.get<ShopPlansResponse>(`${this.path}/plans`, { params: this.buildParams(filters), signal });
  }

  async getPlanBySlug(slug: string, signal?: AbortSignal): Promise<ApiResponse<ShopPlan>> {
    return this.api.get<ApiResponse<ShopPlan>>(`${this.path}/plans/${encodeURIComponent(slug)}`, { signal });
  }

  async getPlanSessions(slug: string, signal?: AbortSignal): Promise<ApiListResponse<ShopSession>> {
    return this.api.get<ApiListResponse<ShopSession>>(`${this.path}/plans/${encodeURIComponent(slug)}/sessions`, { signal });
  }

  // Filtros → query params del backend. Los vacíos no se envían (ApiService los descarta)
  private buildParams(filters: ShopFilters): QueryParams {
    return {
      category: filters.category,
      organizer: filters.organizer,
      venue: filters.venue,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      search: filters.search.trim(),
      page: filters.page > 1 ? filters.page : null,
    };
  }
}
