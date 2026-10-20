import mongoose from "mongoose";
import { STATUSES } from "./constants.js";

const { Schema } = mongoose;

// Un Plan es la "ficha" general (ej. "Tardeo Ruzafa").
// Las fechas concretas, el precio y el aforo viven en Session.
const planSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "El título del plan es obligatorio"],
      trim: true,
      maxlength: [150, "El título no puede superar los 150 caracteres"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, "La descripción corta no puede superar los 200 caracteres"],
      default: "",
    },
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
    },

    // --- Relaciones (referencias por ObjectId) ---
    categoryIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Category" }],
      validate: {
        validator: (ids) => Array.isArray(ids) && ids.length > 0,
        message: "El plan necesita al menos una categoría",
      },
    },
    organizerId: { type: Schema.Types.ObjectId, ref: "Organizer", default: null },
    venueId: {
      type: Schema.Types.ObjectId,
      ref: "Venue",
      required: [true, "El lugar es obligatorio"],
    },
    // Las imágenes (portada y galería) no se guardan aquí: viven en "images" con
    // entityType "plan" y entityId = _id del plan. Ver los virtuals coverImage y galleryImages.

    // --- Datos derivados de las sesiones (los calcula el servidor) ---
    // Se guardan aquí para que el listado no tenga que consultar "sessions" cada vez
    priceFrom: { type: Number, min: 0, default: 0 }, // precio mínimo; 0 = gratis
    nextSessionAt: { type: Date, default: null }, // fecha de la próxima sesión

    minAge: {
      type: Number,
      min: [0, "La edad mínima no puede ser negativa"],
      default: 18,
    },
    tags: [{ type: String, trim: true, lowercase: true }],

    // --- Campos comunes del panel admin ---
    status: {
      type: String,
      enum: { values: STATUSES, message: "El estado '{VALUE}' no es válido" },
      default: "published",
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null }, // null = no eliminado (soft delete)
  },
  {
    timestamps: true,
    // Incluye los virtuals poblados (coverImage, galleryImages) al devolver el plan en JSON.
    // id: false evita el virtual "id" (duplicado de _id)
    id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

planSchema.index({ nextSessionAt: 1 });

// Imágenes del plan (relación inversa: images.entityId → plans._id). Solo las activas y no eliminadas.
planSchema.virtual("coverImage", {
  ref: "Image",
  localField: "_id",
  foreignField: "entityId",
  justOne: true,
  match: { entityType: "plan", type: "cover", isActive: true, deletedAt: null },
});

planSchema.virtual("galleryImages", {
  ref: "Image",
  localField: "_id",
  foreignField: "entityId",
  match: { entityType: "plan", type: "gallery", isActive: true, deletedAt: null },
  options: { sort: { position: 1 } },
});

export default mongoose.model("Plan", planSchema);
