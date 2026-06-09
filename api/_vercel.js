// Adapter: wraps a Netlify-style handler (returns {statusCode, headers, body})
// into a Vercel-style handler (req, res).
// This lets us keep all function logic identical to the Netlify versions.

module.exports = function vercelAdapter(netlifyHandler) {
  return async (req, res) => {
    // Vercel auto-parses JSON bodies — re-stringify so the body() helper can parse it
    const rawBody =
      req.body !== undefined
        ? typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body)
        : null;

    const event = {
      httpMethod:             req.method,
      queryStringParameters:  req.query || {},
      headers:                req.headers,
      body:                   rawBody,
    };

    const result = await netlifyHandler(event);

    if (result.headers) {
      Object.entries(result.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
    }

    res.status(result.statusCode);

    if (result.body) {
      res.send(result.body);
    } else {
      res.end();
    }
  };
};
