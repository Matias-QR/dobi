// Vercel API Route - Proxy to Dobi API
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { method, url, body } = req;
    
    // Extract the path from the request
    const apiPath = url.replace('/api/proxy', '');
    const targetUrl = `https://api-aleph.dobi.guru${apiPath}`;
    
    console.log(`🔄 Proxying ${method} ${apiPath} -> ${targetUrl}`);

    // Prepare fetch options
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      }
    };

    // Add body for POST/PUT requests
    if (body && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(body);
    }

    // Make request to Dobi API
    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();

    console.log(`✅ Proxy response: ${response.status} for ${apiPath}`);

    // Return the response
    return res.status(response.status).json(data);

  } catch (error) {
    console.error(`❌ Proxy error:`, error);
    
    return res.status(500).json({
      error: 'Proxy error',
      message: 'Failed to proxy request to Dobi API',
      details: error.message
    });
  }
}
