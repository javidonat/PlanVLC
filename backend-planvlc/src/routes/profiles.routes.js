import { Router } from "express";
import profilesCtrl from "../ctrls/profiles.ctrl.js";
import validate from "../middleware/validate.js";
import authenticate from "../middleware/authentication.js";
import { isAdmin, isOwnerOrAdmin } from "../middleware/authorization.js";
import { updateProfileSchema, userIdParamsSchema } from "../schemas/profiles.schema.js";

const router = Router();

// Todas necesitan token. Cada usuario solo ve y edita SU perfil; un admin, cualquiera (ABAC)
// GET    /api/profiles           → todos los perfiles (solo admin, para el panel)
// GET    /api/profiles/:userId   → perfil del usuario (vacío si aún no tiene)
// PATCH  /api/profiles/:userId   → modificar (firstName, lastName, phone, bio)

router.use(authenticate);

router.get("/", isAdmin, profilesCtrl.getProfiles);
router.get("/:userId", validate({ params: userIdParamsSchema }), isOwnerOrAdmin(), profilesCtrl.getProfile);
router.patch(
  "/:userId",
  validate({ params: userIdParamsSchema, body: updateProfileSchema }),
  isOwnerOrAdmin(),
  profilesCtrl.patchProfile
);

export default router;
