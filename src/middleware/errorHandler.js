import { isHttpError, mapOracleError, notFound } from "../utils/httpErrors.js";

export function notFoundHandler(req, res, next) {
  next(notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, next) {
  const mappedError = isHttpError(err) ? err : mapOracleError(err);

  const statusCode = mappedError?.statusCode ?? 500;
  const message = mappedError?.message ?? "Internal Server Error";

  if (statusCode >= 500) {
    console.error(err);
  }

  const response = { error: message };
  if (mappedError?.details) {
    response.details = mappedError.details;
  }

  res.status(statusCode).json(response);
}