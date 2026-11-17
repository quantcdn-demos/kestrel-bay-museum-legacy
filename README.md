# Kestrel Bay Maritime Museum: legacy website (demonstration)

A fictional "legacy" museum website, made for a Quant Studio film about importing an existing site. The Kestrel Bay
Maritime Museum, its town, people, ships, objects, numbers and addresses are invented. Phone numbers are from the ACMA
list of numbers for fictional use, and e-mail addresses use the reserved `.example` domain. Every photograph was
generated for this site (see [Images](#images)).

The site looks like a 2012 web application on an old document server: a fixed 980-pixel layout, bevelled tabs,
gradients, a static photo carousel, breadcrumbs and a left-hand section menu. It only looks old. It is a small
Node.js 24 server with no dependencies that serves fixed pages:

- GET and HEAD only; every other method gets 405, and a request body is never read. The contact form posts to
  `/web/kbmm.nsf/enquiry?CreateDocument`, which therefore answers 405.
- Each response is a file from `site/`, chosen by an exact route table (`site/routes.json`). Routing uses the path
  only, in any letter case; the query string (`?OpenDocument`, `?OpenView`) never changes the answer.
- The search box sends a GET to `/web/kbmm.nsf/vw-search`, which answers one fixed results page.
- It sends an old-style `Server` banner (fictional) and `X-Robots-Tag: noindex`. robots.txt allows crawling, so the
  Quant migration crawler can read the site, and names the sitemap.
- robots.txt and sitemap.xml need the public address: set `PUBLIC_ORIGIN` (for example `https://museum.example`),
  or the server uses the `Host` header when it is a plain host name.
- The image runs as the non-root `node` user, and the files are not writable.

## Pages

24 crawlable pages (the migration may stop at 25):

| Page | URL |
| --- | --- |
| Home | `/web/kbmm.nsf/home` |
| Visit | `/web/kbmm.nsf/visit?OpenDocument` |
| About | `/web/kbmm.nsf/about?OpenDocument` |
| Membership | `/web/kbmm.nsf/membership?OpenDocument` |
| Contact (form) | `/web/kbmm.nsf/contact?OpenForm` |
| Exhibitions index + 5 | `/web/kbmm.nsf/exhibitions/vw-all?OpenView`, `/web/kbmm.nsf/exhibitions/<slug>?OpenDocument` |
| Events index + 5 | `/web/kbmm.nsf/events/vw-all?OpenView`, `/web/kbmm.nsf/events/<slug>?OpenDocument` |
| Collection index + 6 | `/web/kbmm.nsf/collection/vw-all?OpenView`, `/web/kbmm.nsf/collection/<slug>?OpenDocument` |

Every page in a collection is made by one template, so all of them share the same markup. The search results page
(`/web/kbmm.nsf/vw-search`) is not in the sitemap.

## Old addresses

These answer `301 Moved Permanently` to the current page. They are plain paths (no query), and pages link to them
(the "Popular pages" footer and links in the home page text), so a crawler meets them.

| Old address | Goes to |
| --- | --- |
| `/` and `/index.html` | `/web/kbmm.nsf/home` |
| `/exhibits.htm` | `/web/kbmm.nsf/exhibitions/vw-all?OpenView` |
| `/exhibits/lighthouse.htm` | `/web/kbmm.nsf/exhibitions/the-lighthouse-keepers?OpenDocument` |
| `/whatson.html` | `/web/kbmm.nsf/events/vw-all?OpenView` |
| `/events/shanty.html` | `/web/kbmm.nsf/events/sea-shanty-night?OpenDocument` |
| `/collection/objects.html` | `/web/kbmm.nsf/collection/vw-all?OpenView` |
| `/collection/figurehead.html` | `/web/kbmm.nsf/collection/marguerite-figurehead?OpenDocument` |
| `/visit.htm` and `/hours.html` | `/web/kbmm.nsf/visit?OpenDocument` |
| `/about-us.htm` | `/web/kbmm.nsf/about?OpenDocument` |
| `/members.html` | `/web/kbmm.nsf/membership?OpenDocument` |
| `/contact.htm` | `/web/kbmm.nsf/contact?OpenForm` |

## Run

```sh
npm test
npm start            # http://localhost:8080/
docker compose up    # the same, in a read-only container
```

`node scripts/generate.mjs` writes the pages, routes, robots.txt and sitemap.xml from `scripts/content.mjs` and
`scripts/pages.mjs`. The workflow in `.github/workflows/image.yml` tests and publishes
`ghcr.io/quantcdn-demos/kestrel-bay-museum-legacy`.

## Images

The photographs in `site/images` were generated on a Mac with [mflux](https://github.com/filipstrand/mflux) and
FLUX.1 [schnell] (Apache-2.0), using the 8-bit mflux conversion `mflux-community/flux-1-schnell-mflux-q8`. The
prompts and seeds are in `scripts/images.sh`, which also sizes and compresses each picture. The logo
(`scripts/kbmm-logo.svg`) and the "powered by" button (`scripts/powered-by.svg`) are original drawings.
