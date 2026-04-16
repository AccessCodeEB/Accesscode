import { Router } from "express";
import * as InventarioController from "../controllers/inventario.controller.js";
import { verifyToken, checkRole } from "../middleware/auth.js";

const router = Router();

router.post("/movimientos", verifyToken, checkRole(1, 2), InventarioController.createMovimiento);
router.get("/inventario",   verifyToken,                  InventarioController.getInventario);
router.get("/movimientos",  verifyToken,                  InventarioController.getMovimientos);

export default router;