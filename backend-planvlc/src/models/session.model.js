import mongoose from "mongoose";
import { STATUSES } from "./constants.js";

const { Schema } = mongoose;

// Una Session es una fecha concreta de un Plan, con su precio, aforo y stock.
// Un mismo plan puede tener muchas sesiones (tardeo cada domingo, turnos de motos de agua...)
// Es la "variante" del plan (producto): cada sesión tiene su SKU, precio y stock.
const sessionSchema = new Schema(
  {
    planId: {
      type: Schema.Types.ObjectId,
      ref: "Plan",
      required: [true, "El plan es obligatorio"],
    },
    // Código único de la variante. Se genera con generateUniqueSku (services/utils/sku.js):
    // slug del plan + fecha y hora de inicio + sufijo aleatorio, ej. "TARDEO-RUZAFA-20251012-1700-3F9A1C2B"
    sku: {
      type: String,
      required: [true, "El SKU es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    startDateTime: {
      type: Date,
      required: [true, "La fecha de inicio es obligatoria"],
    },
    endDateTime: {
      type: Date,
      default: null,
      validate: {
        // Solo se puede comparar al crear/guardar (en updates `this` no tiene los datos)
        validator: function (end) {
          return !end || !this.startDateTime || end > this.startDateTime;
        },
        message: "La fecha de fin debe ser posterior a la de inicio",
      },
    },
    price: {
      type: Number,
      min: [0, "El precio no puede ser negativo"],
      default: 0, // 0 = gratis
    },
    currency: { type: String, default: "EUR", uppercase: true, trim: true },
    capacity: {
      type: Number,
      min: [0, "El aforo no puede ser negativo"],
      default: null, // null = sin límite
    },
    stock: {
      type: Number,
      min: [0, "El stock no puede ser negativo"],
      default: null, // plazas/entradas disponibles; null = sin límite
      validate: {
        validator: function (stock) {
          return stock === null || stock === undefined || this.capacity == null || stock <= this.capacity;
        },
        message: "El stock no puede superar el aforo",
      },
    },

    status: {
      type: String,
      enum: { values: STATUSES, message: "El estado '{VALUE}' no es válido" },
      default: "published",
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

sessionSchema.index({ planId: 1, startDateTime: 1 });

export default mongoose.model("Session", sessionSchema);
