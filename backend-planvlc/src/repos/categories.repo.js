import { Category } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Virtual: la portada se busca en "images" por entityId (hay que seleccionarlo para poder emparejarla)
const POPULATE = [{ path: "coverImage", select: "url alt entityId" }];

// SOLO ACTIVOS (y no eliminados): son los que se pueden asignar a un plan.
// Solo los campos que necesita el formulario del plan (los mismos que el populate de plans.repo.js)
const findActive = () => {
  return Category.find({ isActive: true, deletedAt: null }).select("name slug").sort({ name: 1 }).lean();
};

// TODAS: sin ningún filtro
const findAll = () => {
  return Category.find().populate(POPULATE).sort({ name: 1 }).lean();
};

// SOLO ELIMINADAS (soft delete)
const findDeleted = () => {
  return Category.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ name: 1 }).lean();
};

const findById = (id) => {
  return Category.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

// Crea una categoría (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const category = await Category.create(data);
  return category.populate(POPULATE);
};

const update = (id, data) => {
  return Category.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a categorías aún no eliminadas (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Category.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar una categoría desactivada),
// pero SÍ por deletedAt: una categoría eliminada no se puede reactivar nunca
const setActive = (id, data) => {
  return Category.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe la categoría, esté activa, desactivada o eliminada?
const existsById = async (id) => {
  return Boolean(await Category.exists({ _id: id }));
};

// ¿Existe ya otra categoría con ese slug? (también las desactivadas y eliminadas: el índice único las incluye)
const slugExists = async (slug, excludeId) => {
  const filter = { slug };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Category.exists(filter));
};

export default {
  findActive, findAll, findDeleted, findById, create, update, softDelete, setActive, existsById, slugExists,
};
