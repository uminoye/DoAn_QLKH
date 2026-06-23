const errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', err.stack || err.message);

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ.',
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      message: 'Dữ liệu đã tồn tại (trùng lặp).',
      errors: err.errors.map(e => ({ field: e.path, message: e.message })),
    });
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      message: 'Tham chiếu không hợp lệ. Dữ liệu liên quan không tồn tại.',
    });
  }

  if (err.statusCode) {
    return res.status(err.statusCode).json({ message: err.message });
  }

  res.status(500).json({ message: 'Lỗi server nội bộ.' });
};

module.exports = { errorHandler };
