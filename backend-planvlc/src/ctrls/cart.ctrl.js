import cartService from "../services/cart.service.js";
import AppError from "../services/utils/AppError.js";
import { cartVersionSchema } from "../schemas/cart.schema.js";

// Todas devuelven el carrito completo y recalculado, así el frontend solo tiene que pintarlo

// Versión del carrito de la cabecera If-Match (puede venir entre comillas, como un ETag: "3"). Sin cabecera → undefined
const ifMatchVersion = (req) => {
  const header = req.get("If-Match")?.replace(/^W\//, "").replaceAll('"', "").trim();
  const result = cartVersionSchema.safeParse(header || undefined);
  if (!result.success) throw new AppError(result.error.issues[0].message, 400);
  return result.data;
};

// GET /api/cart (req.user lo pone el middleware de autenticación)
const getCart = async (req, res, next) => {
  try {
    const data = await cartService.getCart(req.user);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/cart/items → 201 si es una línea nueva, 200 si ya estaba y se ha sumado la cantidad.
// Con Idempotency-Key (middleware/idempotency.js): si se repite, devuelve la misma respuesta sin volver a sumar
const postItem = async (req, res, next) => {
  try {
    const { created, cart } = await cartService.addItem(req.user, req.body);
    res.status(created ? 201 : 200).json({ ok: true, message: created ? "Añadido al carrito" : "Cantidad actualizada en el carrito", data: cart });
  } catch (error) {
    next(error);
  }
};

// PUT /api/cart/items/:id
const putItem = async (req, res, next) => {
  try {
    const data = await cartService.updateItem(req.user, req.params.id, req.body, ifMatchVersion(req));
    res.status(200).json({ ok: true, message: "Carrito actualizado", data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/items/:id
const deleteItem = async (req, res, next) => {
  try {
    const data = await cartService.removeItem(req.user, req.params.id, ifMatchVersion(req));
    res.status(200).json({ ok: true, message: "Quitado del carrito", data });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/cart/clear
const deleteAll = async (req, res, next) => {
  try {
    const data = await cartService.clearCart(req.user, ifMatchVersion(req));
    res.status(200).json({ ok: true, message: "Carrito vaciado", data });
  } catch (error) {
    next(error);
  }
};

export default { getCart, postItem, putItem, deleteItem, deleteAll };
