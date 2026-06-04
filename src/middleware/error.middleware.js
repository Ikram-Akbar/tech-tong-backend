export function notFoundHandler(_request, response) {
  response.status(404).json({ message: 'Route not found' });
}

export function errorHandler(error, _request, response, _next) {
  const statusCode = response.statusCode && response.statusCode !== 200 ? response.statusCode : 500;

  response.status(statusCode).json({
    message: error.message || 'Internal server error'
  });
}