# PlanVLC · Backend

API REST de PlanVLC, una web de planes de ocio y actividades en Valencia (discotecas, tardeos, conciertos, deporte, actividades...). Construida con **Node.js + Express + MongoDB (Mongoose)**.

## Requisitos

- Node.js 18 o superior
- MongoDB en local (`mongodb://localhost:27017`) o una URI de MongoDB Atlas

## Puesta en marcha

```bash
npm install
cp .env.example .env     # y ajusta los valores si hace falta
npm run seed             # carga datos de ejemplo en las 8 colecciones
npm run dev              # desarrollo, con recarga automática (nodemon)
# o bien
npm start                # producción
```

El servidor arranca en `http://localhost:3000` (o el `PORT` que pongas en `.env`).

### Variables de entorno (`.env`)

| Variable | Descripción | Valor por defecto en `.env.example` |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `MONGODB_URI` | Cadena de conexión a MongoDB. `planvlc` es el nombre de la base de datos | `mongodb://localhost:27017/planvlc` |
| `NODE_ENV` | (Opcional) Con `production`, Morgan usa el formato `combined` en vez de `dev` | *(no definida)* |

### Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca el servidor con Node |
| `npm run dev` | Arranca con nodemon |
| `npm run seed` | **Borra** el contenido de las 8 colecciones (borrado real) y la antigua colección `eventos`, e inserta los datos de ejemplo |

## Arquitectura

Cada petición recorre las capas en este orden, y cada capa solo conoce a la siguiente:

```
routes → ctrls → services → repos → models → MongoDB
```

```
src/
├── server.js        Carga .env, conecta a MongoDB y arranca Express
├── app.js           Configura Express: helmet, morgan, cors, json, rutas, 404 y errores
├── seed.js          Datos iniciales de las 8 colecciones
├── config/db.js     Conexión a MongoDB
├── routes/          Define las URLs, valida la petición (Zod) y la manda al controlador
├── schemas/         Esquemas de validación de Zod (params y body)
├── ctrls/           Recibe req/res, llama al servicio, responde JSON
├── services/        Lógica de negocio (slugs, reglas del soft delete, comprobar relaciones)
│   └── utils/       AppError.js (error con código HTTP) y slug.util.js (generateSlug)
├── repos/           Único punto de acceso a MongoDB
├── models/          Esquemas de Mongoose (uno por colección)
└── middleware/
    ├── validate.js       Valida req.params / req.body con un esquema de Zod (400 si falla)
    └── errorHandler.js   Convierte cualquier error en JSON (se registra al final de app.js)
```

La colección `plans` tiene la API completa. `categories`, `venues`, `organizers` e `images` tienen una API de solo lectura (`GET /active`) para rellenar los desplegables del formulario de planes. `sessions`, `roles` y `users` tienen modelo y datos de ejemplo, y su API se añadirá más adelante.

## Base de datos

MongoDB no necesita crear tablas: la base de datos y las colecciones se crean solas al insertar el primer documento (`npm run seed`). La estructura se define con los esquemas de Mongoose de `src/models/`.

### Colecciones

| Colección | Modelo | Qué representa |
|---|---|---|
| `plans` | `Plan` | La ficha general del plan (ej. "Tardeo Ruzafa") |
| `sessions` | `Session` | Cada fecha concreta de un plan, con precio, aforo y stock |
| `organizers` | `Organizer` | Quién organiza (discoteca, club, promotora, empresa) |
| `categories` | `Category` | Tipo de plan (Tardeo, Concierto, Deporte...) |
| `venues` | `Venue` | Sitios físicos (sala, estadio, recinto) |
| `images` | `Image` | Imágenes de cualquier entidad (portadas, galerías, logos, avatares) |
| `roles` | `Role` | admin, editor, organizer, user |
| `users` | `User` | Usuarios del sistema |

### Relaciones

Se guardan como **referencias** (`ObjectId`), el equivalente a una clave foránea de SQL. MongoDB no las valida, así que el servicio de planes comprueba que existan antes de guardar.

