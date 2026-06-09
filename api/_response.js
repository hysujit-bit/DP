// Shared response helpers with CORS headers for all functions.

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function ok(data, status = 200) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...CORS },
    body: JSON.stringify(data),
  };
}

function err(message, status = 400) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', ...CORS },
    body: JSON.stringify({ error: message }),
  };
}

// Pre-flight OPTIONS response
function preflight() {
  return { statusCode: 204, headers: CORS, body: '' };
}

function body(event) {
  try { return JSON.parse(event.body || '{}'); }
  catch { return {}; }
}

module.exports = { ok, err, preflight, body };
