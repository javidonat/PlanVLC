import reviewsService from "../services/reviews.service.js";

// POST /api/ai/reviews-analysis
const postReviewsAnalysis = async (req, res, next) => {
  try {
    const data = await reviewsService.analyzeReviews(req.body);
    res.status(200).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

export default { postReviewsAnalysis };
