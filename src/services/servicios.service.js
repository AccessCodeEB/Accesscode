import * as ServiciosModel from "../models/servicios.model.js";
import { conflict, notFound } from "../utils/httpErrors.js";

// Validar beneficiario activo y crear servicio
const ESTATUS_BLOQUEADOS = ["Inactivo", "Baja"];

export async function createConValidacion(data) {
  const beneficiario = await ServiciosModel.findBeneficiarioActivo(data.curp);

  if (!beneficiario) {
    throw notFound("Beneficiario no encontrado");
  }

  if (ESTATUS_BLOQUEADOS.includes(beneficiario.ESTATUS)) {
    throw new Error(
      `No se puede asignar un servicio a un beneficiario con estatus '${beneficiario.ESTATUS}'`
    );
  }

  await ServiciosModel.create(data);

  await ServiciosModel.insertHistorial({
    curp: data.curp,
    idServicio: data.idServicio || null,
    accion: "CREAR",
    detalles: `Servicio tipo ${data.idTipoServicio} creado`
  });

  return {
    message: "Servicio creado exitosamente",
    beneficiario: beneficiario.NOMBRES
  };
}

export const getByCurp = (curp) =>
  ServiciosModel.findByCurp(curp);

export const getByCurpPaginated = (curp, page, limit) =>
  ServiciosModel.findByCurpPaginated(curp, page, limit);

export const getById = (idServicio) =>
  ServiciosModel.findById(idServicio);

export const update = (idServicio, data) =>
  ServiciosModel.update(idServicio, data);

export const deleteById = (idServicio) =>
  ServiciosModel.deleteById(idServicio);
