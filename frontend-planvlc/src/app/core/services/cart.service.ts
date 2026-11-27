import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';
import { ApiResponse } from '../models/api.model';
import { AddCartItemPayload, Cart, UpdateCartItemPayload } from '../models/cart.model';

// Solo habla con la API del carrito (/api/cart). Siempre el carrito del usuario de la sesión.
// - Añadir lleva Idempotency-Key: si se repite la petición con la misma clave, el backend no suma dos veces
// - Editar, quitar y vaciar llevan If-Match con la versión del carrito que se está viendo: si ha cambiado
//   en otra pestaña o dispositivo, el backend responde 409 en vez de pisar esos cambios
@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiService);
  private readonly path = 'cart';

  async get(): Promise<ApiResponse<Cart>> {
    return this.api.get<ApiResponse<Cart>>(this.path);
  }

  // Si esa fecha ya está en el carrito, el backend suma la cantidad (no la repite)
  async addItem(payload: AddCartItemPayload, idempotencyKey: string): Promise<ApiResponse<Cart>> {
    return this.api.post<ApiResponse<Cart>>(`${this.path}/items`, payload, { headers: { 'Idempotency-Key': idempotencyKey } });
  }

  async updateItem(id: string, payload: UpdateCartItemPayload, version: number): Promise<ApiResponse<Cart>> {
    return this.api.put<ApiResponse<Cart>>(`${this.path}/items/${id}`, payload, { headers: this.ifMatch(version) });
  }

  async removeItem(id: string, version: number): Promise<ApiResponse<Cart>> {
    return this.api.delete<ApiResponse<Cart>>(`${this.path}/items/${id}`, { headers: this.ifMatch(version) });
  }

  async clear(version: number): Promise<ApiResponse<Cart>> {
    return this.api.delete<ApiResponse<Cart>>(`${this.path}/clear`, { headers: this.ifMatch(version) });
  }

  private ifMatch(version: number): Record<string, string> {
    return { 'If-Match': String(version) };
  }
}
