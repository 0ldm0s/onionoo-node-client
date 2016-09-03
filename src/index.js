const got         = require('got');
const NodeCache   = require('node-cache');
const querystring = require('querystring');

const cache = new NodeCache();

const baseUrl   = 'https://onionoo.torproject.org';
const endpoints = [
  'summary',
  'details',
  'bandwidth',
  'weights',
  'clients',
  'uptime'
];

function checkResponseCache(response) {
  const cacheControl = response.headers['cache-control'];
  const maxAgeRegex = /max-age=(\d+)/;
  const maxAge = cacheControl && cacheControl.match(maxAgeRegex);
  return maxAge && maxAge[1];
}

module.exports = endpoints.reduce((onionoo, endpoint) => {
  onionoo[endpoint] = args => new Promise((resolve, reject) => {

    // Build query string (don't encode ':' for search filters)
    const qs = querystring.encode(args).replace('%3A', ':');

    // Build url
    const url = `${baseUrl}/${endpoint}?${qs}`;

    // Check for url in cache
    const cachedResult = cache.get(url);
    if(cachedResult) {
      resolve(cachedResult);
    } else {

      // Make request
      resolve(got(url, { json: true })
        .then(response => {

          // Cache response
          const ttl = checkResponseCache(response);
          if(ttl) {
            cache.set(url, response.body, ttl);
          }

          // Resolve response
          return response.body;
        }));
    }
  });

  return onionoo;
}, {});
