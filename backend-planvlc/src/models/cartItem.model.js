import mongoose from "mongoose";

const { Schema } = mongoose;

// Línea del carrito: una sesión concreta (la variante: fecha, precio y stock) de un plan y cuántas entradas.
// Relaciones: Cart 1 → N CartItem (cartId), Session 1 → N CartItem (sessionId: la variante, el "id_variant")
// y Plan 1 → N CartItem (planId, para pintar el carrito sin buscar el plan de cada sesión).
// El precio NO se guarda: se lee siempre de la sesión, así el total nunca se queda desfasado
// ni se puede manipular desde el frontend. El pedido (fase futura) sí guardará el precio pagado
const cartItemSchema = new Schema(
  {
    cartId: { type: Schema.Types.ObjectId, ref: "Cart", required: [true, "El carrito es obligatorio"] },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: [true, "El plan es obligatorio"] },
    sessionId: { type: Schema.Types.ObjectId, ref: "Session", required: [true, "La fecha es obligatoria"] },
    quantity: {
      type: Number,
      required: [true, "La cantidad es obligatoria"],
      min: [1, "La cantidad mínima es 1"],
      validate: { validator: Number.isInteger, message: "La cantidad debe ser un número entero" },
    },
  },
  { timestamps: true }
);

// La misma sesión no puede estar dos veces en el carrito: si se vuelve a añadir, se suma la cantidad
cartItemSchema.index({ cartId: 1, sessionId: 1 }, { unique: true });

export default mongoose.model("CartItem", cartItemSchema);
