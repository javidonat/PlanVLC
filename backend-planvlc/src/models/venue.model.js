import mongoose from "mongoose";
import { VENUE_STATUSES } from "./constants.js";

const { Schema } = mongoose;

// Sitio físico donde ocurre un plan: sala, estadio, playa, recinto...
// Se separa de Plan porque un mismo sitio acoge muchos planes.
const venueSchema = new Schema(
  {
    name: { type: String, required: [true, "El nombre es obligatorio"], trim: true },
    address: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "Valencia" },
    province: { type: String, trim: true, default: "Valencia" },
    neighborhood: { type: String, trim: true, default: "" }, // ej. Ruzafa (útil para filtrar)
    postalCode: { type: String, trim: true, default: "" },
    capacity: { type: Number, min: [0, "El aforo no puede ser negativo"], default: null },

    // GeoJSON (opcional): permite búsquedas por cercanía. Orden: [longitud, latitud]
    location: {
      type: { type: String, enum: ["Point"] },
      coordinates: {
        type: [Number],
        default: undefined, // sin esto Mongoose guardaría [] y el índice 2dsphere daría error
        validate: {
          validator: (c) => c === undefined || c.length === 2,
          message: "Las coordenadas deben ser [longitud, latitud]",
        },
      },
    },
    // Las fotos (portada y galería) viven en "images" (entityType "venue")

    status: {
      type: String,
      enum: { values: VENUE_STATUSES, message: "El estado '{VALUE}' no es válido" },
      default: "open",
    },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

venueSchema.index({ location: "2dsphere" });

export default mongoose.model("Venue", venueSchema);
