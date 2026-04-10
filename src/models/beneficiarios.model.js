import { getConnection } from "../config/db.js";

export async function findAll() {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT NOMBRES, APELLIDO_PATERNO, APELLIDO_MATERNO,
              CURP, GENERO, FECHA_NACIMIENTO, TIPO_SANGRE,
              TELEFONO_CELULAR, CORREO_ELECTRONICO, ESTATUS
       FROM BENEFICIARIOS
       ORDER BY APELLIDO_PATERNO`
    );
    return result.rows;
  } finally {
    await conn.close();
  }
}

export async function findById(curp) {
  const conn = await getConnection();
  try {
    const result = await conn.execute(
      `SELECT * FROM BENEFICIARIOS WHERE CURP = :curp`,
      { curp }
    );
    return result.rows[0] ?? null;
  } finally {
    await conn.close();
  }
}

export async function create(data) {
  const conn = await getConnection();
  try {
    await conn.execute(
      `INSERT INTO BENEFICIARIOS (
         NOMBRES, APELLIDO_PATERNO, APELLIDO_MATERNO, CURP,
         FECHA_NACIMIENTO, GENERO, NOMBRE_PADRE_MADRE,
         CALLE, COLONIA, CIUDAD, MUNICIPIO, ESTADO, CP,
         TELEFONO_CASA, TELEFONO_CELULAR, CORREO_ELECTRONICO,
         CONTACTO_EMERGENCIA, TELEFONO_EMERGENCIA,
         MUNICIPIO_NACIMIENTO, HOSPITAL_NACIMIENTO,
         TIPO_SANGRE, USA_VALVULA, NOTAS, ESTATUS
       ) VALUES (
         :nombres, :apellidoPaterno, :apellidoMaterno, :curp,
         TO_DATE(:fechaNacimiento, 'YYYY-MM-DD'), :genero, :nombrePadreMadre,
         :calle, :colonia, :ciudad, :municipio, :estado, :cp,
         :telefonoCasa, :telefonoCelular, :correoElectronico,
         :contactoEmergencia, :telefonoEmergencia,
         :municipioNacimiento, :hospitalNacimiento,
         :tipoSangre, :usaValvula, :notas, :estatus
       )`,
      data,
      { autoCommit: true }
    );
  } finally {
    await conn.close();
  }
}

export async function update(curp, data) {
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE BENEFICIARIOS SET
         NOMBRES               = :nombres,
         APELLIDO_PATERNO      = :apellidoPaterno,
         APELLIDO_MATERNO      = :apellidoMaterno,
         FECHA_NACIMIENTO      = TO_DATE(:fechaNacimiento, 'YYYY-MM-DD'),
         GENERO                = :genero,
         NOMBRE_PADRE_MADRE    = :nombrePadreMadre,
         CALLE                 = :calle,
         COLONIA               = :colonia,
         CIUDAD                = :ciudad,
         MUNICIPIO             = :municipio,
         ESTADO                = :estado,
         CP                    = :cp,
         TELEFONO_CASA         = :telefonoCasa,
         TELEFONO_CELULAR      = :telefonoCelular,
         CORREO_ELECTRONICO    = :correoElectronico,
         CONTACTO_EMERGENCIA   = :contactoEmergencia,
         TELEFONO_EMERGENCIA   = :telefonoEmergencia,
         MUNICIPIO_NACIMIENTO  = :municipioNacimiento,
         HOSPITAL_NACIMIENTO   = :hospitalNacimiento,
         TIPO_SANGRE           = :tipoSangre,
         USA_VALVULA           = :usaValvula,
         NOTAS                 = :notas,
         ESTATUS               = :estatus
       WHERE CURP = :curp`,
      { ...data, curp },
      { autoCommit: true }
    );
  } finally {
    await conn.close();
  }
}

export async function deactivate(curp) {
  const conn = await getConnection();
  try {
    await conn.execute(
      `UPDATE BENEFICIARIOS SET ESTATUS = 'Baja' WHERE CURP = :curp`,
      { curp },
      { autoCommit: true }
    );
  } finally {
    await conn.close();
  }
}
