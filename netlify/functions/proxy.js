const fetch = global.fetch;

exports.handler = async (event) => {
  const backendBase = process.env.BACKEND_URL || 'https://cryptovault-backend-1tft.onrender.com';
  const path = event.path.startsWith('/api') ? event.path : `/api${event.path}`;
  const query = event.rawQuery ? `?${event.rawQuery}` : '';
  const targetUrl = new URL(`${path}${query}`, backendBase);

  const headers = {};
  for (const [key, value] of Object.entries(event.headers || {})) {
    if (['host', 'content-length'].includes(key.toLowerCase())) continue;
    headers[key] = value;
  }

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
      },
      body: ''
    };
  }

  const response = await fetch(targetUrl, {
    method: event.httpMethod,
    headers,
    body: ['GET', 'HEAD'].includes(event.httpMethod) ? undefined : event.body
  });

  const responseBody = await response.text();

  return {
    statusCode: response.status,
    headers: {
      'Content-Type': response.headers.get('content-type') || 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    },
    body: responseBody
  };
};
