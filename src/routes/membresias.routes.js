import express from "express";
import {
  createMembresia,
  getMembresiaStatus,
  validarMembresiaActiva,
} from "../controllers/membresias.controller.js";
import { verifyToken, checkRole } from "../middleware/auth.js";

const router = express.Router();

router.post("/",            verifyToken, checkRole(1, 2), createMembresia);
router.get("/:curp/activa", verifyToken,                  validarMembresiaActiva);
router.get("/:curp",        verifyToken,                  getMembresiaStatus);

export default router;

