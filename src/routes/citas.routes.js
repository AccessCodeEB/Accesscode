import express from "express";
import {
  getCitas,
  getCitaById,
  createCita,
  updateCita,
  deleteCita,
} from "../controllers/citas.controller.js";

const router = express.Router();

router.get("/", getCitas);
router.get("/:id", getCitaById);
router.post("/", createCita);
router.put("/:id", updateCita);
router.patch("/:id", updateCita); // alias: partial update (e.g. only estatus)
router.delete("/:id", deleteCita);

export default router;