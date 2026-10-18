import { Plan } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Cambia los ids de las relaciones por sus datos básicos (como un JOIN de SQL)
const POPULATE = [
  { path: "categoryIds", select: "name slug" },
  { path: "organizerId", select: "name slug" },
  { path: "venueId", select: "name city neighborhood" },
  // Virtuals: las imágenes se buscan en "images" por entityId (hay que seleccionarlo para poder emparejarlas)
  { path: "coverImage", select: "url alt entityId" },
  { path: "galleryImages", select: "url alt position entityId" },
];

// TODOS: sin ningún filtro
const findAll = () => {
  return Plan.find().populate(POPULATE).sort({ nextSessionAt: 1 }).lean();
};

// SOLO ACTIVOS
const findActive = () => {
  return Plan.find({ isActive: true }).populate(POPULATE).sort({ nextSessionAt: 1 }).lean();
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return Plan.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ nextSessionAt: 1 }).lean();
};

const findById = (id) => {
  return Plan.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

const findBySlug = (slug) => {
  return Plan.findOne({ slug, isActive: true }).populate(POPULATE).lean();
};

// Crea un plan (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const plan = await Plan.create(data);
  return plan.populate(POPULATE);
};

const update = (id, data) => {
  return Plan.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a planes aún no eliminados (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Plan.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar un plan desactivado),
// pero SÍ por deletedAt: un plan eliminado no se puede reactivar nunca
const setActive = (id, data) => {
  return Plan.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe el plan, esté activo, desactivado o eliminado?
const existsById = async (id) => {
  return Boolean(await Plan.exists({ _id: id }));
};

// ¿Existe ya otro plan con ese slug? Cuenta también los desactivados,
// porque el índice único de MongoDB los incluye
const slugExists = async (slug, excludeId) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Plan.exists(filter));
};

export default {
  findAll, findActive, findDeleted, findById, findBySlug, create, update, softDelete, setActive, existsById, slugExists,
};
