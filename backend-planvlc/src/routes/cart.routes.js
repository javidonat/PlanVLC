import { Router } from "express";
import cartCtrl from "../ctrls/cart.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { addCartItemSchema, cartItemParamsSchema, updateCartItemSchema } from "../schemas/cart.schema.js";

const router = Router();

// Todo con sesión (authenticate): cada usuario solo ve y cambia su propio carrito.
// Todas responden con el carrito completo: { items: [{ _id, plan, session, quantity, unitPrice, subtotal, available, issue }],
//   totalItems, total, currency, hasIssues, maxQuantity }
// GET    /api/cart              → tu carrito
// POST   /api/cart/items        → Body: sessionId, quantity (1 por defecto). Si ya está, suma la cantidad
// PUT    /api/cart/items/:id    → Body: quantity y/o sessionId (otra fecha del mismo plan)
// DELETE /api/cart/items/:id    → quita la línea
// DELETE /api/cart/clear        → vacía el carrito

router.use(authenticate);
router.get("/", cartCtrl.getCart);
router.post("/items", validate({ body: addCartItemSchema }), cartCtrl.postItem);
router.put("/items/:id", validate({ params: cartItemParamsSchema, body: updateCartItemSchema }), cartCtrl.putItem);
router.delete("/items/:id", validate({ params: cartItemParamsSchema }), cartCtrl.deleteItem);
router.delete("/clear", cartCtrl.deleteAll);

export default router;
