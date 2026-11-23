import mongoose from "mongoose";

const { Schema } = mongoose;

// Comentarios (opiniones) de los clientes sobre un plan, con una valoración de 1 a 5 estrellas.
// Relaciones: Plan 1 → N Comment (comments.planId) y User 1 → N Comment (comments.userId).
// El comentario apunta al plan y al usuario, no al revés
const commentSchema = new Schema(
  {
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: [true, "El plan es obligatorio"] },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: [true, "El usuario es obligatorio"] },
    rating: {
      type: Number,
      required: [true, "La valoración es obligatoria"],
      min: [1, "La valoración mínima es 1"],
      max: [5, "La valoración máxima es 5"],
      validate: { validator: Number.isInteger, message: "La valoración debe ser un número entero" },
    },
    text: {
      type: String,
      required: [true, "El comentario es obligatorio"],
      trim: true,
      minlength: [3, "El comentario debe tener al menos 3 caracteres"],
      maxlength: [1000, "El comentario no puede superar los 1000 caracteres"],
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }, // soft delete: al borrar un comentario no se elimina de verdad
  },
  { timestamps: true }
);

// Comentarios de un plan, los más nuevos primero (detalle del plan) y los de un usuario
commentSchema.index({ planId: 1, deletedAt: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

export default mongoose.model("Comment", commentSchema);
