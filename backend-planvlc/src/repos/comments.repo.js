import mongoose from "mongoose";
import { Comment, Plan } from "../models/index.js";

// Consultas de comentarios. Solo cuentan los visibles: activos y no eliminados
const VISIBLE = { isActive: true, deletedAt: null };
const VISIBLE_PLAN = { status: "published", isActive: true, deletedAt: null };

// Autor del comentario: su nombre y el avatar de su perfil
const AUTHOR = { path: "userId", select: "name", populate: { path: "profile", select: "avatar" } };

// ¿Existe el plan y se ve en la tienda? (solo se puede comentar en esos)
const planIsVisible = async (planId) => Boolean(await Plan.exists({ _id: planId, ...VISIBLE_PLAN }));

// Comentarios de un plan, los más nuevos primero. Con page y limit, solo esa página
const findByPlan = async (planId, { page, limit }) => {
  const filter = { planId, ...VISIBLE };
  const query = Comment.find(filter).populate(AUTHOR).sort({ createdAt: -1 }).lean();
  if (!page) return { items: await query, total: null };
  const [items, total] = await Promise.all([query.skip((page - 1) * limit).limit(limit), Comment.countDocuments(filter)]);
  return { items, total };
};

// Media de valoraciones y número de comentarios de un plan
const statsByPlan = async (planId) => {
  const [stats] = await Comment.aggregate([
    { $match: { planId: new mongoose.Types.ObjectId(String(planId)), ...VISIBLE } },
    { $group: { _id: null, count: { $sum: 1 }, average: { $avg: "$rating" } } },
  ]);
  return { count: stats?.count ?? 0, average: stats ? Math.round(stats.average * 10) / 10 : null };
};

// Panel admin: por cada plan con comentarios, cuántos tiene, su media y el último. Los que más tienen primero
const summaryByPlan = () => {
  return Comment.aggregate([
    { $match: VISIBLE },
    { $group: { _id: "$planId", count: { $sum: 1 }, average: { $avg: "$rating" }, lastCommentAt: { $max: "$createdAt" } } },
    { $lookup: { from: "plans", localField: "_id", foreignField: "_id", as: "plan" } },
    { $unwind: "$plan" },
    {
      $project: {
        _id: 0,
        planId: "$_id",
        title: "$plan.title",
        slug: "$plan.slug",
        count: 1,
        average: { $round: ["$average", 1] },
        lastCommentAt: 1,
      },
    },
    { $sort: { count: -1, lastCommentAt: -1 } },
  ]);
};

const create = async (data) => {
  const comment = await Comment.create(data);
  return Comment.findById(comment._id).populate(AUTHOR).lean();
};

// Un comentario visible por su id (para comprobar de quién es antes de borrarlo)
const findById = (id) => Comment.findOne({ _id: id, ...VISIBLE }).lean();

const softDelete = (id) => {
  return Comment.updateOne({ _id: id, ...VISIBLE }, { isActive: false, deletedAt: new Date() });
};

export default { planIsVisible, findByPlan, statsByPlan, summaryByPlan, create, findById, softDelete };
