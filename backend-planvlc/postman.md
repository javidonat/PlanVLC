# Probar la API con Postman

Guía para probar el backend de PlanVLC (colección `plans`). No hay autenticación. Las peticiones `POST` y `PATCH` llevan body en JSON: en Postman elige **Body → raw → JSON** (Postman añade solo la cabecera `Content-Type: application/json`).

## Preparación

1. Arranca MongoDB y el backend (`npm run seed` y `npm run dev`).
2. En Postman, crea una **Collection** llamada `PlanVLC`.
3. En la pestaña **Variables** de la colección añade:

| Variable | Valor |
|---|---|
| `baseUrl` | `http://localhost:3000` |
| `planId` | *(vacío; se rellena en la petición 2)* |
| `planSlug` | *(vacío; se rellena en la petición 2)* |
| `categoryId` | *(vacío; se rellena en la petición 2)* |
| `venueId` | *(vacío; se rellena en la petición 2)* |
| `createdPlanId` | *(vacío; se rellena en la petición 8)* |

Después usa `{{baseUrl}}` en las URLs.

---

## 1. Health check

`GET {{baseUrl}}/health`

**Respuesta esperada (200):** `{ "ok": true }`

```js
pm.test("Servidor vivo", () => {
  pm.response.to.have.status(200);
  pm.expect(pm.response.json().ok).to.eql(true);
});
```

---

## 2. Listar planes

`GET {{baseUrl}}/api/plans`

Devuelve todos los planes (activos, desactivados y eliminados) con las relaciones ya cargadas.

**Respuesta esperada (200):**

```json
{
  "ok": true,
  "total": 5,
  "data": [
    {
      "_id": "68f0c1...",
      "title": "Festival Rototom Sunsplash",
      "slug": "festival-rototom-sunsplash",
      "shortDescription": "El festival de reggae más importante de Europa",
      "description": "El festival de reggae más importante de Europa vuelve a Benicàssim...",
      "categoryIds": [{ "_id": "...", "name": "Festival", "slug": "festival" }],
      "organizerId": { "_id": "...", "name": "Rototom Sunsplash", "slug": "rototom-sunsplash" },
      "venueId": { "_id": "...", "name": "Recinto Rototom Sunsplash", "city": "Benicàssim", "neighborhood": "" },
      "coverImageId": { "_id": "...", "url": "https://placehold.co/...", "alt": "Festival Rototom Sunsplash" },
      "galleryImageIds": [],
      "priceFrom": 85,
      "nextSessionAt": "2025-08-16T10:00:00.000Z",
      "minAge": 0,
      "tags": ["reggae", "festival"],
      "status": "published",
      "isActive": true,
      "deletedAt": null,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

Tras ejecutar `npm run seed` deben aparecer 5 planes, ordenados por `nextSessionAt` ascendente (el primero es el Rototom).

**Pestaña Tests** (guarda ids para las siguientes peticiones):

```js
pm.test("Status 200 y lista", () => {
  pm.response.to.have.status(200);
  const json = pm.response.json();
  pm.expect(json.ok).to.eql(true);
  pm.expect(json.data).to.be.an("array");
  pm.expect(json.total).to.eql(json.data.length);
  if (json.data.length > 0) {
    const plan = json.data[0];
    pm.collectionVariables.set("planId", plan._id);
    pm.collectionVariables.set("planSlug", plan.slug);
    pm.collectionVariables.set("categoryId", plan.categoryIds[0]._id);
    pm.collectionVariables.set("venueId", plan.venueId._id);
  }
});

pm.test("Ordenados por próxima sesión ascendente", () => {
  const dates = pm.response.json().data.map(p => new Date(p.nextSessionAt).getTime());
  pm.expect(dates).to.eql([...dates].sort((a, b) => a - b));
});

