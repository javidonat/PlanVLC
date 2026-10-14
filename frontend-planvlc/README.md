# PlanVLC · Frontend

Aplicación Angular 20 con catálogo público y panel de administración de eventos. La estructura sigue el patrón del frontend de referencia (`core`, `features`, `layouts`, `shared`) y utiliza exclusivamente la API que existe en `backend-planvlc`.

## Alcance y contrato de la API

El backend actual solo ofrece la entidad `eventos`. No existen endpoints para `users`, `hosts`, `categories`, `locations`, `experiences` ni `departures`. Las categorías de PlanVLC son un enum dentro de `Evento`, no una colección CRUD. Por eso el panel administra eventos y no muestra pantallas que no puedan funcionar.

| Vista / acción | Ruta de Angular | Petición |
|---|---|---|
| Catálogo público | `/` | `GET /api/eventos/activos` (muestra publicados) |
| Detalle público | `/eventos/:slug` | `GET /api/eventos/slug/:slug` |
| Listado del panel | `/admin/eventos` | `GET /api/eventos` |
| Crear | `/admin/eventos/nuevo` | `POST /api/eventos` |
| Editar | `/admin/eventos/:id/editar` | `GET /api/eventos` y `PATCH /api/eventos/:id` |
| Activar / desactivar | listado del panel | `PATCH /api/eventos/:id/active`, `{ "isActive": boolean }` |
| Eliminar | listado del panel | `PATCH /api/eventos/:id/softdelete` |

El listado general incluye eventos activos, desactivados y eliminados. Un evento eliminado no puede recuperarse desde la API. El backend tampoco permite editar un evento desactivado: hay que activarlo primero. La edición localiza el evento por `_id` en el listado general, porque `GET /api/eventos/:id` solo devuelve eventos activos. El slug se reserva para la URL pública y puede cambiar al editar el nombre.

La API usa `isActive` (camelCase), `_id` de MongoDB y respuestas `{ ok, datos, mensaje? }`. Los errores de validación llegan como `{ mensaje, errores: [{ campo, mensaje }] }` y se muestran junto a los campos del formulario. No hay autenticación en el backend; los interceptores dejan un punto de integración para una fase posterior.

## Tecnología y estructura

- Angular standalone, rutas lazy, TypeScript, Signals y formularios reactivos.
- `ApiService` central con URL y timeout configurables; todas las llamadas pasan por él.
- Interceptores de petición, carga y error; SweetAlert2 para errores globales, `ngx-spinner` para mutaciones, `ngx-skeleton-loader` para lecturas, Lucide para iconos y TailwindCSS para el panel.

```text
src/
├── environments/       URL y timeout de la API
└── app/
    ├── core/
    │   ├── interceptors/
    │   ├── models/
    │   ├── services/
    │   └── stores/
    ├── features/eventos/
    │   ├── components/    tarjetas y filtros públicos
    │   ├── pages/         catálogo, detalle, listado admin y editor
    │   ├── utils/
    │   └── eventos.routes.ts
    ├── layouts/
    └── shared/components/
```

## Ejecutar

Requiere Node.js compatible con Angular 20, MongoDB y el backend de este repositorio en `http://localhost:3000`.

```bash
# Terminal 1: desde backend-planvlc (configurar .env antes)
npm install
npm run dev

# Terminal 2: desde frontend-planvlc
npm install
npm start
```

Abrir `http://localhost:4200`. Se puede comprobar el build con `npm run build`. Si el backend cambia de dirección o puerto, ajustar `src/environments/environment.ts` y `environment.development.ts`.
