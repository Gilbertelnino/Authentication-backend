const onSuccess = (res, status, message, data) => {
  return res.status(status).json({
    status,
    message,
    data,
  });
};
const onError = (res, status, error, data) => {
  return res.status(status).json({
    status,
    error,
    data,
  });
};

module.exports = { onError, onSuccess };
