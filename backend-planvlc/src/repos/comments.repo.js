import mongoose from "mongoose";
import { Comment } from "../models/index.js";

// Consultas de comentarios. Solo cuentan los visibles: activos y no eliminados
const VISIBLE = { isActive: true, deletedAt: null };

// Autor del comentario: su nombre y el avatar de su perfil
const AUTHOR = { path: "userId", select: "name", populate: { path: "profile", select: "avatar" } };


// Comentarios de un plan, los más nuevos primero. Con page y limit, solo esa página
const findByPlan = async (planId, { page, limit }) => {
  const filter = { planId, ...VISIBLE };
  const query = Comment.find(filter).populate(AUTHOR).sort({ createdAt: -1 }).lean();
  if (!page) return { items: await query, total: null };
  const [items, total] = await Promise.all([query.skip((page - 1) * limit).limit(limit), Comment.countDocuments(filter)]);
  return { items, total };
};

// Resumen de valoraciones de un plan: número, media, cuántas hay de cada estrella (5 a 1)
// y el porcentaje que lo recomienda (4 o 5 estrellas)
const statsByPlan = async (planId) => {
  const groups = await Comment.aggregate([
    { $match: { planId: new mongoose.Types.ObjectId(String(planId)), ...VISIBLE } },
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);
  const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const group of groups) distribution[group._id] = group.count;
  const count = groups.reduce((total, group) => total + group.count, 0);
  if (!count) return { count, average: null, distribution, recommendPercent: null };
  const sum = groups.reduce((total, group) => total + group._id * group.count, 0);
  return {
    count,
    average: Math.round((sum / count) * 10) / 10,
    distribution,
    recommendPercent: Math.round(((distribution[5] + distribution[4]) / count) * 100),
  };
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

export default { findByPlan, statsByPlan, summaryByPlan, create, findById, softDelete };
