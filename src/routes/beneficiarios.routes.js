import { Router } from "express";
import * as BeneficiarioController from "../controllers/beneficiarios.controller.js";
import { verifyToken, checkRole } from "../middleware/auth.js";

const router = Router();

router.get("/",         verifyToken,                  BeneficiarioController.getAll);
router.get("/:curp",    verifyToken,                  BeneficiarioController.getById);
router.post("/",        verifyToken, checkRole(1, 2), BeneficiarioController.create);
router.put("/:curp",    verifyToken, checkRole(1, 2), BeneficiarioController.update);
router.delete("/:curp", verifyToken, checkRole(1),    BeneficiarioController.deactivate);

export default router;
