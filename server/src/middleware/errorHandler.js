export function notFound(req, res, next) {
  res.status(404).json({ success:false, error: 'Not Found' });
}

export function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error('Error:', err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ success:false, error: err.message || 'Server Error' });
}
