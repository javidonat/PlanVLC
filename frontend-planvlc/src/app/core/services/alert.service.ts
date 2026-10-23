import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  error(message: string): void {
    void Swal.fire({ icon: 'error', title: 'No se pudo completar la operación', text: message, confirmButtonColor: '#6a3de8' });
  }

  // Confirmación genérica: sirve para cualquier entidad (planes, sesiones...)
  async confirm(title: string, text: string, confirmText = 'Confirmar'): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    return result.isConfirmed;
  }
}
