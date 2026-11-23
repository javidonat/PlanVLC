import mongoose from "mongoose";

const { Schema } = mongoose;

// Lista de deseos: planes que un usuario guarda para más adelante (tabla intermedia N a N entre User y Plan).
// Relaciones: User 1 → N Wishlist (wishlists.userId) y Plan 1 → N Wishlist (wishlists.planId).
// Quitar un plan de la lista borra el documento
const wishlistSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"] },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: [true, "El plan es obligatorio"] },
  },
  { timestamps: true }
);

// Cada plan solo puede estar una vez en la lista de cada usuario
wishlistSchema.index({ userId: 1, planId: 1 }, { unique: true });

export default mongoose.model("Wishlist", wishlistSchema);
