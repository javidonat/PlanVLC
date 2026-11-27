import cartRepo from "../repos/cart.repo.js";
import AppError from "./utils/AppError.js";

// Carrito: cada usuario tiene el suyo (sale de la sesión, nunca de la URL ni del body).
// Precios, subtotales, total y número de entradas se calculan SIEMPRE aquí con el precio actual de cada sesión:
// el frontend solo envía qué sesión y cuántas entradas.
// El stock no se descuenta al añadir al carrito (eso será en el checkout), pero no se deja pedir más de las plazas
// que quedan, y GET /api/cart avisa si una línea ya no se puede comprar (fecha pasada, plan retirado o sin plazas).
//
// Concurrencia (bloqueo optimista con carts.version): cada cambio lee el carrito, comprueba las reglas y, antes de
// escribir, "reclama" la versión (claimVersion): solo sigue si nadie lo ha cambiado entretanto, y la sube en 1.
// - Editar, quitar o vaciar: el cliente manda en If-Match la versión que está viendo. Si ya no es la actual
//   (lo has cambiado en otra pestaña o dispositivo) → 409 y el frontend recarga el carrito.
// - Añadir: no depende de lo que se ve (solo suma), así que si choca con otra petición se reintenta solo
//   (hasta MAX_RETRIES veces) con el carrito ya actualizado. Además la suma es atómica ($inc)
// La idempotencia (no repetir un POST) la hace middleware/idempotency.js

export const MAX_QUANTITY = 10; // entradas por línea
const MAX_RETRIES = 3; // intentos de "añadir" si otra petición cambia el carrito a la vez

const round2 = (value) => Math.round(value * 100) / 100;
const placesText = (stock) => (stock === 1 ? "Solo queda 1 plaza" : `Solo quedan ${stock} plazas`);

// Comprueba que la cantidad cabe: máximo por línea y plazas que quedan (stock null = sin límite)
const ensureQuantity = (session, quantity) => {
  if (quantity > MAX_QUANTITY) {
    throw new AppError(`Puedes añadir como máximo ${MAX_QUANTITY} entradas de la misma fecha`, 409);
  }
  if (session.stock !== null && session.stock !== undefined && quantity > session.stock) {
    const message = session.stock === 0 ? "No quedan plazas para esta fecha" : `${placesText(session.stock)} para esta fecha`;
    throw new AppError(message, 409);
  }
};

// Máximo de entradas de una sesión en una línea: 10 y nunca más plazas de las que quedan
const maxFor = (session) =>
  session.stock !== null && session.stock !== undefined ? Math.min(MAX_QUANTITY, session.stock) : MAX_QUANTITY;

// Conflicto de versión: otra petición ha cambiado el carrito entre que se leyó y se iba a escribir
const versionConflict = () => {
  const error = new AppError("Tu carrito ha cambiado en otra pestaña o dispositivo. Revisa cómo ha quedado y vuelve a intentarlo", 409);
  error.versionConflict = true;
  return error;
};

// Bloqueo optimista: si el carrito ya no está en expectedVersion → 409; si lo está, pasa a la siguiente
const claimVersion = async (cart, expectedVersion) => {
  if (!(await cartRepo.bumpVersion(cart._id, expectedVersion))) throw versionConflict();
};

// Versión que hay que respetar: la que manda el cliente (If-Match) o, si no manda ninguna, la que se acaba de leer
const expectedVersion = (cart, clientVersion) => clientVersion ?? cart.version;

const getBookableSession = async (sessionId) => {
  const session = await cartRepo.findBookableSession(sessionId);
  if (!session) throw new AppError("Esta fecha ya no está disponible", 404);
  return session;
};

// ¿Se puede seguir comprando esta línea? Devuelve el motivo si no
const itemIssue = (item) => {
  const { sessionId: session, planId: plan } = item;
  if (!session || !plan) return "Este plan ya no existe";
  const planVisible = plan.status === "published" && plan.isActive && !plan.deletedAt;
  const sessionVisible = session.status === "published" && session.isActive && !session.deletedAt;
  if (!planVisible || !sessionVisible) return "Este plan ya no está a la venta";
  if (new Date(session.startDateTime) < new Date()) return "Esta fecha ya ha pasado";
  if (session.stock !== null && session.stock !== undefined) {
    if (session.stock === 0) return "No quedan plazas para esta fecha";
    if (item.quantity > session.stock) return `${placesText(session.stock)}: baja la cantidad`;
  }
  return null;
};

