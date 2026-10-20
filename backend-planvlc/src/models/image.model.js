import mongoose from "mongoose";
import { IMAGE_ENTITY_TYPES, IMAGE_TYPES } from "./constants.js";

const { Schema } = mongoose;

// Imágenes de cualquier entidad (portada y galería de planes y lugares, portada de categorías,
// logos de organizadores, avatares...). La relación la guarda la imagen: entityType + entityId
// indican a qué documento pertenece (las entidades no guardan ids de imágenes).
const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: [true, "La URL de la imagen es obligatoria"],
      trim: true,
      match: [/^https?:\/\/\S+$/i, "La URL de la imagen no es válida"],
    },
    alt: { type: String, trim: true, default: "" },
    entityType: {
      type: String,
      required: [true, "El tipo de entidad de la imagen es obligatorio"],
      enum: { values: Object.keys(IMAGE_ENTITY_TYPES), message: "La entidad '{VALUE}' no es válida" },
    },
    // Sin ref fija: el modelo al que apunta depende de entityType
    entityId: { type: Schema.Types.ObjectId, required: [true, "El id de la entidad de la imagen es obligatorio"] },
    type: {
      type: String,
      enum: { values: IMAGE_TYPES, message: "El tipo '{VALUE}' no es válido" },
      default: "gallery",
      validate: {
        // Cada entidad solo admite sus tipos (un plan no tiene avatar, un usuario no tiene galería...)
        validator: function (type) {
          const allowed = IMAGE_ENTITY_TYPES[this.entityType];
          return !allowed || allowed.includes(type);
        },
        message: "El tipo de imagen '{VALUE}' no es válido para esa entidad",
      },
    },
    position: { type: Number, min: [0, "La posición no puede ser negativa"], default: 0 }, // orden en la galería

    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

imageSchema.index({ entityType: 1, entityId: 1, type: 1, position: 1 });

export default mongoose.model("Image", imageSchema);
