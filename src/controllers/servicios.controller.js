import * as ServiciosService from "../services/servicios.service.js";
import { badRequest, notFound } from "../utils/httpErrors.js";

export async function getByCurp(req, res, next) {
  try {
    const { curp } = req.params;
    
    if (!curp) {
      throw badRequest("CURP requerido");
    }

    const servicios = await ServiciosService.getByCurp(curp);
    
    if (!servicios || servicios.length === 0) {
      throw notFound("No hay servicios registrados para este beneficiario");
    }

    res.json({
      curp,
      total: servicios.length,
      servicios
    });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { curp, idTipoServicio, costo, montoPagado, referenciaId, referenciaTipo, notas } = req.body;

    // Validar campos requeridos
    if (!curp || !idTipoServicio || costo === undefined) {
      throw badRequest("CURP, idTipoServicio y costo son requeridos");
    }

    // Validar que costo sea número positivo
    if (isNaN(costo) || costo < 0) {
      throw badRequest("Costo debe ser un número positivo");
    }

    const resultado = await ServiciosService.createConValidacion({
      curp,
      idTipoServicio,
      costo,
      montoPagado: montoPagado || 0,
      referenciaId: referenciaId || null,
      referenciaTipo: referenciaTipo || null,
      notas: notas || null
    });

    res.status(201).json(resultado);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const { idServicio } = req.params;

    if (!idServicio) {
      throw badRequest("ID de servicio requerido");
    }

    const servicio = await ServiciosService.getById(idServicio);

    if (!servicio) {
      throw notFound("Servicio no encontrado");
    }

    res.json(servicio);
  } catch (err) {
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const { idServicio } = req.params;
    const { montoPagado, notas } = req.body;

    if (!idServicio) {
      throw badRequest("ID de servicio requerido");
    }

    // Validar que el servicio existe
    const servicio = await ServiciosService.getById(idServicio);
    if (!servicio) {
      throw notFound("Servicio no encontrado");
    }

    // Actualizar solo campos permitidos
    await ServiciosService.update(idServicio, {
      montoPagado: montoPagado !== undefined ? montoPagado : servicio.MONTO_PAGADO,
      notas: notas !== undefined ? notas : servicio.NOTAS
    });

    res.json({ message: "Servicio actualizado exitosamente" });
  } catch (err) {
    next(err);
  }
}

export async function deleteById(req, res, next) {
  try {
    const { idServicio } = req.params;

    if (!idServicio) {
      throw badRequest("ID de servicio requerido");
    }

    // Validar que el servicio existe
    const servicio = await ServiciosService.getById(idServicio);
    if (!servicio) {
      throw notFound("Servicio no encontrado");
    }

    await ServiciosService.deleteById(idServicio);

    res.json({ message: "Servicio eliminado exitosamente" });
  } catch (err) {
    next(err);
  }
}
