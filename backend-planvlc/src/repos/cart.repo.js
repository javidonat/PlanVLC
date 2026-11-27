import { Cart, CartItem, Plan, Session } from "../models/index.js";

// Consultas del carrito. Solo habla con la base de datos: las reglas (stock, cantidades, totales) van en el servicio
const VISIBLE_PLAN = { status: "published", isActive: true, deletedAt: null };
const BOOKABLE_SESSION = () => ({ status: "published", isActive: true, deletedAt: null, startDateTime: { $gte: new Date() } });

// Lo que hace falta de la sesión y del plan para pintar el carrito y comprobar si se puede seguir comprando
const ITEM_POPULATE = [
  { path: "sessionId", select: "startDateTime endDateTime price currency stock status isActive deletedAt" },
  { path: "planId", select: "title slug status isActive deletedAt", populate: { path: "coverImage", select: "url alt" } },
];

// Sesión que se puede comprar: publicada, activa, que no ha empezado y de un plan que se ve en la tienda
const findBookableSession = async (sessionId) => {
  const session = await Session.findOne({ _id: sessionId, ...BOOKABLE_SESSION() }).select("planId price currency stock startDateTime").lean();
  if (!session) return null;
  return (await Plan.exists({ _id: session.planId, ...VISIBLE_PLAN })) ? session : null;
};

const findCartByUser = (userId) => Cart.findOne({ userId }).lean();

// Carrito del usuario; si aún no tiene, se crea (upsert: uno por usuario aunque lleguen dos peticiones a la vez)
const findOrCreateCart = (userId) =>
  Cart.findOneAndUpdate({ userId }, { $setOnInsert: { userId } }, { upsert: true, new: true }).lean();

// Bloqueo optimista: sube la versión solo si el carrito sigue en la que se espera (una sola operación
// atómica en MongoDB). Devuelve false si otra petición lo ha cambiado antes
const bumpVersion = async (cartId, expectedVersion) =>
  (await Cart.updateOne({ _id: cartId, version: expectedVersion }, { $inc: { version: 1 } })).modifiedCount === 1;

const findItems = (cartId) => CartItem.find({ cartId }).populate(ITEM_POPULATE).sort({ createdAt: 1 }).lean();

// "find": ¿ya está esta sesión en el carrito?
const findItemBySession = (cartId, sessionId) => CartItem.findOne({ cartId, sessionId }).lean();

// Una línea, pero solo si es de este carrito (así nadie toca el carrito de otro)
const findItem = (cartId, itemId) => CartItem.findOne({ _id: itemId, cartId }).lean();

// "insert into"
const createItem = (data) => CartItem.create(data);

// "update": cambia la cantidad (y la fecha, si llega)
const updateItem = (itemId, changes) => CartItem.updateOne({ _id: itemId }, { $set: changes });

// "qty++" atómico ($inc): suma en la base de datos, no "leer, sumar y escribir", así no se pierde ninguna suma.
// Solo si el resultado no pasa del máximo (maxQuantity). Devuelve false si no se ha sumado
const incrementItem = async (itemId, quantity, maxQuantity) =>
  (await CartItem.updateOne({ _id: itemId, quantity: { $lte: maxQuantity - quantity } }, { $inc: { quantity } })).modifiedCount === 1;

const deleteItem = (cartId, itemId) => CartItem.deleteOne({ _id: itemId, cartId });

const clearItems = (cartId) => CartItem.deleteMany({ cartId });

export default {
  findBookableSession, findCartByUser, findOrCreateCart, bumpVersion, findItems, findItemBySession, findItem,
  createItem, updateItem, incrementItem, deleteItem, clearItems,
};
