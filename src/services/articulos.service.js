import * as ArticulosModel from "../models/articulos.model.js";
import * as InventarioService from "./inventario.service.js";
import { badRequest } from "../utils/httpErrors.js";

function normalizeData(data = {}) {
  const normalized = {
    idArticulo: data.idArticulo ?? null,
    descripcion: data.descripcion ?? null,
    unidad: data.unidad ?? null,
    cuotaRecuperacion: data.cuotaRecuperacion ?? null,
    inventarioActual: data.inventarioActual ?? null,
    manejaInventario: data.manejaInventario ?? null,
    idCategoria: data.idCategoria ?? null
  };

  if (normalized.manejaInventario !== null && normalized.manejaInventario !== undefined) {
    normalized.manejaInventario = String(normalized.manejaInventario).trim().toUpperCase();
    if (!["S", "N"].includes(normalized.manejaInventario)) {
      throw badRequest("manejaInventario debe ser 'S' o 'N'");
    }
  }

  if (normalized.cuotaRecuperacion !== null && normalized.cuotaRecuperacion !== undefined) {
    const cuota = Number(normalized.cuotaRecuperacion);
    if (Number.isNaN(cuota) || cuota < 0) {
      throw badRequest("cuotaRecuperacion debe ser un numero mayor o igual a 0");
    }
    normalized.cuotaRecuperacion = cuota;
  }

  if (normalized.inventarioActual !== null && normalized.inventarioActual !== undefined) {
    const inventario = Number(normalized.inventarioActual);
    if (Number.isNaN(inventario) || inventario < 0) {
      throw badRequest("inventarioActual debe ser un numero mayor o igual a 0");
    }
    normalized.inventarioActual = inventario;
  }

  if (normalized.idCategoria !== null && normalized.idCategoria !== undefined) {
    const categoria = Number(normalized.idCategoria);
    if (Number.isNaN(categoria)) {
      throw badRequest("idCategoria debe ser numerico");
    }
    normalized.idCategoria = categoria;
  }

  if (normalized.idArticulo !== null && normalized.idArticulo !== undefined) {
    const idArticulo = Number(normalized.idArticulo);
    if (Number.isNaN(idArticulo)) {
      throw badRequest("idArticulo debe ser numerico");
    }
    normalized.idArticulo = idArticulo;
  }

  return normalized;
}

export const getAll = () =>
  ArticulosModel.findAll();

export const getById = (id) =>
  ArticulosModel.findById(id);

export const create = (data) => {
  const normalized = normalizeData(data);

  if (normalized.idArticulo === null || normalized.idArticulo === undefined) {
    throw badRequest("idArticulo es obligatorio");
  }

  return ArticulosModel.create(normalized);
};

export const update = (id, data) =>
  ArticulosModel.update(id, normalizeData(data));

export async function deleteById(id) {
  await InventarioService.assertArticuloSinMovimientos(id);
  return ArticulosModel.deleteById(id);
}
