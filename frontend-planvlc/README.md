# PlanVLC · Frontend

Panel de administración de planes de ocio en Valencia (Angular 20). La estructura sigue el patrón del frontend de referencia (`core`, `features`, `layouts`, `shared`) y utiliza solo la API que existe hoy en `backend-planvlc`.

## Modelo: planes y sesiones

- **Plan** (`plans`): la ficha general ("Tardeo Ruzafa", "Motos de agua Malvarrosa"). No tiene fecha ni precio.
- **Session** (`sessions`): cada fecha concreta de un plan, con precio, aforo y stock. `planId` es obligatorio: una sesión no existe sin su plan. Un plan puede tener muchas sesiones.

El plan guarda dos datos derivados de sus sesiones que calcula el servidor: `priceFrom` (precio mínimo) y `nextSessionAt` (próxima sesión). El listado los muestra, pero el formulario del plan no los edita: fecha y precio pertenecen a la sesión.

Las relaciones del plan (`categoryIds`, `venueId`, `organizerId`, `coverImageId`) llegan pobladas (`{ _id, name, ... }`) en los GET y se envían como ids en POST/PATCH. Por eso los modelos las tipan como `string | Ref` y `refId()` obtiene siempre el id.

## Alcance y contrato de la API

El backend solo expone `/api/plans`. `sessions`, `categories`, `venues`, `organizers` e `images` tienen modelo y datos de ejemplo, pero todavía no tienen endpoints. Mientras no existan, las opciones del formulario (categorías, lugares, organizadores y portadas) se obtienen de las relaciones pobladas de los planes ya existentes.

| Vista / acción | Ruta de Angular | Petición |
|---|---|---|
| Listado | `/admin/planes` | `GET /api/plans` (activos, desactivados y eliminados) |
| Crear | `/admin/planes/nuevo` | `POST /api/plans` |
| Editar | `/admin/planes/:id/editar` | `GET /api/plans/:id` y `PATCH /api/plans/:id` |
| Activar / desactivar | listado | `PATCH /api/plans/:id/active`, `{ "isActive": boolean }` |
| Eliminar | listado | `PATCH /api/plans/:id/softdelete` |

- La edición usa el `_id` en la URL: el slug cambia si se edita el título.
- `GET /api/plans/:id` y `PATCH /api/plans/:id` solo funcionan con planes activos; por eso el botón de editar solo aparece en planes activos.
- Un plan eliminado no se puede recuperar desde la API.
- Respuestas: `{ ok, total?, message?, data }`. Errores: `{ ok: false, status, message, errors?: [{ field, message }] }`; los 400 se muestran junto a cada campo del formulario.

## Tecnología y estructura

- Angular standalone, rutas lazy, TypeScript, Signals y formularios reactivos.
- `ApiService` central con URL y timeout configurables; los servicios (`PlansService`) solo hablan con la API.
- Stores con señales privadas de solo lectura (`PlansStore`): las páginas llaman al servicio y actualizan el store.
- Componentes reutilizables: `PlanTable` + `PlanRow` (listado), `PlanForm` (crear y editar), `SkeletonLoader`, `EmptyState`, `ErrorState`.
- Interceptores de petición, carga y error; SweetAlert2 para errores y confirmaciones, `ngx-spinner` para mutaciones, `ngx-skeleton-loader` para lecturas, Lucide para iconos y TailwindCSS.

```text
src/
├── environments/        URL y timeout de la API
└── app/
    ├── core/
    │   ├── interceptors/
    │   ├── models/      api, status, plan, session
    │   ├── services/
    │   └── stores/
    ├── features/plans/
    │   ├── components/  plan-table, plan-row, plan-form
    │   ├── pages/       plan-list, plan-create, plan-edit
    │   ├── utils/
    │   └── plans.routes.ts
    ├── layouts/
    └── shared/components/
```

## Ejecutar

Requiere Node.js compatible con Angular 20, MongoDB y el backend de este repositorio en `http://localhost:3000`.

```bash
# Terminal 1: desde backend-planvlc (configurar .env antes)
npm install
npm run seed
npm run dev

# Terminal 2: desde frontend-planvlc
npm install
npm start
```

Abrir `http://localhost:4200`. Se puede comprobar el build con `npm run build`. Si el backend cambia de dirección o puerto, ajustar `src/environments/environment.ts` y `environment.development.ts`.
