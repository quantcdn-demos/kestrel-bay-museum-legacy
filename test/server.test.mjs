import {test, before, after} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdtempSync, readFileSync, readdirSync, statSync} from 'node:fs';
import {createServer, request} from 'node:http';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {handler, loadSite, originOf, pathKey, resolve} from '../server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const table = JSON.parse(readFileSync(join(ROOT, 'site/routes.json'), 'utf8'));
const pages = table.routes.filter((r) => r.type?.startsWith('text/html'));
const crawlable = pages.filter((r) => r.sitemap);
const redirects = table.routes.filter((r) => r.location);
const read = (r) => readFileSync(join(ROOT, 'site', r.file), 'utf8');
let server;
let port;

before(async () => {
  server = createServer(handler(loadSite()));
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  port = server.address().port;
});
after(() => server.close());

function call(method, path, {body, headers} = {}) {
  return new Promise((ok, fail) => {
    const req = request({host: '127.0.0.1', port, method, path, headers}, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => ok({status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks)}));
    });
    req.on('error', fail);
    if (body) req.write(body);
    req.end();
  });
}

test('every file route answers 200 with its content type and the legacy headers', async () => {
  for (const r of table.routes.filter((x) => x.file)) {
    const res = await call('GET', r.url);
    assert.equal(res.status, 200, r.url);
    assert.equal(res.headers['content-type'], r.type, r.url);
    assert.equal(res.headers.server, 'Corvane-Dominion-HTTP/8.5.3');
    assert.equal(res.headers['x-robots-tag'], 'noindex');
    assert.equal(res.headers['cache-control'], 'no-cache');
  }
});

test('the site has 24 crawlable pages (under the 25-page migration cap) and a search results page', () => {
  assert.equal(crawlable.length, 24);
  assert.equal(pages.length, 25);
});

test('collection pages follow /web/kbmm.nsf/<collection>/<slug>?OpenDocument with a clean slug', () => {
  const docs = crawlable.filter((r) => /\/(exhibitions|events|collection)\/(?!vw-all)/.test(r.url));
  assert.equal(docs.length, 16);
  for (const r of docs) assert.match(r.url, /^\/web\/kbmm\.nsf\/(exhibitions|events|collection)\/[a-z0-9]+(-[a-z0-9]+)*\?OpenDocument$/, r.url);
});

