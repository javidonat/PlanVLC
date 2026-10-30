# PlanVLC · Backend

API REST de PlanVLC, una web de planes de ocio y actividades en Valencia (discotecas, tardeos, conciertos, deporte, actividades...). Construida con **Node.js + Express + MongoDB (Mongoose)**.

## Requisitos

- Node.js 18 o superior
- MongoDB en local (`mongodb://localhost:27017`) o una URI de MongoDB Atlas

## Puesta en marcha

```bash
npm install
cp .env.example .env     # y ajusta los valores si hace falta
npm run seed             # carga datos de ejemplo en las 9 colecciones
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
| `SECRET` | **Obligatoria.** Clave para firmar y verificar los JWT. Larga y aleatoria; nunca se sube a git | *(vacía)* |
| `JWT_EXPIRES_IN` | Caducidad de los tokens (`1h`, `7d`...) | `1h` |
| `NODE_ENV` | (Opcional) Con `production`, Morgan usa el formato `combined` en vez de `dev` | *(no definida)* |

### Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Arranca el servidor con Node |
| `npm run dev` | Arranca con nodemon |
| `npm run seed` | **Borra** el contenido de las 9 colecciones y de la lista negra de tokens (borrado real) y la antigua colección `eventos`, e inserta los datos de ejemplo |

## Arquitectura

Cada petición recorre las capas en este orden, y cada capa solo conoce a la siguiente:

```
routes → ctrls → services → repos → models → MongoDB
```

```
src/
├── server.js        Carga .env, conecta a MongoDB y arranca Express
├── app.js           Configura Express: helmet, morgan, cors, json, rutas, 404 y errores
├── seed.js          Datos iniciales de las 9 colecciones
├── config/db.js     Conexión a MongoDB
├── routes/          Define las URLs, valida la petición (Zod) y la manda al controlador
├── schemas/         Esquemas de validación de Zod (params y body)
├── ctrls/           Recibe req/res, llama al servicio, responde JSON
├── services/        Lógica de negocio (slugs, reglas del soft delete, comprobar relaciones)
│   └── utils/       AppError.js (error con código HTTP), slug.util.js (generateSlug),
│                    jwt.js (createToken / verifyToken) y password.js (hash con Argon2)
├── repos/           Único punto de acceso a MongoDB
├── models/          Esquemas de Mongoose (uno por colección)
└── middleware/
    ├── validate.js       Valida req.params / req.body con un esquema de Zod (400 si falla)
    ├── authentication.js Comprueba el JWT y deja el usuario en req.user (401 si falla)
    ├── authorization.js  isAdmin, authorizeRoles(...) y isOwnerOrAdmin (403 si no tiene permiso)
    └── errorHandler.js   Convierte cualquier error en JSON (se registra al final de app.js)
