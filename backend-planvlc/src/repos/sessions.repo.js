import { Session } from "../models/index.js";

// El repositorio es la única capa que habla con MongoDB directamente

// Cambia el id del plan por sus datos básicos (como un JOIN de SQL)
const POPULATE = [{ path: "planId", select: "title slug status isActive" }];

// TODAS: sin ningún filtro
const findAll = () => {
  return Session.find().populate(POPULATE).sort({ startDateTime: 1 }).lean();
};

// SOLO ACTIVAS
const findActive = () => {
  return Session.find({ isActive: true }).populate(POPULATE).sort({ startDateTime: 1 }).lean();
};

// SOLO ELIMINADAS (soft delete)
const findDeleted = () => {
  return Session.find({ deletedAt: { $ne: null } }).populate(POPULATE).sort({ startDateTime: 1 }).lean();
};

const findById = (id) => {
  return Session.findOne({ _id: id, isActive: true }).populate(POPULATE).lean();
};

// Sesiones que cuentan para el precio y la próxima fecha del plan:
// activas, no eliminadas, no canceladas y que todavía no han empezado
const findUpcomingByPlan = (planId) => {
  return Session.find({
    planId,
    isActive: true,
    deletedAt: null,
    status: { $ne: "cancelled" },
    startDateTime: { $gte: new Date() },
  })
    .select("price startDateTime")
    .lean();
};

// Crea una sesión (Mongoose valida los campos según el modelo y aplica los valores por defecto)
const create = async (data) => {
  const session = await Session.create(data);
  return session.populate(POPULATE);
};

const update = (id, data) => {
  return Session.findOneAndUpdate({ _id: id, isActive: true, deletedAt: null }, data, {
    new: true,
    runValidators: true,
  })
    .populate(POPULATE)
    .lean();
};

// SOFT DELETE: no se borra el documento, se desactiva y se marca la fecha.
// Solo afecta a sesiones aún no eliminadas (deletedAt: null), así la fecha original nunca se pisa
const softDelete = (id) => {
  return Session.findOneAndUpdate(
    { _id: id, deletedAt: null },
    { isActive: false, deletedAt: new Date() },
    { new: true }
  )
    .populate(POPULATE)
    .lean();
};

// Para activar/desactivar: no filtra por isActive (hay que poder reactivar una sesión desactivada),
// pero SÍ por deletedAt: una sesión eliminada no se puede reactivar nunca
const setActive = (id, data) => {
  return Session.findOneAndUpdate({ _id: id, deletedAt: null }, data, { new: true }).populate(POPULATE).lean();
};

// ¿Existe la sesión, esté activa, desactivada o eliminada?
const existsById = async (id) => {
  return Boolean(await Session.exists({ _id: id }));
};

// ¿Cuántas sesiones no eliminadas tiene este plan? (para no dejar sesiones de un plan borrado)
const countByPlan = (planId) => {
  return Session.countDocuments({ planId, deletedAt: null });
};

// ¿Existe ya otra sesión con ese SKU? Cuenta también las desactivadas y eliminadas,
// porque el índice único de MongoDB las incluye
const skuExists = async (sku, excludeId) => {
  const filter = { sku };
  if (excludeId) filter._id = { $ne: excludeId };
  return Boolean(await Session.exists(filter));
};

export default {
  findAll, findActive, findDeleted, findById, findUpcomingByPlan, create, update, softDelete, setActive, existsById, skuExists, countByPlan,
};
