const apiResponse = (res, statusCode, success, data, message = null) => {
  const response = {
    success,
    data,
  };

  if (message) {
    response.message = message;
  }

  return res.status(statusCode).json(response);
};

export default apiResponse;
