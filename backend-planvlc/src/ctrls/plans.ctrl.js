import plansService from "../services/plans.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/plans
const getPlans = async (req, res, next) => {
  try {
    const plans = await plansService.getAllPlans();
    res.status(200).json({ ok: true, total: plans.length, data: plans });
  } catch (error) {
    next(error); // Pasa el error al middleware de errores
  }
};

// GET /api/plans/active
const getActivePlans = async (req, res, next) => {
  try {
    const plans = await plansService.getActivePlans();
    res.status(200).json({ ok: true, total: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

// GET /api/plans/deleted
const getDeletedPlans = async (req, res, next) => {
  try {
    const plans = await plansService.getDeletedPlans();
    res.status(200).json({ ok: true, total: plans.length, data: plans });
  } catch (error) {
    next(error);
  }
};

// GET /api/plans/slug/:slug
const getPlanBySlug = async (req, res, next) => {
  try {
    const plan = await plansService.getPlanBySlug(req.params.slug);
    res.status(200).json({ ok: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// GET /api/plans/:id
const getPlanById = async (req, res, next) => {
  try {
    const plan = await plansService.getPlanById(req.params.id);
    res.status(200).json({ ok: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// POST /api/plans
const postPlan = async (req, res, next) => {
  try {
    const plan = await plansService.createPlan(req.body);
    res.status(201).json({ ok: true, message: "Plan creado correctamente", data: plan });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/plans/:id
const patchPlan = async (req, res, next) => {
  try {
    const plan = await plansService.updatePlan(req.params.id, req.body);
    res.status(200).json({ ok: true, message: "Plan modificado correctamente", data: plan });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/plans/:id/active
const patchActive = async (req, res, next) => {
  try {
    const plan = await plansService.setActive(req.params.id, req.body);
    res.status(200).json({
      ok: true,
      message: plan.isActive ? "Plan activado correctamente" : "Plan desactivado correctamente",
      data: plan,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/plans/:id/softdelete
const patchSoftDelete = async (req, res, next) => {
  try {
    const plan = await plansService.softDeletePlan(req.params.id);
    res.status(200).json({ ok: true, message: "Plan eliminado correctamente", data: plan });
  } catch (error) {
    next(error);
  }
};

export default {
  getPlans, getActivePlans, getDeletedPlans, getPlanBySlug, getPlanById, postPlan, patchPlan, patchActive, patchSoftDelete,
};