```

Todas las colecciones (`plans`, `sessions`, `categories`, `venues`, `organizers`, `roles`, `users` e `images`) tienen la API completa.

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
| `profiles` | `Profile` | Datos extendidos del usuario (1 a 1) |
| `blacklistedtokens` | `BlacklistedToken` | Tokens cerrados con logout (lista negra) |

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

Los planes devuelven sus imágenes con los virtuals `coverImage` y `galleryImages` (virtual populate sobre `images`). Los virtuals solo traen las imágenes activas y no eliminadas.

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

> Un plan puede tener muchas sesiones. Cada vez que se crea, modifica, activa/desactiva o elimina una sesión, el servidor recalcula `priceFrom` y `nextSessionAt` del plan con sus próximas sesiones (activas, no eliminadas, no canceladas y que aún no han empezado). Si no le queda ninguna, `nextSessionAt` pasa a `null`.

### Modelo `Session`

`plans` es el producto (la ficha genérica) y `sessions` son sus **variantes**: lo que realmente se compra, con su propio SKU, precio, aforo y stock. En una tienda la variante sería la talla o el color; aquí es la fecha y la hora.

| Campo | Tipo | Obligatorio | Notas |
|---|---|---|---|
| `planId` | ObjectId → Plan | Sí | |
| `sku` | String | Sí | Único, en mayúsculas. Slug del plan + fecha y hora de inicio (hora de Valencia), ej. `TARDEO-RUZAFA-20251012-1700`. Se genera con `generateSku()` de `services/utils/slug.util.js` |
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
| PATCH | `/api/plans/:id/softdelete` | Borrado lógico: `isActive = false` y `deletedAt = ahora`. Si tiene alguna sesión no eliminada → `409` |

Todas las respuestas, incluidas las de `/active` y `/softdelete`, traen las relaciones ya cargadas (`populate`): `categoryIds` trae `{ _id, name, slug }`, `venueId` trae `{ _id, name, city, neighborhood }`, `organizerId` trae `{ _id, name, slug }`, `coverImage` trae `{ _id, url, alt }` (o `null`) y `galleryImages` trae `[{ _id, url, alt, position }]`. Al enviar datos (POST/PATCH) las relaciones se envían como ids y las imágenes como URLs (`coverImageUrl`, `galleryImageUrls`).

Las rutas de `plans` aún **no piden token**: de momento solo están protegidas `users`, `roles` y `profiles` (ver [Autenticación](#autenticación-jwt)). Las peticiones de ejemplo están en [`postman.md`](./postman.md).

## Endpoints (`sessions`)

Funcionan igual que los de planes (mismo formato de respuesta, soft delete y reglas de activar/desactivar). Las respuestas traen el plan poblado en `planId` (`{ _id, title, slug, status, isActive }`).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/sessions` | Todas (activas, desactivadas y eliminadas), por `startDateTime` |
| GET | `/api/sessions/active` | Solo activas |
| GET | `/api/sessions/deleted` | Solo eliminadas |
| GET | `/api/sessions/:id` | Una sesión activa |
| POST | `/api/sessions` | Crea. Obligatorios: `planId` y `startDateTime`. Opcionales: `endDateTime`, `price`, `capacity`, `stock`, `status`. El `sku` se genera solo; si no se envía `stock`, se pone igual que `capacity` |
| PATCH | `/api/sessions/:id` | Modifica los campos enviados. `planId` no se puede cambiar. Si cambia `startDateTime`, cambia el `sku` |
| PATCH | `/api/sessions/:id/active` | Activa o desactiva. Eliminada → `409` |
| PATCH | `/api/sessions/:id/softdelete` | Borrado lógico |

Validaciones (Zod en `schemas/sessions.schema.js` y, en los PATCH, también en el servicio con los datos ya guardados): fechas en ISO, `endDateTime` posterior a `startDateTime`, `price`, `capacity` y `stock` no negativos (aforo y stock enteros, `null` = sin límite) y `stock` ≤ `capacity`. Además, en el servicio: la fecha de inicio no puede estar en el pasado (al crear o al cambiar la fecha) y `capacity` no puede superar el aforo del lugar del plan (si el lugar tiene aforo). No puede haber dos sesiones del mismo plan a la misma hora (mismo SKU → `409`).

## Endpoints (`venues`)

Funcionan igual que los de planes (mismo formato de respuesta, soft delete y reglas de activar/desactivar).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/venues` | Todos (activos, desactivados y eliminados), por nombre |
| GET | `/api/venues/active` | Solo activos y no eliminados (`_id`, `name`, `city`, `neighborhood`) |
| GET | `/api/venues/deleted` | Solo eliminados |
| GET | `/api/venues/:id` | Un lugar activo |
| POST | `/api/venues` | Crea. Obligatorio: `name`. Opcionales: `address`, `neighborhood`, `city`, `province`, `postalCode` (5 números), `capacity`, `latitude` + `longitude`, `status`, `coverImageUrl`, `galleryImageUrls` |
| PATCH | `/api/venues/:id` | Modifica los campos enviados. `latitude: null` y `longitude: null` quitan la ubicación |
| PATCH | `/api/venues/:id/active` | Activa o desactiva. Eliminado → `409` |
| PATCH | `/api/venues/:id/softdelete` | Borrado lógico. Si hay algún plan no eliminado en el lugar → `409` |

Las coordenadas se envían como `latitude` y `longitude` (las dos o ninguna) y se guardan en `location` (GeoJSON, `[longitud, latitud]`). Las fotos se guardan en `images` (`entityType: "venue"`) y las respuestas las traen en `coverImage` y `galleryImages`.

## Endpoints (`organizers`)

Funcionan igual que los de planes (mismo formato de respuesta, soft delete y reglas de activar/desactivar).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/organizers` | Todos (activos, desactivados y eliminados), por nombre |
| GET | `/api/organizers/active` | Solo activos y no eliminados (`_id`, `name`, `slug`) |
| GET | `/api/organizers/deleted` | Solo eliminados |
| GET | `/api/organizers/:id` | Un organizador activo |
| POST | `/api/organizers` | Crea. Obligatorio: `name`. Opcionales: `type`, `description`, `contact` (`{ email, phone, website, instagram }`), `userIds` (usuarios que lo gestionan), `status`, `logoImageUrl`. El `slug` se genera a partir del nombre |
| PATCH | `/api/organizers/:id` | Modifica los campos enviados (`contact` se sustituye entero). Si cambia el nombre, se regenera el `slug` |
| PATCH | `/api/organizers/:id/active` | Activa o desactiva. Eliminado → `409` |
| PATCH | `/api/organizers/:id/softdelete` | Borrado lógico. Si tiene algún plan no eliminado → `409` |