```
sessions.planId          → plans
plans.categoryIds[]      → categories
plans.organizerId        → organizers
plans.venueId            → venues
organizers.userIds[]     → users
users.roleId             → roles
images.entityId          → plans | venues | categories | organizers | users (según images.entityType)
```

**Imágenes.** La relación la guarda la imagen, no la entidad: `entityType` dice a qué colección pertenece y `entityId` a qué documento. `type` indica qué es (`cover`, `gallery`, `logo`, `avatar`) y `position` el orden dentro de la galería. Cada entidad solo admite sus tipos:

| `entityType` | Tipos permitidos |
|---|---|
| `plan` | `cover` (1), `gallery` (máx. 10) |
| `venue` | `cover`, `gallery` |
| `category` | `cover` |
| `organizer` | `logo` |
| `user` | `avatar` |

Los planes devuelven sus imágenes con los virtuals `coverImage` y `galleryImages` (virtual populate sobre `images`).

Se **embebe** (dentro del propio documento) solo lo pequeño que no se reutiliza: `organizers.contact` y `venues.location` (coordenadas GeoJSON).

### Campos comunes (panel admin)

| Campo | Dónde | Notas |
|---|---|---|
| `isActive` | todas | Por defecto `true`. Se cambia desde el listado |
| `deletedAt` | todas | Por defecto `null`. Se rellena con la fecha al hacer soft delete |
| `status` | `plans` y `sessions` | `draft`, `published`, `cancelled`, `finished`. Por defecto `published`. Se cambia desde Edit |
| `status` | `categories` | `draft`, `published`, `archived`. Por defecto `published` |
| `status` | `venues` | `open`, `renovation` (en obras), `temporarily_closed`, `permanently_closed`. Por defecto `open` |
| `status` | `organizers` | `pending`, `verified`, `suspended`. Por defecto `pending` |
| `status` | `users` | `active`, `suspended`, `banned`. Por defecto `active` |

`status` describe la situación real del documento; `isActive` sigue siendo el interruptor del panel y `deletedAt` el soft delete. `roles`, `images` y `sessions` no necesitan más estados (las sesiones usan los mismos que los planes). Todos los estados están en `models/constants.js`.
| `createdAt`, `updatedAt` | todas | `timestamps: true` |

### Modelo `Plan`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `title` | String | Sí | Máx. 150 caracteres |
| `slug` | String | Automático | Único. Se genera a partir del `title` al crear (ej. `tardeo-ruzafa`). Si ya existe (incluso en un plan desactivado o eliminado) se añade un sufijo (`tardeo-ruzafa-1`). Al editar el título se regenera, siempre único; si no cambia, se mantiene |
| `shortDescription` | String | No | Máx. 200 caracteres |
| `description` | String | Sí | |
| `categoryIds` | [ObjectId → Category] | Sí | Al menos 1, máximo 5 |
| `organizerId` | ObjectId → Organizer | No | `null` = sin organizador |
| `venueId` | ObjectId → Venue | Sí | |
| `coverImage` | Virtual → Image | No | Imagen con `entityType: "plan"`, `type: "cover"`. Se envía como `coverImageUrl` (URL o `null`) |
| `galleryImages` | Virtual → [Image] | No | Imágenes con `type: "gallery"`, por `position`. Se envía como `galleryImageUrls` (máx. 10) |
| `minAge` | Number | No | Por defecto `18` |
| `tags` | [String] | No | Máx. 10 |
| `status` | String | No | Por defecto `published` |
| `priceFrom` | Number | Automático | Precio mínimo de sus sesiones (`0` = gratis). Dato derivado, para no consultar `sessions` en el listado |
| `nextSessionAt` | Date | Automático | Fecha de la próxima sesión. Dato derivado |
| `isActive`, `deletedAt` | | Automático | Ver campos comunes |

`slug`, `priceFrom`, `nextSessionAt`, `isActive` y `deletedAt` los gestiona el servidor: si se envían en el body de un POST o PATCH, se ignoran.

