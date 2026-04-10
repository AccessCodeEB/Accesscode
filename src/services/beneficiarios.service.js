import * as BeneficiarioModel from "../models/beneficiarios.model.js";
import * as MembresiasModel from "../models/membresias.model.js";
import { AppError } from "../middleware/errorHandler.js";

const CURP_REGEX    = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
const EMAIL_REGEX   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL_REGEX     = /^\d{10}$/;
const CP_REGEX      = /^\d{5}$/;
const TIPOS_SANGRE  = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const CAMPOS_OBLIGATORIOS = [
  "nombres",
  "apellidoPaterno",
  "apellidoMaterno",
  "fechaNacimiento",
];

function sanitizar(data) {
  const campos = [
    "nombres", "apellidoPaterno", "apellidoMaterno",
    "nombrePadreMadre", "calle", "colonia", "ciudad",
    "municipio", "estado", "contactoEmergencia",
    "municipioNacimiento", "hospitalNacimiento",
  ];
  for (const campo of campos) {
    if (data[campo]) data[campo] = String(data[campo]).trim();
  }
  return data;
}

function validarCamposObligatorios(data) {
  const faltantes = CAMPOS_OBLIGATORIOS.filter(
    (campo) => !data[campo] || String(data[campo]).trim() === ""
  );
  if (faltantes.length > 0) {
    throw new AppError(
      `Campos obligatorios faltantes: ${faltantes.join(", ")}`,
      400
    );
  }
}

function validarCurp(curp) {
  if (!curp || !CURP_REGEX.test(curp)) {
    throw new AppError("CURP con formato inválido", 400);
  }
}

function validarFormatos(data) {
  if (data.correoElectronico && !EMAIL_REGEX.test(data.correoElectronico)) {
    throw new AppError("Formato de correo electrónico inválido", 400);
  }

  if (data.telefonoCelular && !TEL_REGEX.test(data.telefonoCelular)) {
    throw new AppError("TELEFONO_CELULAR debe contener exactamente 10 dígitos", 400);
  }

  if (data.telefonoCasa && !TEL_REGEX.test(data.telefonoCasa)) {
    throw new AppError("TELEFONO_CASA debe contener exactamente 10 dígitos", 400);
  }

  if (data.telefonoEmergencia && !TEL_REGEX.test(data.telefonoEmergencia)) {
    throw new AppError("TELEFONO_EMERGENCIA debe contener exactamente 10 dígitos", 400);
  }

  if (data.cp && !CP_REGEX.test(data.cp)) {
    throw new AppError("CP debe contener exactamente 5 dígitos", 400);
  }

  if (data.genero && !["M", "F"].includes(data.genero)) {
    throw new AppError("GENERO debe ser 'M' o 'F'", 400);
  }

  if (data.tipoSangre && !TIPOS_SANGRE.includes(data.tipoSangre)) {
    throw new AppError(`TIPO_SANGRE debe ser uno de: ${TIPOS_SANGRE.join(", ")}`, 400);
  }

  if (data.usaValvula && !["S", "N"].includes(data.usaValvula)) {
    throw new AppError("USA_VALVULA debe ser 'S' o 'N'", 400);
  }

  if (data.notas && data.notas.length > 500) {
    throw new AppError("NOTAS no puede superar los 500 caracteres", 400);
  }

  if (data.fechaNacimiento) {
    const fecha = new Date(data.fechaNacimiento);
    const hoy = new Date();
    const hace120Años = new Date();
    hace120Años.setFullYear(hoy.getFullYear() - 120);

    if (isNaN(fecha.getTime())) {
      throw new AppError("Formato de FECHA_NACIMIENTO inválido (use YYYY-MM-DD)", 400);
    }
    if (fecha > hoy) {
      throw new AppError("FECHA_NACIMIENTO no puede ser una fecha futura", 400);
    }
    if (fecha < hace120Años) {
      throw new AppError("FECHA_NACIMIENTO no puede ser hace más de 120 años", 400);
    }
  }
}

export const getAll = () => BeneficiarioModel.findAll();

export const getById = (curp) => BeneficiarioModel.findById(curp);

export async function create(data) {
  data = sanitizar(data);
  validarCurp(data.curp);
  validarCamposObligatorios(data);
  validarFormatos(data);

  const existente = await BeneficiarioModel.findById(data.curp);
  if (existente) {
    throw new AppError(`Ya existe un beneficiario con la CURP ${data.curp}`, 409);
  }

  data.estatus = "Activo";

  return BeneficiarioModel.create(data);
}

export async function update(curp, data) {
  validarCurp(curp);
  data = sanitizar(data);
  validarCamposObligatorios(data);
  validarFormatos(data);

  const existente = await BeneficiarioModel.findById(curp);
  if (!existente) {
    throw new AppError(`No existe un beneficiario con la CURP ${curp}`, 404);
  }

  if (existente.ESTATUS === "Baja") {
    throw new AppError(
      `No se puede modificar un beneficiario con estatus 'Baja'`,
      409
    );
  }

  data.estatus = existente.ESTATUS;

  return BeneficiarioModel.update(curp, data);
}

export async function deactivate(curp) {
  validarCurp(curp);

  const existente = await BeneficiarioModel.findById(curp);
  if (!existente) {
    throw new AppError(`No existe un beneficiario con la CURP ${curp}`, 404);
  }

  await BeneficiarioModel.deactivate(curp);
  await MembresiasModel.cancelarPorCurp(curp);
}