pm.test("Todos tienen slug y relaciones cargadas", () => {
  pm.response.json().data.forEach(p => {
    pm.expect(p.slug).to.be.a("string").and.not.empty;
    pm.expect(p.categoryIds[0]).to.have.property("name");
    pm.expect(p.venueId).to.have.property("name");
  });
});
```

### 2b. Solo activos y solo eliminados

`GET {{baseUrl}}/api/plans/active` → solo planes con `isActive: true`.
`GET {{baseUrl}}/api/plans/deleted` → solo planes con `deletedAt` relleno (vacío tras el seed).

---

## 3. Obtener un plan por id

`GET {{baseUrl}}/api/plans/{{planId}}`

**Respuesta esperada (200):** `{ "ok": true, "data": { ...el plan... } }`

```js
pm.test("Devuelve el plan pedido", () => {
  pm.response.to.have.status(200);
  const json = pm.response.json();
  pm.expect(json.ok).to.eql(true);
  pm.expect(json.data._id).to.eql(pm.collectionVariables.get("planId"));
});
```

---

## 4. Obtener un plan por slug

`GET {{baseUrl}}/api/plans/slug/{{planSlug}}`

**Respuesta esperada (200):** el mismo plan que en la petición 3.

```js
pm.test("Devuelve el plan por slug", () => {
  pm.response.to.have.status(200);
  const json = pm.response.json();
  pm.expect(json.data.slug).to.eql(pm.collectionVariables.get("planSlug"));
  pm.expect(json.data._id).to.eql(pm.collectionVariables.get("planId"));
});
```

---

## 5. Slug que no existe (404)

`GET {{baseUrl}}/api/plans/slug/no-existe`

**Respuesta esperada (404):** `{ "ok": false, "status": 404, "message": "Plan no encontrado" }`

```js
pm.test("Slug inexistente → 404", () => {
  pm.response.to.have.status(404);
  pm.expect(pm.response.json().message).to.eql("Plan no encontrado");
});
```

---

## 6. Id que no existe (404) o inválido (400)

`GET {{baseUrl}}/api/plans/000000000000000000000000` → **404** `Plan no encontrado` (formato correcto, pero no está en la base de datos).

`GET {{baseUrl}}/api/plans/abc123` → **400** `El id del plan no es válido` (no tiene formato de ObjectId).

---

## 7. Ruta que no existe (404)

`GET {{baseUrl}}/api/algo`

**Respuesta esperada (404):** `{ "ok": false, "status": 404, "message": "Ruta no encontrada: GET /api/algo" }`

---

## 8. Crear un plan (POST)

`POST {{baseUrl}}/api/plans`

**Body (raw → JSON):**

```json
{
  "title": "Tardeo en la Marina",
  "shortDescription": "DJ set con vistas al puerto",
  "description": "DJ set con vistas al puerto, de 17h a 22h.",
  "categoryIds": ["{{categoryId}}"],
  "venueId": "{{venueId}}",
  "minAge": 18,
  "tags": ["tardeo", "dj"]
}
```

Obligatorios: `title`, `description`, `categoryIds` (al menos una) y `venueId`. Los ids (`categoryId`, `venueId`) los rellena la petición 2. Si omites los opcionales se usan sus valores por defecto. El `slug` se genera solo a partir del título (`tardeo-en-la-marina`); si ya existe, se añade un sufijo (`tardeo-en-la-marina-1`). `slug`, `priceFrom`, `nextSessionAt`, `isActive` y `deletedAt` no se pueden enviar: se ignoran.

**Respuesta esperada (201):**

```json
{
  "ok": true,
  "message": "Plan creado correctamente",
  "data": {
    "_id": "68f0c1...",
    "title": "Tardeo en la Marina",
    "slug": "tardeo-en-la-marina",
    "status": "published",
    "isActive": true,
    "deletedAt": null,
    "priceFrom": 0,
    "nextSessionAt": null
  }
}
```

`nextSessionAt` es `null` porque el plan aún no tiene sesiones.

```js
pm.test("Plan creado → 201", () => {
  pm.response.to.have.status(201);
  const json = pm.response.json();
  pm.expect(json.ok).to.eql(true);
  pm.collectionVariables.set("createdPlanId", json.data._id);
});

