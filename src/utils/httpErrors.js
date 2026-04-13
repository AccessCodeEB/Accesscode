export class HttpError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function badRequest(message, details) {
  return new HttpError(400, message, details);
}

export function notFound(message, details) {
  return new HttpError(404, message, details);
}

export function conflict(message, details) {
  return new HttpError(409, message, details);
}

export function isHttpError(err) {
  return err instanceof HttpError || Number.isInteger(err?.statusCode);
}

function getOracleErrorNum(err) {
  if (Number.isInteger(err?.errorNum)) {
    return err.errorNum;
  }

  const match = /ORA-(\d{5})/.exec(String(err?.message ?? ""));
  if (!match) return null;
  return Number(match[1]);
}

export function mapOracleError(err) {
  const errorNum = getOracleErrorNum(err);
  if (!errorNum) return null;

  if (errorNum === 1) {
    return conflict("Conflicto de datos: registro duplicado");
  }

  if (errorNum === 2291 || errorNum === 2292) {
    return conflict("Conflicto de integridad referencial");
  }

  if (errorNum === 1400) {
    return badRequest("Faltan campos obligatorios");
  }

  if (errorNum === 1722) {
    return badRequest("Formato numerico invalido");
  }

  if (errorNum === 1830 || errorNum === 1840 || errorNum === 1841) {
    return badRequest("Formato de fecha invalido");
  }

  return null;
}