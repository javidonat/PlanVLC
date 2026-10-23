import mongoose from "mongoose";
import sessionsRepo from "../repos/sessions.repo.js";
import plansRepo from "../repos/plans.repo.js";
import AppError from "./utils/AppError.js";
import { generateUniqueSku } from "./utils/sku.js";

// El servicio contiene la lógica de negocio
// No sabe nada de HTTP (req, res), solo trabaja con datos

// Campos que se pueden enviar desde fuera (el resto se ignora)
// sku, isActive y deletedAt no están: los gestiona el servidor
const FIELDS = ["planId", "startDateTime", "endDateTime", "price", "capacity", "stock", "status"];

// ---------- Funciones auxiliares ----------

const validateId = (id) => {
  // Comprobamos que el id tiene formato válido de MongoDB antes de buscar
  if (!mongoose.isValidObjectId(id)) {
    throw new AppError("El id de la sesión no es válido", 400);
  }
};

// Se queda solo con los campos permitidos que vengan en el body
const pickFields = (body = {}) => {
  const data = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }
  return data;
};

// planId puede llegar poblado ({ _id, title... }) o solo como id
const planIdOf = (session) => session.planId?._id ?? session.planId;

// Reglas entre campos con los datos finales (lo que ya había + lo que se envía).
// Zod solo las comprueba si llegan los dos campos en la misma petición
const validateRules = (data) => {
  if (data.endDateTime && new Date(data.endDateTime) <= new Date(data.startDateTime)) {
    throw new AppError("La fecha de fin debe ser posterior a la de inicio", 400);
  }
  if (data.stock != null && data.capacity != null && data.stock > data.capacity) {
    throw new AppError("El stock no puede superar el aforo", 400);
  }
};

// Una sesión nueva (o a la que se le cambia la fecha) no puede empezar en el pasado
const validateStartDate = (startDateTime) => {
  if (startDateTime && new Date(startDateTime) < new Date()) {
    throw new AppError("La fecha de inicio no puede estar en el pasado", 400);
  }
};

// El aforo de la sesión no puede superar el del lugar donde se celebra el plan (si el lugar tiene aforo)
const validateVenueCapacity = (capacity, plan) => {
  const venueCapacity = plan?.venueId?.capacity;
  if (capacity != null && venueCapacity != null && capacity > venueCapacity) {
    throw new AppError(`El aforo no puede superar el del lugar (${venueCapacity} personas)`, 400);
  }
};

// Reglas de negocio con status: un plan cancelado o finalizado no tiene sesiones nuevas ni sesiones
// en borrador o publicadas (las que ya tenía se pueden cancelar, finalizar o editar)
const CLOSED_PLAN_STATUSES = ["cancelled", "finished"];
const OPEN_SESSION_STATUSES = ["draft", "published"];

const validatePlanStatus = (plan, message) => {
  if (CLOSED_PLAN_STATUSES.includes(plan?.status)) {
    const state = plan.status === "cancelled" ? "cancelado" : "finalizado";
    throw new AppError(`${message}: el plan está ${state}`, 400);
  }
};

// Recalcula los datos derivados del plan (priceFrom y nextSessionAt) a partir de sus próximas sesiones.
// Se llama cada vez que se crea, modifica, activa/desactiva o elimina una sesión
const updatePlanFromSessions = async (planId) => {
  const sessions = await sessionsRepo.findUpcomingByPlan(planId);
  if (sessions.length === 0) {
    await plansRepo.updateDerived(planId, { priceFrom: 0, nextSessionAt: null });
    return;
  }
  const priceFrom = Math.min(...sessions.map((s) => s.price));
  const nextSessionAt = new Date(Math.min(...sessions.map((s) => new Date(s.startDateTime).getTime())));
  await plansRepo.updateDerived(planId, { priceFrom, nextSessionAt });
};

// ---------- Operaciones ----------

const getAllSessions = async () => {
  return sessionsRepo.findAll();
};

const getActiveSessions = async () => {
  return sessionsRepo.findActive();
};

const getDeletedSessions = async () => {
  return sessionsRepo.findDeleted();
};

// GET /:id
const getSessionById = async (id) => {
  validateId(id);

  const session = await sessionsRepo.findById(id);
  if (!session) {
    throw new AppError("Sesión no encontrada", 404);
  }
  return session;
};

