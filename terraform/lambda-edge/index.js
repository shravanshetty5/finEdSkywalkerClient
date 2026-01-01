/* eslint-disable */
const isRouteMatched = (request, routePath) => {
  // remove query string and anchor from uri to test
  const match = /^(.*)\?.*#.*|(.*)(?=\?|#)|(.*[^\?#])$/.exec(request.uri);
  const baseUriToCheck = match[1] || match[2] || match[3];
  
  // if route is a regexp path
  if (routePath instanceof RegExp) {
    return baseUriToCheck.match(routePath) !== null;
  }
  
  // if route is parameterized path
  if (routePath.indexOf(':') !== -1) {
    const decodeParameterValue = v => {
      return !isNaN(parseFloat(v)) && isFinite(v)
        ? Number.isInteger(v)
          ? Number.parseInt(v, 10)
          : Number.parseFloat(v)
        : v;
    };
    
    // figure out key names
    const keys = [];
    const keysRE = /:([^\/\?]+)\??/g;
    let keysMatch = keysRE.exec(routePath);
    while (keysMatch != null) {
      keys.push(keysMatch[1]);
      keysMatch = keysRE.exec(routePath);
    }
    
    // change parameterized path to regexp
    const regExpUri = routePath
      //                             :parameter?
      .replace(/\/:[^\/]+\?/g, '(?:/([^/]+))?')
      //                             :parameter
      .replace(/:[^\/]+/g, '([^/]+)')
      //                             escape all /
      .replace(/\//g, '\\/');
    
    // checks if uri match
    const routeMatch = baseUriToCheck.match(new RegExp(`^${regExpUri}$`));
    if (!routeMatch) {
      return false;
    }
    
    // update params in request with keys
    request.params = Object.assign(
      request.params,
      keys.reduce((acc, key, index) => {
        let value = routeMatch[index + 1];
        if (value) {
          value =
            value.indexOf(',') !== -1
              ? value.split(',').map(v => decodeParameterValue(v))
              : decodeParameterValue(value);
        }
        acc[key] = value;
        return acc;
      }, {})
    );
    return true;
  }
  
  // if route is a simple path
  return routePath === baseUriToCheck;
};

const routes = [
  // Dynamic ticker route
  {
    route: '/ticker/:ticker', // this is to match
    nextJsRoute: '/ticker/[ticker].html' // this is to route to
  }
];

const handler = async event => {
  // Extract information about the event/request
  const request = event.Records[0].cf.request;
  console.log(`Request URI: ${request.uri}`);

  // Match with any of the dynamic routes
  for (const route of routes) {
    request.params = request.params || {};
    if (isRouteMatched(request, route.route)) {
      request.uri = route.nextJsRoute;
      console.log(`Matched Route: ${route.route} -> ${request.uri}`);
      console.log(`Extracted params:`, JSON.stringify(request.params));
      return request;
    }
  }

  // Handle root path
  if (request.uri === '/') {
    request.uri = '/index.html';
    console.log(`Root path: ${request.uri}`);
    return request;
  }

  // All other routes should point to specific .html file
  // For example: /login -> /login.html and /search -> /search.html
  if (!request.uri.endsWith('.html') && !request.uri.includes('.')) {
    request.uri = `${request.uri}.html`;
    console.log(`Modified URI: ${request.uri}`);
  }

  return request;
};

exports.handler = handler;

