async function invokeHandler(handler, request = {}) {
  const headers = {};
  let status = 200;
  let body;

  const response = {
    setHeader(name, value) {
      headers[String(name).toLowerCase()] = value;
      return response;
    },
    status(code) {
      status = code;
      return response;
    },
    json(value) {
      body = value;
      return response;
    },
    send(value) {
      body = value;
      return response;
    },
    end(value) {
      if (value !== undefined) body = value;
      return response;
    }
  };

  await handler({
    body: {},
    headers: {},
    method: 'GET',
    params: {},
    query: {},
    socket: {},
    ...request
  }, response);

  return { status, headers, body };
}

module.exports = { invokeHandler };