// POST: crea una sesión nueva. El SKU se genera a partir del plan y la fecha de inicio
const createSession = async (body) => {
  const data = pickFields(body);
  validateRules(data);
  validateStartDate(data.startDateTime);

  const plan = await plansRepo.findSlugById(data.planId);
  if (!plan) {
    throw new AppError("El plan indicado no existe", 400);
  }
  if (!plan.isActive) {
    throw new AppError("El plan indicado está desactivado", 400);
  }
  validatePlanStatus(plan, "No se pueden crear sesiones");
  validateVenueCapacity(data.capacity, plan);

  // Si no se indica el stock (o llega vacío), al crearla todas las plazas están libres (stock = aforo)
  if (data.stock == null) {
    data.stock = data.capacity ?? null;
  }

  const sku = await generateUniqueSku(plan.slug, data.startDateTime);
  const session = await sessionsRepo.create({ ...data, sku });
  await updatePlanFromSessions(data.planId);
  return session;
};

// PATCH /:id: modifica solo los campos que se envían y deja el resto igual
const updateSession = async (id, body) => {
  validateId(id);

  const data = pickFields(body);
  delete data.planId; // una sesión no se cambia de plan
  if (Object.keys(data).length === 0) {
    throw new AppError("No se ha enviado ningún campo válido para modificar", 400);
  }

  const current = await sessionsRepo.findById(id);
  if (!current) {
    throw new AppError("Sesión no encontrada", 404);
  }
  validateRules({ ...current, ...data });
  validateStartDate(data.startDateTime); // solo si se cambia la fecha (se pueden editar sesiones ya pasadas)
  if (OPEN_SESSION_STATUSES.includes(data.status)) {
    validatePlanStatus(current.planId, "No se puede poner la sesión en borrador ni publicarla");
  }

  // Si cambia el aforo, se comprueba con el del lugar del plan
  if (data.capacity != null) {
    validateVenueCapacity(data.capacity, await plansRepo.findSlugById(planIdOf(current)));
  }

  // Si cambia la fecha de inicio, cambia el SKU
  const startChanged =
    data.startDateTime && new Date(data.startDateTime).getTime() !== new Date(current.startDateTime).getTime();
  if (startChanged && current.planId?.slug) {
    data.sku = await generateUniqueSku(current.planId.slug, data.startDateTime);
  }

  const session = await sessionsRepo.update(id, data);
  if (!session) {
    throw new AppError("Sesión no encontrada", 404);
  }
  await updatePlanFromSessions(planIdOf(session));
  return session;
};

// PATCH /:id/active: activa o desactiva la sesión
const setActive = async (id, body) => {
  validateId(id);

  if (typeof body?.isActive !== "boolean") {
    throw new AppError("isActive es obligatorio y debe ser true o false", 400);
  }

  // No se puede activar una sesión de un plan desactivado
  if (body.isActive) {
    const current = await sessionsRepo.findAnyById(id);
    const plan = current && (await plansRepo.findSlugById(current.planId));
    if (current && !plan?.isActive) {
      throw new AppError("No se puede activar: su plan está desactivado. Activa el plan primero", 409);
    }
  }

  // El repositorio solo actualiza sesiones con deletedAt: null (una eliminada no se reactiva)
  const session = await sessionsRepo.setActive(id, { isActive: body.isActive });
  if (session) {
    await updatePlanFromSessions(planIdOf(session));
    return session;
  }

  // No se ha actualizado nada: o no existe, o está eliminada
  if (await sessionsRepo.existsById(id)) {
    throw new AppError("La sesión está eliminada y no se puede activar ni desactivar", 409);
  }
  throw new AppError("Sesión no encontrada", 404);
};

// PATCH /:id/softdelete: isActive = false y deletedAt = ahora (el documento no se borra)
const softDeleteSession = async (id) => {
  validateId(id);

  const session = await sessionsRepo.softDelete(id);
  if (!session) {
    throw new AppError("Sesión no encontrada", 404);
  }
  await updatePlanFromSessions(planIdOf(session));
  return session;
};

export default {
  getAllSessions,
  getActiveSessions,
  getDeletedSessions,
  getSessionById,
  createSession,
  updateSession,
  setActive,
  softDeleteSession,
};