// The tag and class sequence of a page's #content, with the text left out.
const skeleton = (html) => html.slice(html.indexOf('<div id="content">'), html.indexOf('<div class="clear"></div>\n</div>\n<div id="footer">'))
  .match(/<[a-z0-9]+(?:\s+class="[^"]*")?/g).join(' ');

test('every page in a collection has the same markup structure', () => {
  for (const c of ['exhibitions', 'events', 'collection']) {
    const docs = crawlable.filter((r) => r.url.includes(`/${c}/`) && !r.url.includes('vw-all'));
    const shapes = new Set(docs.map((r) => skeleton(read(r))));
    assert.equal(shapes.size, 1, c);
  }
});

test('old addresses answer 301 to a current page, and none has a query', async () => {
  assert.ok(redirects.length >= 9 && redirects.length <= 13);
  const current = new Set(crawlable.map((r) => r.url));
  for (const r of redirects) {
    assert.doesNotMatch(r.url, /[?#]/);
    const res = await call('GET', r.url);
    assert.equal(res.status, 301, r.url);
    assert.equal(res.headers.location, r.location);
    assert.ok(current.has(r.location), r.location);
    assert.equal(res.body.length, 0);
  }
  assert.equal((await call('GET', '/')).headers.location, '/web/kbmm.nsf/home');
});

test('HEAD sends the headers and no body', async () => {
  const res = await call('HEAD', '/web/kbmm.nsf/home');
  assert.equal(res.status, 200);
  assert.equal(res.body.length, 0);
  assert.ok(Number(res.headers['content-length']) > 1000);
});

test('the query string never changes the page, and paths match in any letter case', () => {
  const site = loadSite();
  const page = resolve(site, '/web/kbmm.nsf/visit?OpenDocument');
  assert.equal(page.status, 200);
  for (const u of ['/web/kbmm.nsf/visit', '/WEB/KBMM.NSF/Visit?opendocument&x=1', '/web/kbmm.nsf/visit#top']) assert.equal(resolve(site, u), page, u);
  assert.equal(pathKey('/a%E0%A4%A?x'), '/a%e0%a4%a');
  assert.equal(resolve(site, '/%E0%A4%A').status, 404);
});

test('the contact form posts to a URL that answers 405 without reading the body', async () => {
  const html = read(pages.find((r) => r.url.includes('contact')));
  assert.match(html, /<form id="enquiry" class="dominoform" method="post" action="\/web\/kbmm\.nsf\/enquiry\?CreateDocument">/);
  for (const method of ['POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']) {
    const res = await call(method, '/web/kbmm.nsf/enquiry?CreateDocument', {body: method === 'POST' ? 'Name=a&Email=b' : undefined});
    assert.equal(res.status, 405, method);
    assert.equal(res.headers.allow, 'GET, HEAD');
    assert.match(res.body.toString(), /Form not available/);
  }
});

test('unknown paths answer the 404 page', async () => {
  for (const path of ['/nope', '/web/kbmm.nsf', '/web/kbmm.nsf/exhibitions/nope?OpenDocument', '/../server.mjs', '/site/routes.json', '/routes.json']) {
    const res = await call('GET', path);
    assert.equal(res.status, 404, path);
    assert.match(res.body.toString(), /Page not found/);
  }
});

test('a search gets the fixed results page and the query is never shown', async () => {
  const res = await call('GET', '/web/kbmm.nsf/vw-search?SearchView=&Query=%3Cscript%3Ealert(1)%3C%2Fscript%3E');
  assert.equal(res.status, 200);
  assert.doesNotMatch(res.body.toString(), /<script|alert/i);
  assert.match(res.body.toString(), /Site search is not available/);
});

test('robots.txt allows crawling and names the sitemap; the sitemap lists the 24 pages', async () => {
  const robots = await call('GET', '/robots.txt', {headers: {host: 'museum.example:8080'}});
  assert.equal(robots.body.toString(), 'User-agent: *\nAllow: /\n\nSitemap: http://museum.example:8080/sitemap.xml\n');
  const map = (await call('GET', '/sitemap.xml', {headers: {host: 'museum.example', 'x-forwarded-proto': 'https'}})).body.toString();
  const locs = [...map.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, crawlable.map((r) => `https://museum.example${r.url}`));
});

test('the sitemap origin comes from PUBLIC_ORIGIN, else a plain Host header, else localhost', () => {
  assert.equal(originOf({headers: {host: 'a.example'}}, {PUBLIC_ORIGIN: 'https://kbmm.example/'}), 'https://kbmm.example');
  assert.equal(originOf({headers: {host: 'evil.example/<x>'}}, {}), 'http://localhost:8080');
  assert.equal(originOf({headers: {}}, {}), 'http://localhost:8080');
});

const hrefs = (html) => [...html.matchAll(/(?:href|src|action)="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
const known = new Set(table.routes.map((r) => pathKey(r.url)));

test('every link is relative to the site root and reaches a route, or is a mailto link', () => {
  for (const r of pages) {
    for (const h of hrefs(read(r))) {
      if (h.startsWith('mailto:') || h === '/web/kbmm.nsf/enquiry?CreateDocument') continue;
      assert.ok(h.startsWith('/'), `${r.url}: ${h}`);
      assert.ok(known.has(pathKey(h)), `${r.url}: ${h}`);
    }
  }
});

test('a crawl from / finds every page in the sitemap and every old address', () => {
  const byKey = new Map(table.routes.map((r) => [pathKey(r.url), r]));
  const seen = new Set();
  const queue = ['/'];
  while (queue.length) {
    const r = byKey.get(pathKey(queue.shift()));
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    if (r.location) queue.push(r.location);
    else if (r.type.startsWith('text/html')) queue.push(...hrefs(read(r)).filter((h) => h.startsWith('/') && byKey.has(pathKey(h))));
  }
  for (const r of [...crawlable, ...redirects]) assert.ok(seen.has(r.url), r.url);
});

test('pages hold no script or frame, no absolute URL, only ASCII and the demonstration notice', () => {
  for (const r of pages) {
    const html = read(r);
    assert.doesNotMatch(html, /<frameset|<frame |<iframe|<script|\son[a-z]+="/i, r.url);
    assert.doesNotMatch(html.replace(/"http:\/\/www\.w3\.org\/[^"]+"/g, ''), /https?:\/\//, r.url);
    assert.match(html, /^[\x00-\x7f]*$/, r.url);
    assert.match(html, /Demonstration site\. Fictional organisation\./, r.url);
  }
});

test('every image is a JPEG under 250 KB', () => {
  for (const r of table.routes.filter((x) => x.type === 'image/jpeg')) {
    const file = join(ROOT, 'site', r.file);
    assert.ok(statSync(file).size < 250 * 1024, r.file);
    assert.deepEqual([...readFileSync(file).subarray(0, 3)], [0xff, 0xd8, 0xff], r.file);
  }
});

test('the committed site matches the generator', () => {
  const out = mkdtempSync(join(tmpdir(), 'site-'));
  execFileSync(process.execPath, [join(ROOT, 'scripts/generate.mjs')], {env: {...process.env, SITE_OUT: out}});
  for (const dir of ['pages', 'assets']) {
    for (const f of readdirSync(join(out, dir))) {
      assert.deepEqual(readFileSync(join(out, dir, f)), readFileSync(join(ROOT, 'site', dir, f)), `${dir}/${f}`);
    }
  }
  for (const f of ['routes.json', 'robots.txt', 'sitemap.xml']) assert.equal(readFileSync(join(out, f), 'utf8'), readFileSync(join(ROOT, 'site', f), 'utf8'), f);
});
