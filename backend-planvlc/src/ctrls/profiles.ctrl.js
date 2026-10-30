import profilesService from "../services/profiles.service.js";

// GET /api/profiles
const getProfiles = async (_req, res, next) => {
  try {
    const profiles = await profilesService.getAllProfiles();
    res.status(200).json({ ok: true, total: profiles.length, data: profiles });
  } catch (error) {
    next(error);
  }
};

// GET /api/profiles/:userId
const getProfile = async (req, res, next) => {
  try {
    const profile = await profilesService.getProfile(req.params.userId);
    res.status(200).json({ ok: true, data: profile });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/profiles/:userId
const patchProfile = async (req, res, next) => {
  try {
    const profile = await profilesService.updateProfile(req.params.userId, req.body);
    res.status(200).json({ ok: true, message: "Perfil modificado correctamente", data: profile });
  } catch (error) {
    next(error);
  }
};

export default { getProfiles, getProfile, patchProfile };
