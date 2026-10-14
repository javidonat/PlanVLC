import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({ providedIn: 'root' })
export class AlertService {
  error(message: string): void {
    void Swal.fire({ icon: 'error', title: 'No se pudo completar la operación', text: message, confirmButtonColor: '#1d4ed8' });
  }

  async confirmDelete(nombre: string): Promise<boolean> {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'Eliminar evento',
      text: `Se eliminará «${nombre}» y no se podrá recuperar desde el panel.`,
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });
    return result.isConfirmed;
  }
}
