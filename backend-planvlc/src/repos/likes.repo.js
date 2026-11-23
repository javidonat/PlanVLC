import { Like } from "../models/index.js";

// Consultas de likes (usuario ↔ plan)
const countByPlan = (planId) => Like.countDocuments({ planId });

const exists = async (userId, planId) => Boolean(await Like.exists({ userId, planId }));

// Ids de los planes a los que el usuario ha dado like
const findPlanIdsByUser = async (userId) => (await Like.find({ userId }).select("planId").lean()).map((like) => like.planId);

const create = (userId, planId) => Like.create({ userId, planId });

// Devuelve true si había like y se ha quitado
const remove = async (userId, planId) => (await Like.deleteOne({ userId, planId })).deletedCount > 0;

export default { countByPlan, exists, findPlanIdsByUser, create, remove };
