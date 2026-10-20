import { Venue } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Virtuals: las fotos se buscan en "images" por entityId (hay que seleccionarlo para poder emparejarlas)
const POPULATE = [
  { path: "coverImage", select: "url alt entityId" },
  { path: "galleryImages", select: "url alt position entityId" },
];

// SOLO ACTIVOS (y no eliminados): son los que se pueden asignar a un plan.
// Solo los campos que necesita el formulario del plan (los mismos que el populate de plans.repo.js)
const findActive = () => {
  return Venue.find({ isActive: true, deletedAt: null }).select("name city neighborhood").sort({ name: 1 }).lean();
};

// TODOS: sin ningún filtro
const findAll = () => {
  return Venue.find().populate(POPULATE).sort({ name: 1 }).lean();
};

// SOLO ELIMINADOS (soft delete)
const findDeleted = () => {
  return Venue.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ name: 1 }).lean();
};

const findById = (id) => {
  return Venue.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

// Crea un lugar (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const venue = await Venue.create(data);
  return venue.populate(POPULATE);
};

const update = (id, data) => {
  return Venue.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a lugares aún no eliminados (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Venue.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar un lugar desactivado),
// pero SÍ por deletedAt: un lugar eliminado no se puede reactivar nunca
const setActive = (id, data) => {
  return Venue.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe el lugar, esté activo, desactivado o eliminado?
const existsById = async (id) => {
  return Boolean(await Venue.exists({ _id: id }));
};

export default {
  findActive, findAll, findDeleted, findById, create, update, softDelete, setActive, existsById,
};