// El carrito con sus líneas y los cálculos. Las líneas con problemas no cuentan en el total
const buildCart = async (userId) => {
  const cart = await cartRepo.findCartByUser(userId);
  const rawItems = cart ? await cartRepo.findItems(cart._id) : [];
  const items = rawItems.map((item) => {
    const issue = itemIssue(item);
    const unitPrice = item.sessionId?.price ?? 0;
    const { sessionId: session, planId: plan } = item;
    return {
      _id: item._id,
      quantity: item.quantity,
      unitPrice,
      subtotal: round2(unitPrice * item.quantity),
      available: !issue,
      issue,
      plan: plan && { _id: plan._id, title: plan.title, slug: plan.slug, coverImage: plan.coverImage ?? null },
      session: session && {
        _id: session._id,
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        price: session.price,
        currency: session.currency,
        stock: session.stock,
      },
    };
  });
  const valid = items.filter((item) => item.available);
  return {
    _id: cart?._id ?? null,
    items,
    totalItems: valid.reduce((total, item) => total + item.quantity, 0),
    total: round2(valid.reduce((total, item) => total + item.subtotal, 0)),
    currency: "EUR",
    hasIssues: valid.length !== items.length,
    maxQuantity: MAX_QUANTITY,
    version: cart?.version ?? 0, // el cliente la devuelve en If-Match al editar, quitar o vaciar
  };
};

// GET /api/cart
const getCart = (user) => buildCart(user.id);

// POST /api/cart/items. Si la sesión ya está en el carrito no se duplica: se suma la cantidad (qty++).
// Si otra petición cambia el carrito a la vez (conflicto de versión), se vuelve a intentar con lo que haya ahora
const addItem = async (user, { sessionId, quantity }) => {
  const session = await getBookableSession(sessionId);
  for (let attempt = 1; ; attempt++) {
    try {
      return await tryAddItem(user, session, quantity);
    } catch (error) {
      if (!error.versionConflict || attempt === MAX_RETRIES) throw error;
    }
  }
};

const tryAddItem = async (user, session, quantity) => {
  const cart = await cartRepo.findOrCreateCart(user.id);
  const existing = await cartRepo.findItemBySession(cart._id, session._id);
  ensureQuantity(session, (existing?.quantity ?? 0) + quantity);
  await claimVersion(cart, cart.version);

  if (existing) {
    // $inc con tope: si entretanto otra petición ha sumado y ya no cabe, se reintenta y ensureQuantity da el 409
    if (!(await cartRepo.incrementItem(existing._id, quantity, maxFor(session)))) throw versionConflict();
  } else {
    try {
      await cartRepo.createItem({ cartId: cart._id, planId: session.planId, sessionId: session._id, quantity });
    } catch (error) {
      // Otra petición ha creado la misma línea a la vez (índice único cartId + sessionId) → se reintenta y suma
      if (error.code === 11000) throw versionConflict();
      throw error;
    }
  }
  return { created: !existing, cart: await buildCart(user.id) };
};

// PUT /api/cart/items/:id. Cambia la cantidad y/o la fecha (otra sesión del mismo plan).
// Si la nueva fecha ya estaba en el carrito, se juntan las dos líneas en una. version = If-Match del cliente
const updateItem = async (user, itemId, { quantity, sessionId }, version) => {
  const cart = await cartRepo.findCartByUser(user.id);
  const item = cart && (await cartRepo.findItem(cart._id, itemId));
  if (!item) throw new AppError("Esta línea no está en tu carrito", 404);

  const targetSessionId = sessionId ?? String(item.sessionId);
  const session = await getBookableSession(targetSessionId);
  if (String(session.planId) !== String(item.planId)) {
    throw new AppError("Solo puedes cambiar a otra fecha del mismo plan", 400);
  }
  const newQuantity = quantity ?? item.quantity;

  const changesSession = String(targetSessionId) !== String(item.sessionId);
  const other = changesSession ? await cartRepo.findItemBySession(cart._id, targetSessionId) : null;
  ensureQuantity(session, (other?.quantity ?? 0) + newQuantity);
  await claimVersion(cart, expectedVersion(cart, version));

  if (other) {
    if (!(await cartRepo.incrementItem(other._id, newQuantity, maxFor(session)))) throw versionConflict();
    await cartRepo.deleteItem(cart._id, item._id);
  } else {
    await cartRepo.updateItem(item._id, { quantity: newQuantity, sessionId: targetSessionId });
  }
  return buildCart(user.id);
};

// DELETE /api/cart/items/:id
const removeItem = async (user, itemId, version) => {
  const cart = await cartRepo.findCartByUser(user.id);
  const item = cart && (await cartRepo.findItem(cart._id, itemId));
  if (!item) throw new AppError("Esta línea no está en tu carrito", 404);
  await claimVersion(cart, expectedVersion(cart, version));
  await cartRepo.deleteItem(cart._id, itemId);
  return buildCart(user.id);
};

// DELETE /api/cart/clear
const clearCart = async (user, version) => {
  const cart = await cartRepo.findCartByUser(user.id);
  if (cart) {
    await claimVersion(cart, expectedVersion(cart, version));
    await cartRepo.clearItems(cart._id);
  }
  return buildCart(user.id);
};

export default { getCart, addItem, updateItem, removeItem, clearCart };
