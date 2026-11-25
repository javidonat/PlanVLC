import cartRepo from "../repos/cart.repo.js";
import AppError from "./utils/AppError.js";

// Carrito: cada usuario tiene el suyo (sale de la sesión, nunca de la URL ni del body).
// Precios, subtotales, total y número de entradas se calculan SIEMPRE aquí con el precio actual de cada sesión:
// el frontend solo envía qué sesión y cuántas entradas.
// El stock no se descuenta al añadir al carrito (eso será en el checkout), pero no se deja pedir más de las plazas
// que quedan, y GET /api/cart avisa si una línea ya no se puede comprar (fecha pasada, plan retirado o sin plazas)

export const MAX_QUANTITY = 10; // entradas por línea

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
  };
};

// GET /api/cart
const getCart = (user) => buildCart(user.id);

// POST /api/cart/items. Si la sesión ya está en el carrito no se duplica: se suma la cantidad (qty++)
const addItem = async (user, { sessionId, quantity }) => {
  const session = await getBookableSession(sessionId);
  const cart = await cartRepo.findOrCreateCart(user.id);
  const existing = await cartRepo.findItemBySession(cart._id, sessionId);
  const newQuantity = (existing?.quantity ?? 0) + quantity;
  ensureQuantity(session, newQuantity);

  if (existing) {
    await cartRepo.updateItem(existing._id, { quantity: newQuantity });
  } else {
    try {
      await cartRepo.createItem({ cartId: cart._id, planId: session.planId, sessionId, quantity });
    } catch (error) {
      // Dos clics a la vez: el índice único rechaza el segundo insert → se suma a la línea que ya existe
      if (error.code !== 11000) throw error;
      const item = await cartRepo.findItemBySession(cart._id, sessionId);
      ensureQuantity(session, item.quantity + quantity);
      await cartRepo.updateItem(item._id, { quantity: item.quantity + quantity });
    }
  }
  return { created: !existing, cart: await buildCart(user.id) };
};

// PUT /api/cart/items/:id. Cambia la cantidad y/o la fecha (otra sesión del mismo plan).
// Si la nueva fecha ya estaba en el carrito, se juntan las dos líneas en una
const updateItem = async (user, itemId, { quantity, sessionId }) => {
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
  if (other) {
    ensureQuantity(session, other.quantity + newQuantity);
    await cartRepo.updateItem(other._id, { quantity: other.quantity + newQuantity });
    await cartRepo.deleteItem(cart._id, item._id);
  } else {
    ensureQuantity(session, newQuantity);
    await cartRepo.updateItem(item._id, { quantity: newQuantity, sessionId: targetSessionId });
  }
  return buildCart(user.id);
};

// DELETE /api/cart/items/:id
const removeItem = async (user, itemId) => {
  const cart = await cartRepo.findCartByUser(user.id);
  const { deletedCount } = cart ? await cartRepo.deleteItem(cart._id, itemId) : { deletedCount: 0 };
  if (!deletedCount) throw new AppError("Esta línea no está en tu carrito", 404);
  return buildCart(user.id);
};

// DELETE /api/cart/clear
const clearCart = async (user) => {
  const cart = await cartRepo.findCartByUser(user.id);
  if (cart) await cartRepo.clearItems(cart._id);
  return buildCart(user.id);
};

export default { getCart, addItem, updateItem, removeItem, clearCart };
