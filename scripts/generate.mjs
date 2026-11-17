// Writes the fixed site into site/: the HTML pages, the stylesheet, the logo, robots.txt, sitemap.xml and routes.json
// (path to file or redirect). The photographs in site/images are made once by scripts/images.sh and kept in git.
// Run: node scripts/generate.mjs
import {copyFileSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {EVENTS, EXHIBITIONS, IMAGES, OBJECTS} from './content.mjs';
import * as P from './pages.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = process.env.SITE_OUT ?? join(HERE, '..', 'site');
const HTML = 'text/html; charset=UTF-8';

const routes = [];
const files = {};

// A page: the route URL keeps its Domino query (?OpenDocument), but the server routes by the path alone.
function page(url, file, body, sitemap = true) {
  routes.push({url, file: `pages/${file}`, type: HTML, status: 200, sitemap});
  files[`pages/${file}`] = body;
}

function addPages() {
  page(P.URL.home, 'home.html', P.homePage());
  for (const key of ['visit', 'about', 'membership']) page(P.URL.doc(key), `${key}.html`, P.oneOffPage(key));
  page(P.URL.contact, 'contact.html', P.contactPage());
  page(P.URL.search, 'search-results.html', P.searchResultsPage(), false);
  const docs = {exhibitions: [EXHIBITIONS, P.exhibitionPage], events: [EVENTS, P.eventPage], collection: [OBJECTS, P.objectPage]};
  for (const [key, [items, make]] of Object.entries(docs)) {
    page(P.URL.view(key), `${key}-vw-all.html`, P.viewPage(key));
    for (const item of items) page(P.URL.item(key, item.slug), `${key}-${item.slug}.html`, make(item));
  }
}

function addRedirects() {
  for (const [from, to] of Object.entries(P.OLD)) routes.push({url: from, status: 301, location: to});
}

function addAssets() {
  routes.push({url: P.URL.css, file: 'assets/kbmm.css', type: 'text/css', status: 200, copy: join(HERE, 'style.css')});
  routes.push({url: P.URL.logo, file: 'assets/kbmm-logo.svg', type: 'image/svg+xml', status: 200, copy: join(HERE, 'kbmm-logo.svg')});
  routes.push({url: P.URL.badge, file: 'assets/powered-by.svg', type: 'image/svg+xml', status: 200, copy: join(HERE, 'powered-by.svg')});
  for (const name of Object.keys(IMAGES)) {
    routes.push({url: P.URL.image(name), file: `images/${name}.jpg`, type: 'image/jpeg', status: 200});
    routes.push({url: P.URL.thumb(name), file: `images/${name}-thumb.jpg`, type: 'image/jpeg', status: 200});
  }
}

// robots.txt and sitemap.xml need the public origin, which the server puts in place of {{ORIGIN}} for each request.
function addCrawlFiles() {
  const urls = routes.filter((r) => r.sitemap).map((r) => `<url><loc>{{ORIGIN}}${r.url.replace(/&/g, '&amp;')}</loc><lastmod>2012-09-14</lastmod></url>`);
  files['sitemap.xml'] = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`;
  files['robots.txt'] = 'User-agent: *\nAllow: /\n\nSitemap: {{ORIGIN}}/sitemap.xml\n';
  routes.push({url: '/sitemap.xml', file: 'sitemap.xml', type: 'application/xml', status: 200, origin: true});
  routes.push({url: '/robots.txt', file: 'robots.txt', type: 'text/plain', status: 200, origin: true});
}

function write() {
  for (const dir of ['pages', 'assets']) rmSync(join(SITE, dir), {recursive: true, force: true});
  const special = {notFound: 'pages/404.html', method: 'pages/405.html'};
  files[special.notFound] = P.notFoundPage();
  files[special.method] = P.methodPage();
  for (const [file, body] of Object.entries(files)) {
    mkdirSync(dirname(join(SITE, file)), {recursive: true});
    writeFileSync(join(SITE, file), body);
  }
  for (const r of routes.filter((x) => x.copy)) {
    mkdirSync(dirname(join(SITE, r.file)), {recursive: true});
    copyFileSync(r.copy, join(SITE, r.file));
  }
  const table = routes.map(({copy, ...r}) => r);
  writeFileSync(join(SITE, 'routes.json'), `${JSON.stringify({routes: table, special}, null, 1)}\n`);
}

addPages();
addRedirects();
addAssets();
addCrawlFiles();
write();
console.log(`wrote ${routes.length} routes to ${SITE}`);
