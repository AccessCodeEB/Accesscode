import { Router } from "express";
import * as BeneficiarioController from "../controllers/beneficiarios.controller.js";

const router = Router();

router.get("/",      BeneficiarioController.getAll);
router.get("/:curp",   BeneficiarioController.getById);
router.post("/",       BeneficiarioController.create);
router.put("/:curp",   BeneficiarioController.update);
router.delete("/:curp", BeneficiarioController.deactivate);

export default router;
