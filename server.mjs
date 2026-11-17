// A fixed-page web server for a fictional legacy museum site (demonstration only). It serves files from site/ that the
// route table names, for GET and HEAD only. It never reads a request body, runs no templates, scripts or shell, holds
// no secrets and writes nothing. Every file is read into memory at start-up, so the file system may be read-only.
import {createServer} from 'node:http';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SITE = join(dirname(fileURLToPath(import.meta.url)), 'site');

// The legacy look: an old server banner and no-cache headers, as the old platform sent them. The banner is text only.
export const BASE_HEADERS = {
  Server: 'Corvane-Dominion-HTTP/8.5.3',
  Expires: 'Tue, 01 Jan 1980 01:00:00 GMT',
  'Cache-Control': 'no-cache',
  'X-Robots-Tag': 'noindex',
};

const HOST = /^[a-z0-9.-]{1,253}(:[0-9]{1,5})?$/i;

/** The routing key of a request path: the path without its query, decoded, in lower case. */
export function pathKey(rawUrl) {
  const at = rawUrl.search(/[?#]/);
  const path = at < 0 ? rawUrl : rawUrl.slice(0, at);
  try {
    return decodeURI(path).toLowerCase();
  } catch {
    return path.toLowerCase();
  }
}

function entryFor(dir, r) {
  if (r.location) return {status: r.status, location: r.location};
  return {status: r.status, type: r.type, body: readFileSync(join(dir, r.file)), origin: r.origin === true};
}

export function loadSite(dir = SITE) {
  const table = JSON.parse(readFileSync(join(dir, 'routes.json'), 'utf8'));
  const routes = new Map(table.routes.map((r) => [pathKey(r.url), entryFor(dir, r)]));
  const html = 'text/html; charset=UTF-8';
  const page = (file, status) => ({status, type: html, body: readFileSync(join(dir, file))});
  return {routes, notFound: page(table.special.notFound, 404), method: page(table.special.method, 405)};
}

/** The response for a request target (the raw URL). The query string never changes the answer. */
export function resolve(site, rawUrl) {
  return site.routes.get(pathKey(rawUrl)) ?? site.notFound;
}

/** The public origin for robots.txt and sitemap.xml: PUBLIC_ORIGIN, else the Host header when it is a plain host name. */
export function originOf(req, env = process.env) {
  if (env.PUBLIC_ORIGIN) return env.PUBLIC_ORIGIN.replace(/\/+$/, '');
  const host = String(req.headers.host ?? '');
  const scheme = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  return HOST.test(host) ? `${scheme}://${host}` : 'http://localhost:8080';
}

function send(res, entry, headOnly, extra = {}) {
  res.writeHead(entry.status, {...BASE_HEADERS, ...extra, 'Content-Type': entry.type, 'Content-Length': entry.body.length});
  res.end(headOnly ? undefined : entry.body);
}

function redirect(res, entry) {
  res.writeHead(entry.status, {...BASE_HEADERS, Location: entry.location, 'Content-Length': 0});
  res.end();
}

function respond(req, res, entry) {
  const headOnly = req.method === 'HEAD';
  if (entry.location) return redirect(res, entry);
  if (!entry.origin) return send(res, entry, headOnly);
  const body = Buffer.from(entry.body.toString('utf8').replaceAll('{{ORIGIN}}', originOf(req)));
  return send(res, {...entry, body}, headOnly);
}

export function handler(site) {
  return (req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      // The body is never read: the connection closes after the answer.
      send(res, site.method, false, {Allow: 'GET, HEAD', Connection: 'close'});
      req.socket.destroySoon?.();
      return;
    }
    respond(req, res, resolve(site, req.url ?? '/'));
  };
}

export function start(port = Number(process.env.PORT ?? 8080)) {
  const server = createServer({requestTimeout: 10000, headersTimeout: 5000, maxHeaderSize: 8192}, handler(loadSite()));
  server.keepAliveTimeout = 5000;
  server.listen(port, '0.0.0.0', () => console.log(`legacy demo site on port ${port}`));
  const stop = () => server.close(() => process.exit(0));
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
  return server;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) start();
