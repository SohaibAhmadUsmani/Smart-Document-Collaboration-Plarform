export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    return next(error);
  }

  const status = error.status ?? 500;
  response.status(status).json({
    error: status === 500 ? console.error(error) : error.message
  });
 
}
