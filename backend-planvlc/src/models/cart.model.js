import mongoose from "mongoose";

const { Schema } = mongoose;

// Carrito de un usuario: uno por usuario y persistente (sigue ahí al cerrar sesión y volver).
// Relaciones: User 1 → 1 Cart (carts.userId) y Cart 1 → N CartItem (cartitems.cartId).
// Va aparte de los pedidos: en el checkout (fase futura) el carrito se convertirá en un Order
// con sus OrderItems (con el precio de ese momento), se cobrará el Payment, se crearán los Bookings,
// se descontará el stock de cada sesión y se vaciará el carrito
const cartSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"], unique: true },
    // Concurrencia (bloqueo optimista): sube en 1 con cada cambio del carrito. Un cambio solo se aplica si el
    // carrito sigue en la versión que se leyó (o la que manda el cliente en If-Match); si no → 409.
    // Ver claimVersion en services/cart.service.js
    version: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Cart", cartSchema);