El logo se guarda en `images` (`entityType: "organizer"`, `type: "logo"`) y las respuestas lo traen en `logo`. `userIds` llega poblado (`{ _id, name, email }`); al enviarlo, el servidor comprueba que los usuarios existen.

## Autenticación (JWT)

Solo hay **login**, **logout** y **me**: no existe registro, los usuarios los crea un admin desde `/api/users`.

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/auth/login` | Body: `email`, `password`. Devuelve `{ token, tokenType: "Bearer", expiresIn, user: { _id, name, email, role, avatar } }` (`avatar` es el del perfil) |
| POST | `/api/auth/logout` | Con token. Mete ese token en la lista negra (`blacklistedtokens`) y deja de valer |
| GET | `/api/auth/me` | Con token. Los datos del usuario autenticado: `{ _id, name, email, role, avatar }` (los mismos que el `user` del login) |

Las rutas protegidas necesitan la cabecera `Authorization: Bearer <token>`.

- **Token** (`services/utils/jwt.js`): `createToken` firma con `SECRET` (HS256) el id del usuario (`sub`), `email`, `role` y un id único (`jti`), y caduca según `JWT_EXPIRES_IN`. `verifyToken` comprueba la firma, la caducidad y que lleve `email` y `role`.
- **Contraseñas** (`services/utils/password.js`): hash con Argon2id; nunca se guardan en claro.
- **`authenticate`** (`middleware/authentication.js`): además del token, comprueba en la base de datos que el usuario sigue activo, con `status: "active"`, con su rol activo, y que su email y su rol coinciden con los del token. También rechaza los tokens de la lista negra. Si no → `401 Autenticación requerida`.
- **Logout (lista negra)**: el JWT no se puede borrar, así que el logout lo guarda en la colección `blacklistedtokens` (`token`, `userId`, `expiresAt`) y `authenticate` ya no lo acepta (`401`). Solo deja de valer ese token: si el usuario tiene sesión en otro dispositivo, esa sigue. `expiresAt` es la caducidad del token y tiene un índice TTL, así que MongoDB borra el documento solo cuando el token ya habría caducado.
- **`isAdmin` / `authorizeRoles(...)`** (`middleware/authorization.js`): RBAC por rol. Si el rol no está permitido → `403 No tienes permiso para acceder a este recurso`.
- **`isOwnerOrAdmin(param)`**: ABAC. El usuario solo accede a lo suyo (`req.user.id === :userId`); un admin, a todo.
- Login con email o contraseña incorrectos → `401` (mismo mensaje en los dos casos). Usuario desactivado, suspendido, bloqueado o con el rol desactivado → `403`.

| Rutas | Quién puede |
|---|---|
| `/api/users/*`, `/api/roles/*` | Solo `admin` |
| `/api/profiles/:userId` | El propio usuario o un `admin` |
| Resto | Abiertas (sin cambios por ahora) |

## Endpoints (`profiles`)

Datos extendidos del usuario (`User 1 → 1 Profile`): `firstName`, `lastName`, `phone`, `bio` y `avatar` (URL de la imagen; por defecto un robot de [DiceBear](https://www.dicebear.com/styles/bottts/) distinto para cada usuario). El perfil apunta al usuario (`profiles.userId`), no al revés. Cada usuario tiene su perfil: se crea vacío al crear el usuario (`POST /api/users` y el seed).

**Integridad referencial**: el perfil sigue a su usuario. Al activar o desactivar el usuario (`PATCH /api/users/:id/active`) se activa o desactiva su perfil (`profiles.isActive`), y al eliminarlo (`PATCH /api/users/:id/softdelete`) el perfil también queda eliminado (`isActive: false`, `deletedAt`).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/profiles` | Solo admin. Todos los perfiles (también desactivados y eliminados), con `userId` poblado (`name`, `email`) |
| GET | `/api/profiles/:userId` | El perfil del usuario (vacío si aún no tiene) |
| PATCH | `/api/profiles/:userId` | Modifica los campos enviados (`null` = vaciar; en `avatar`, volver al robot). Si no tenía perfil, se crea |

## Endpoints (`users`)

Funcionan igual que los de planes (mismo formato de respuesta, soft delete y reglas de activar/desactivar). Las respuestas traen el rol poblado en `roleId` (`{ _id, name }`) y **nunca** el `passwordHash`.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/users` | Todos (activos, desactivados y eliminados), por nombre |
| GET | `/api/users/active` | Solo activos y no eliminados (`_id`, `name`, `email`) |
| GET | `/api/users/deleted` | Solo eliminados |
| GET | `/api/users/:id` | Un usuario activo |
| POST | `/api/users` | Crea el usuario y su perfil vacío. Obligatorios: `name`, `email` (único), `password` (8 a 72 caracteres) y `roleId`. Opcionales: `status`, `avatarImageUrl` |
| PATCH | `/api/users/:id` | Modifica los campos enviados. `password` solo si se quiere cambiar |
| PATCH | `/api/users/:id/active` | Activa o desactiva. Eliminado → `409` |
| PATCH | `/api/users/:id/softdelete` | Borrado lógico. Si gestiona algún organizador no eliminado → `409` |

**Solo para admin** (token de un usuario con rol `admin`; sin token → `401`, otro rol → `403`). La contraseña llega en claro y el servidor guarda solo su hash con Argon2id (igual que el seed). Email repetido → `409`; rol que no existe → `400`. El avatar se guarda en `images` (`entityType: "user"`, `type: "avatar"`) y las respuestas lo traen en `avatar`.

## Endpoints (`roles`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/roles` | Todos (activos, desactivados y eliminados), por nombre |
| GET | `/api/roles/active` | Solo activos y no eliminados (`_id`, `name`, `description`) |
| GET | `/api/roles/deleted` | Solo eliminados |
| GET | `/api/roles/:id` | Un rol activo |
| POST | `/api/roles` | Crea. Obligatorio: `name` (único, se guarda en minúsculas; solo letras, números, `-` y `_`). Opcionales: `description`, `permissions` (`["plans:read", ...]`) |
| PATCH | `/api/roles/:id` | Modifica los campos enviados |
| PATCH | `/api/roles/:id/active` | Activa o desactiva. Eliminado → `409` |
| PATCH | `/api/roles/:id/softdelete` | Borrado lógico. Si hay usuarios no eliminados con ese rol → `409` |

## Endpoints (`categories`)

Funcionan igual que los de planes (mismo formato de respuesta, soft delete y reglas de activar/desactivar).

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/categories` | Todas (activas, desactivadas y eliminadas), por nombre |
| GET | `/api/categories/active` | Solo activas y no eliminadas (`_id`, `name`, `slug`) |
| GET | `/api/categories/deleted` | Solo eliminadas |
| GET | `/api/categories/:id` | Una categoría activa |
| POST | `/api/categories` | Crea. Obligatorio: `name`. Opcionales: `description`, `icon`, `group`, `status`, `coverImageUrl` |
| PATCH | `/api/categories/:id` | Modifica los campos enviados. Si cambia el nombre, se regenera el `slug` |
| PATCH | `/api/categories/:id/active` | Activa o desactiva. Eliminada → `409` |
| PATCH | `/api/categories/:id/softdelete` | Borrado lógico. Si la usa algún plan no eliminado → `409` |

La portada se envía como `coverImageUrl` y se guarda en `images` (`entityType: "category"`); las respuestas la traen en `coverImage`.

## Endpoints (`images`)

Funcionan igual que los de planes (mismo formato de respuesta, soft delete y reglas de activar/desactivar). Sirven para ver y gestionar desde el panel todas las imágenes; los formularios de planes, lugares, categorías, organizadores y usuarios siguen guardando las suyas con las URLs.

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/images` | Todas (activas, desactivadas y eliminadas), por entidad, tipo y posición |
| GET | `/api/images/active` | Solo activas y no eliminadas (`_id`, `url`, `alt`) |
| GET | `/api/images/deleted` | Solo eliminadas |
| GET | `/api/images/:id` | Una imagen activa |
| POST | `/api/images` | Crea. Obligatorios: `url`, `entityType`, `entityId` y `type`. Opcionales: `alt`, `position` |
| PATCH | `/api/images/:id` | Modifica `url`, `alt`, `type` o `position`. La entidad no se puede cambiar |
| PATCH | `/api/images/:id/active` | Activa o desactiva. Eliminada → `409` |
| PATCH | `/api/images/:id/softdelete` | Borrado lógico |

Las respuestas traen `entityName`: el nombre (o el título, si es un plan) del documento al que pertenece la imagen. Validaciones en el servicio: el `type` tiene que ser uno de los permitidos para su `entityType` (tabla de arriba) y la entidad tiene que existir (`400`). Cada documento puede tener como mucho una imagen activa de tipo `cover`, `logo` o `avatar` y 10 de tipo `gallery`: si se supera al crear, al cambiar el tipo o al activar → `409`.

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

### Integridad referencial

MongoDB no tiene claves foráneas, así que el servidor lo comprueba a mano (en los services) en estos momentos:

1. **Al crear o modificar**: los ids relacionados tienen que existir, estar activos y no estar eliminados (`repos/refs.repo.js`). Si no → `400`.
2. **Al eliminar**: no se puede eliminar un documento que otro necesita (si no, ese otro se quedaría apuntando a algo borrado). Se avisa con `409` y se puede desactivar en su lugar.
3. **Al desactivar** (`PATCH /:id/active` con `false`): no se puede desactivar un documento que usa otro **activo** (por ejemplo, una categoría con planes activos o un plan con sesiones activas). Se avisa con `409`: primero hay que desactivar o cambiar los que dependen de él.
4. **Al activar** (`PATCH /:id/active` con `true`): no se puede activar un documento si alguno de los que necesita está desactivado (por ejemplo, un plan cuya categoría está desactivada o una sesión de un plan desactivado). Se avisa con `409`.

Así nunca hay un documento activo apuntando a otro desactivado.

| Relación | Al crear/modificar/activar | Al eliminar o desactivar el relacionado |
|---|---|---|
| `plans.categoryIds` → `categories` | Las categorías existen y están activas | Eliminar: categoría usada por algún plan → `409`. Desactivar: usada por algún plan activo → `409` |
| `plans.venueId` → `venues` | El lugar existe y está activo | Lugar con planes (activos, al desactivar) → `409` |
| `plans.organizerId` → `organizers` | El organizador existe y está activo | Organizador con planes (activos, al desactivar) → `409` |
| `sessions.planId` → `plans` | El plan existe y está activo (y no se puede cambiar) | Plan con sesiones (activas, al desactivar) → `409` |
| `users.roleId` → `roles` | El rol existe y está activo | Rol con usuarios (activos, al desactivar) → `409` |
| `organizers.userIds` → `users` | Los usuarios existen y están activos | Usuario que gestiona organizadores (activos, al desactivar) → `409` |
| `images.entityId` → plan, lugar, categoría, organizador o usuario | La entidad existe (aunque esté desactivada) | Las imágenes forman parte del documento: se quedan con él como historial |

Solo cuentan los documentos no eliminados: un lugar que solo usan planes ya eliminados sí se puede eliminar. Y al desactivar solo cuentan los activos: un lugar que solo usan planes desactivados sí se puede desactivar.

### Reglas de negocio con `status`

Además de la integridad referencial, el `status` de un documento limita con qué se puede relacionar algo **nuevo**. Lo que ya estaba relacionado se queda aunque luego cambie de estado (sirve de historial). Si no se cumple → `400`.

| Al crear o modificar | No se permite |
|---|---|
| Plan: `categoryIds` | Añadir una categoría `archived` |
| Plan: `venueId` | Elegir un lugar `permanently_closed` |
| Plan: `organizerId` | Elegir un organizador `suspended` |
| Sesión: crear | Crear sesiones en un plan `cancelled` o `finished` |
| Sesión: `status` | Poner en `draft` o `published` una sesión de un plan `cancelled` o `finished` |
| Organizador: `userIds` | Añadir un usuario `suspended` o `banned` |

Cambiar el `status` de un documento nunca se bloquea por los que dependen de él: se puede cancelar un plan con sesiones o archivar una categoría que usan planes.

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
