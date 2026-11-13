import { Injectable, inject } from '@angular/core';
import { ApiService, QueryParams } from './api.service';
import { ApiListResponse, ApiResponse } from '../models/api.model';
import { DEFAULT_SORT, ShopCategory, ShopFilters, ShopSessionsResponse, ShopOrganizer, ShopPlan, ShopPlansResponse, ShopSession, ShopVenue } from '../models/shop.model';

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

  // Sesiones de un mes para el calendario (sin month, el backend elige el de la primera sesión que viene)
  async getSessions(filters: ShopFilters, month: string | null, signal?: AbortSignal): Promise<ShopSessionsResponse> {
    const { sort, page, ...params } = this.buildParams(filters); // el calendario no se ordena ni se pagina
    return this.api.get<ShopSessionsResponse>(`${this.path}/sessions`, { params: { ...params, month }, signal });
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
      category: filters.category.join(',') || null, // varios slugs separados por comas
      organizer: filters.organizer.join(',') || null,
      venue: filters.venue.join(',') || null,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      search: filters.search.trim(),
      sort: filters.sort !== DEFAULT_SORT ? filters.sort : null,
      page: filters.page > 1 ? filters.page : null,
    };
  }
}
