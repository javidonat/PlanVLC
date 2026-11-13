import shopService from "../services/shop.service.js";

// El controlador recibe la petición HTTP y devuelve la respuesta JSON
// No contiene lógica de negocio, solo llama al servicio

// GET /api/shop/categories
const getCategories = async (_req, res, next) => {
  try {
    const categories = await shopService.getCategories();
    res.status(200).json({ ok: true, total: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

// GET /api/shop/organizers
const getOrganizers = async (_req, res, next) => {
  try {
    const organizers = await shopService.getOrganizers();
    res.status(200).json({ ok: true, total: organizers.length, data: organizers });
  } catch (error) {
    next(error);
  }
};

// GET /api/shop/venues
const getVenues = async (_req, res, next) => {
  try {
    const venues = await shopService.getVenues();
    res.status(200).json({ ok: true, total: venues.length, data: venues });
  } catch (error) {
    next(error);
  }
};

// GET /api/shop/plans?category=&organizer=&venue=&minPrice=&maxPrice=&search=&sort=&page=&limit=
const getPlans = async (req, res, next) => {
  try {
    const { items, total, page, limit, totalPages } = await shopService.getPlans(req.query);
    res.status(200).json({ ok: true, total, page, limit, totalPages, data: items });
  } catch (error) {
    next(error);
  }
};

// GET /api/shop/sessions?month=&category=&organizer=&venue=&minPrice=&maxPrice=&search=
const getSessions = async (req, res, next) => {
  try {
    const { month, items } = await shopService.getSessions(req.query);
    res.status(200).json({ ok: true, month, total: items.length, data: items });
  } catch (error) {
    next(error);
  }
};

// GET /api/shop/plans/:slug
const getPlanBySlug = async (req, res, next) => {
  try {
    const plan = await shopService.getPlanBySlug(req.params.slug);
    res.status(200).json({ ok: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// GET /api/shop/plans/:slug/sessions
const getPlanSessions = async (req, res, next) => {
  try {
    const sessions = await shopService.getPlanSessions(req.params.slug);
    res.status(200).json({ ok: true, total: sessions.length, data: sessions });
  } catch (error) {
    next(error);
  }
};

export default { getCategories, getOrganizers, getVenues, getPlans, getSessions, getPlanBySlug, getPlanSessions };