> Un plan puede tener muchas sesiones. Cuando exista la API de `sessions`, habrá que recalcular `priceFrom` y `nextSessionAt` al crear o modificar una sesión.

### Modelo `Session`

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `planId` | ObjectId → Plan | Sí | |
| `startDateTime` | Date | Sí | Siempre tipo `Date`, nunca texto |
| `endDateTime` | Date | No | Debe ser posterior al inicio |
| `price` | Number | No | Por defecto `0` (gratis) |
| `currency` | String | No | Por defecto `EUR` |
| `capacity` | Number | No | Aforo total. `null` = sin límite |
| `stock` | Number | No | Plazas disponibles. `null` = sin límite. No puede superar `capacity` |

### Datos de ejemplo (seed)

`npm run seed` crea 10 categorías, 5 lugares, 5 organizadores (verificados), 18 imágenes de Unsplash (portada y galería de cada plan), 4 roles, 1 usuario admin (`admin@planvlc.com` / `Admin1234`, **cámbiala**), 5 planes y 6 sesiones. "Tardeo Ruzafa" tiene 2 sesiones para mostrar un plan recurrente.

## Endpoints (`plans`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/health` | Comprueba que el servidor está vivo |
| GET | `/api/plans` | Lista todos los planes (activos, desactivados y eliminados), por `nextSessionAt` ascendente |
| GET | `/api/plans/active` | Lista solo los planes activos |
| GET | `/api/plans/deleted` | Lista solo los planes eliminados (soft delete) |
| GET | `/api/plans/slug/:slug` | Devuelve un plan activo por su slug |
| GET | `/api/plans/:id` | Devuelve un plan activo por su id de MongoDB |
| POST | `/api/plans` | Crea un plan |
| PATCH | `/api/plans/:id` | Modifica solo los campos enviados (incluido `status`) |
| PATCH | `/api/plans/:id/active` | Activa o desactiva un plan. Body: `{ "isActive": true }`. No funciona con planes eliminados (`409`) |
| PATCH | `/api/plans/:id/softdelete` | Borrado lógico: `isActive = false` y `deletedAt = ahora` |

Todas las respuestas, incluidas las de `/active` y `/softdelete`, traen las relaciones ya cargadas (`populate`): `categoryIds` trae `{ _id, name, slug }`, `venueId` trae `{ _id, name, city, neighborhood }`, `organizerId` trae `{ _id, name, slug }`, `coverImage` trae `{ _id, url, alt }` (o `null`) y `galleryImages` trae `[{ _id, url, alt, position }]`. Al enviar datos (POST/PATCH) las relaciones se envían como ids y las imágenes como URLs (`coverImageUrl`, `galleryImageUrls`).

La API **no tiene autenticación**: cualquiera que conozca la URL puede crear, modificar o eliminar planes. Es aceptable para un proyecto de clase en local, pero habría que añadir login antes de publicarla. Las peticiones de ejemplo están en [`postman.md`](./postman.md).

## Endpoints de solo lectura (opciones del formulario de planes)

Devuelven solo los documentos activos y no eliminados, con los mismos campos que el `populate` de los planes.

| Método | Ruta | Campos de cada elemento |
|---|---|---|
| GET | `/api/categories/active` | `_id`, `name`, `slug` |
| GET | `/api/venues/active` | `_id`, `name`, `city`, `neighborhood` |
| GET | `/api/organizers/active` | `_id`, `name`, `slug` |
| GET | `/api/images/active` | `_id`, `url`, `alt` |

Formato: `{ "ok": true, "total": 10, "data": [ ... ] }`.

### Id o slug

Hay dos rutas distintas: `GET /api/plans/:id` (el `:id` debe ser un ObjectId, 24 caracteres hexadecimales; si no, `400`) y `GET /api/plans/slug/:slug` (si no existe, `404`).

### Soft delete

