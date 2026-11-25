import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import { AddCartItemPayload, Cart, UpdateCartItemPayload } from '../models/cart.model';

// Solo habla con la API del carrito (/api/cart). Siempre el carrito del usuario de la sesión
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly path = 'cart';

  async get(): Promise<ApiResponse<Cart>> {
    return this.api.get<ApiResponse<Cart>>(this.path);
  }

  // Si esa fecha ya está en el carrito, el backend suma la cantidad (no la repite)
  async addItem(payload: AddCartItemPayload): Promise<ApiResponse<Cart>> {
    return this.api.post<ApiResponse<Cart>>(`${this.path}/items`, payload);
  }

  async updateItem(id: string, payload: UpdateCartItemPayload): Promise<ApiResponse<Cart>> {
    return this.api.put<ApiResponse<Cart>>(`${this.path}/items/${id}`, payload);
  }

  async removeItem(id: string): Promise<ApiResponse<Cart>> {
    return this.api.delete<ApiResponse<Cart>>(`${this.path}/items/${id}`);
  }

  async clear(): Promise<ApiResponse<Cart>> {
    return this.api.delete<ApiResponse<Cart>>(`${this.path}/clear`);
  }
}
