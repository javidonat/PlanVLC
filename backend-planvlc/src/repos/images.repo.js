import { Image } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// SOLO ACTIVOS (y no eliminados): son los que se pueden asignar a un plan.
// Solo los campos que necesita el formulario del plan (los mismos que el populate de plans.repo.js)
const findActive = () => {
  return Image.find({ isActive: true, deletedAt: null }).select("url alt").sort({ createdAt: 1 }).lean();
};

export default { findActive };
