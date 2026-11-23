import mongoose from "mongoose";

const { Schema } = mongoose;

// Likes de los usuarios a los planes (tabla intermedia N a N entre User y Plan).
// Relaciones: User 1 → N Like (likes.userId) y Plan 1 → N Like (likes.planId).
// Quitar el like borra el documento: no hace falta guardarlo como historial
const likeSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"] },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: [true, "El plan es obligatorio"] },
  },
  { timestamps: true }
);

// Un usuario solo puede dar un like a cada plan: la base de datos lo garantiza aunque lleguen dos peticiones a la vez
likeSchema.index({ userId: 1, planId: 1 }, { unique: true });
likeSchema.index({ planId: 1 }); // contar los likes de un plan

export default mongoose.model("Like", likeSchema);