La API **no borra documentos**. `PATCH /:id/softdelete` marca el plan como inactivo (`isActive: false`) y guarda la fecha en `deletedAt`. El documento sigue en la base de datos, pero desaparece de las búsquedas por id o slug (responden `404`). Tampoco se puede modificar con `PATCH /:id`. Si se repite el borrado responde `404` y `deletedAt` conserva la fecha original.

**Un plan eliminado no se puede recuperar por la API**: `PATCH /:id/active` (con `true` o `false`) responde `409` si el plan tiene `deletedAt`. Un plan desactivado (sin `deletedAt`) sí se puede volver a activar o eliminar. Su slug sigue reservado: ningún plan nuevo puede usarlo.

### Modificar datos

`PATCH /:id` cambia solo los campos que se envían y deja el resto como estaba. Debe llevar al menos un campo. En POST y PATCH solo se aceptan `title`, `shortDescription`, `description`, `categoryIds`, `organizerId`, `venueId`, `coverImageUrl`, `galleryImageUrls`, `minAge`, `tags` y `status`; cualquier otro se ignora.

Las imágenes se sincronizan con la lista recibida: las URLs que ya tenía el plan se conservan (y se reordenan), las nuevas se crean y las que faltan se eliminan con soft delete. Si no se envían `coverImageUrl` / `galleryImageUrls`, las imágenes no se tocan; `null` quita la portada y `[]` vacía la galería.

### Validaciones

Se validan en tres niveles:

1. **Rutas (Zod).** `middleware/validate.js` comprueba `params` y `body` con los esquemas de `schemas/plans.schema.js` antes de llegar al controlador: campos obligatorios, ids con formato de ObjectId, URLs de imagen (`http`/`https`), longitudes, `minAge` entero ≥ 0, `status` válido. Los campos que no están en el esquema se descartan y los textos se recortan (`trim`).
2. **Servicio.** Comprueba que los ids de `categoryIds`, `venueId` y `organizerId` **existen** y no están eliminados (MongoDB no lo hace solo). Si no, `400`.
3. **Modelo (Mongoose).** Última barrera: obligatorios, enums y números no negativos.

Si algo falla, la API responde `400` con un `message` que junta los problemas y un array `errors` con `{ field, message }` por cada uno.

### Formato de las respuestas

Éxito, lista (`200`):

```json
{ "ok": true, "total": 5, "data": [ { "_id": "...", "title": "...", "slug": "..." } ] }
```

Éxito, un plan (`200`; `201` al crear):

```json
{ "ok": true, "data": { "_id": "...", "title": "...", "slug": "..." } }
```

POST y los PATCH añaden además un campo `message` (por ejemplo `"Plan creado correctamente"`). `softdelete` devuelve en `data` el plan ya desactivado.

Error:

```json
{ "ok": false, "status": 404, "message": "Plan no encontrado" }
```

Los errores de validación añaden `errors`:

```json
{
  "ok": false,
  "status": 400,
  "message": "La edad mínima no puede ser negativa",
  "errors": [{ "field": "minAge", "message": "La edad mínima no puede ser negativa" }]
}
```

Los errores se lanzan con `new AppError(message, statusCode)` (en `services/utils/AppError.js`); el middleware `errorHandler` los convierte en esta respuesta. También traduce errores de Mongoose, JSON mal formado y claves duplicadas.

| Código | Cuándo |
|---|---|
| 400 | Falla la validación (`:id` inválido, campos obligatorios, estado no válido, relación que no existe, `isActive` no booleano...), el body no es un JSON válido o un PATCH va vacío |
| 404 | El plan no existe, está inactivo o eliminado (GET por id/slug o PATCH), o la ruta no existe |
| 409 | Se intenta activar/desactivar un plan eliminado, o hay un conflicto con un valor único (slug) que no se ha podido resolver |
| 500 | Error interno del servidor (en producción no se muestra el mensaje interno) |

CORS está abierto (`cors()` sin restricciones), por lo que el frontend Angular puede consumir la API desde `http://localhost:4200`.