pm.test("Campos automáticos correctos", () => {
  const plan = pm.response.json().data;
  pm.expect(plan.slug).to.match(/^tardeo-en-la-marina/);
  pm.expect(plan.status).to.eql("published");
  pm.expect(plan.isActive).to.eql(true);
  pm.expect(plan.deletedAt).to.eql(null);
});
```

### 8b. POST con datos incorrectos (400)

Body: `{ "title": "Sin más datos", "categoryIds": [] }`

**Respuesta esperada (400):** `ok: false` y un `message` con los problemas (`El plan necesita al menos una categoría`, descripción y lugar obligatorios...) y el array `errors`. Un body vacío `{}` devuelve todos los campos obligatorios.

### 8c. POST con una relación que no existe (400)

Body igual que el de la petición 8, pero con `"venueId": "000000000000000000000000"`.

**Respuesta esperada (400):** `El lugar indicado no existe`. El formato del id es correcto, pero MongoDB no valida referencias: lo comprueba el servicio.

```js
pm.test("Datos inválidos → 400", () => {
  pm.response.to.have.status(400);
  pm.expect(pm.response.json().ok).to.eql(false);
});
```

---

## 9. Modificar campos sueltos (PATCH)

`PATCH {{baseUrl}}/api/plans/{{createdPlanId}}`

Solo se envía lo que cambia:

```json
{ "minAge": 16, "status": "draft" }
```

**Respuesta esperada (200):** `"message": "Plan modificado correctamente"`; el resto de campos (incluido el `slug`) siguen igual.

```js
pm.test("PATCH cambia solo lo enviado", () => {
  pm.response.to.have.status(200);
  const plan = pm.response.json().data;
  pm.expect(plan.minAge).to.eql(16);
  pm.expect(plan.status).to.eql("draft");
  pm.expect(plan.title).to.eql("Tardeo en la Marina");
});
```

Si cambias el `title`, el `slug` se regenera.

### 9b. PATCH vacío (400)

Body: `{}` → `No se ha enviado ningún campo válido para modificar`

### 9c. PATCH con estado inválido (400)

Body: `{ "status": "inventado" }` → `El estado 'inventado' no es válido`. Los estados válidos son `draft`, `published`, `cancelled` y `finished`. El estado se cambia con este mismo PATCH: no hay una ruta aparte.

### 9d. PATCH con id inválido (400)

`PATCH {{baseUrl}}/api/plans/abc123` con body `{ "minAge": 1 }` → `El id del plan no es válido`

---

## 10. Borrado lógico (soft delete)

`PATCH {{baseUrl}}/api/plans/{{createdPlanId}}/softdelete`

Sin body. El plan no se borra de la base de datos: pasa a `isActive: false` y `deletedAt` toma la fecha actual.

**Respuesta esperada (200):**

```json
{
  "ok": true,
  "message": "Plan eliminado correctamente",
  "data": { "_id": "68f0c1...", "title": "Tardeo en la Marina", "isActive": false, "deletedAt": "2026-10-14T13:45:00.000Z" }
}
```

```js
pm.test("Soft delete → 200", () => {
  pm.response.to.have.status(200);
  const json = pm.response.json();
  pm.expect(json.message).to.eql("Plan eliminado correctamente");
  pm.expect(json.data.isActive).to.eql(false);
  pm.expect(json.data.deletedAt).to.not.eql(null);
});
```

### 10b. El plan ya no se encuentra

`GET {{baseUrl}}/api/plans/{{createdPlanId}}` → **404**. Repetir el `softdelete` también devuelve **404**, y un `PATCH /:id` sobre él también.
`GET {{baseUrl}}/api/plans/deleted` → ahora sí incluye ese plan.

En MongoDB Compass el documento sigue existiendo, con `isActive: false` y `deletedAt` relleno.

---

## 11. Activar / desactivar un plan

`PATCH {{baseUrl}}/api/plans/{{createdPlanId}}/active`

Intentar **restaurar** el plan borrado en la petición 10:

```json
{ "isActive": true }
```

**Respuesta esperada (409):**

```json
{ "ok": false, "status": 409, "message": "El plan está eliminado y no se puede activar ni desactivar" }
```

```js
pm.test("Reactivar un eliminado → 409", () => {
  pm.response.to.have.status(409);
  pm.expect(pm.response.json().ok).to.eql(false);
});
```

Con un plan que **no** esté eliminado (por ejemplo `{{planId}}`), `{ "isActive": false }` lo desactiva (`"message": "Plan desactivado correctamente"`, sin tocar `deletedAt`) y `{ "isActive": true }` lo vuelve a activar (200).

### 11b. isActive inválido (400)

Body: `{ "isActive": "si" }` → `isActive es obligatorio y debe ser true o false`. Lo mismo ocurre si el body va vacío.

---

## Resumen

| # | Petición | Código |
|---|---|---|
| 1 | `GET /health` | 200 |
| 2 | `GET /api/plans` | 200 |
| 2b | `GET /api/plans/active` y `/deleted` | 200 |
| 3 | `GET /api/plans/:id` (válido) | 200 |
| 4 | `GET /api/plans/slug/:slug` (válido) | 200 |
| 5 | `GET /api/plans/slug/no-existe` | 404 |
| 6 | `GET /api/plans/000000000000000000000000` | 404 |
| 6 | `GET /api/plans/abc123` | 400 |
| 7 | `GET /api/algo` | 404 |
| 8 | `POST /api/plans` (correcto) | 201 |
| 8b | `POST /api/plans` (datos inválidos) | 400 |
| 8c | `POST /api/plans` (relación que no existe) | 400 |
| 9 | `PATCH /api/plans/:id` | 200 |
| 9b | `PATCH /api/plans/:id` (vacío) | 400 |
| 9c | `PATCH /api/plans/:id` (status inválido) | 400 |
| 9d | `PATCH /api/plans/abc123` (id inválido) | 400 |
| 10 | `PATCH /api/plans/:id/softdelete` | 200 (404 si ya está borrado) |
| 11 | `PATCH /api/plans/:id/active` (`isActive: true`) sobre un plan eliminado | 409 |
| 11b | `PATCH /api/plans/:id/active` (`isActive` inválido) | 400 |

Para ejecutar todo de golpe: **Run collection** en Postman, en el orden indicado (la petición 2 rellena `planId`, `planSlug`, `categoryId` y `venueId`, y la 8 rellena `createdPlanId`, que usan las siguientes).
