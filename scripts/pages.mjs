// HTML templates for the demonstration site. Plain functions that return strings: no template engine and no request
// data. Every page in a collection is made by the same function, so the pages share one markup structure.
import {EVENTS, EXHIBITIONS, HERO_SLIDES, IMAGES, OBJECTS, ONE_OFFS, SITE} from './content.mjs';

const DB = '/web/kbmm.nsf';

export const URL = {
  home: `${DB}/home`,
  doc: (name) => `${DB}/${name}?OpenDocument`,
  contact: `${DB}/contact?OpenForm`,
  contactPost: `${DB}/enquiry?CreateDocument`,
  search: `${DB}/vw-search`,
  view: (collection) => `${DB}/${collection}/vw-all?OpenView`,
  item: (collection, slug) => `${DB}/${collection}/${slug}?OpenDocument`,
  css: `${DB}/kbmm.css`,
  logo: `${DB}/kbmm-logo.svg`,
  badge: `${DB}/powered-by.svg`,
  image: (name) => `${DB}/${name}.jpg`,
  thumb: (name) => `${DB}/${name}-thumb.jpg`,
};

// Old addresses from the site before the move to the web database. Each answers 301 to the current page.
export const OLD = {
  '/': URL.home,
  '/index.html': URL.home,
  '/exhibits.htm': URL.view('exhibitions'),
  '/exhibits/lighthouse.htm': URL.item('exhibitions', 'the-lighthouse-keepers'),
  '/whatson.html': URL.view('events'),
  '/events/shanty.html': URL.item('events', 'sea-shanty-night'),
  '/collection/objects.html': URL.view('collection'),
  '/collection/figurehead.html': URL.item('collection', 'marguerite-figurehead'),
  '/visit.htm': URL.doc('visit'),
  '/hours.html': URL.doc('visit'),
  '/about-us.htm': URL.doc('about'),
  '/members.html': URL.doc('membership'),
  '/contact.htm': URL.contact,
};

// The collections, with the names the views and breadcrumbs use.
export const COLLECTIONS = {
  exhibitions: {title: 'Exhibitions', items: EXHIBITIONS, tab: 'exhibitions'},
  events: {title: 'What\'s On', items: EVENTS, tab: 'events'},
  collection: {title: 'Collection Highlights', items: OBJECTS, tab: 'collection'},
};

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Typographic characters become entities, so that every page is plain ASCII.
const typo = (s) => esc(s).replace(/'/g, '&#39;').replace(/ - /g, ' &ndash; ');
const link = (href, text, cls = '') => `<a href="${esc(href)}"${cls ? ` class="${cls}"` : ''}>${typo(text)}</a>`;
const img = (src, alt, w, h, cls = '') => `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}"${cls ? ` class="${cls}"` : ''} />`;
const photo = (name, w, h, cls = '') => img(URL.image(name), IMAGES[name], w, h, cls);
const thumb = (name, cls = '') => img(URL.thumb(name), IMAGES[name], 160, 120, cls);
const paras = (list) => list.map((p) => `<p>${typo(p)}</p>`).join('\n');

const TABS = [
  ['home', 'Home', URL.home],
  ['visit', 'Visit', URL.doc('visit')],
  ['exhibitions', 'Exhibitions', URL.view('exhibitions')],
  ['events', 'What\'s On', URL.view('events')],
  ['collection', 'Collection', URL.view('collection')],
  ['membership', 'Membership', URL.doc('membership')],
  ['about', 'About Us', URL.doc('about')],
  ['contact', 'Contact', URL.contact],
];

function head(title, robots = 'noindex') {
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en-AU" lang="en-AU">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<meta name="robots" content="${robots}" />
<meta name="description" content="${esc(SITE.name)}: ${esc(SITE.tagline)}." />
<meta name="generator" content="Corvane Dominion Designer 8.5.3" />
<title>${typo(title)} | ${esc(SITE.name)}</title>
<link rel="stylesheet" type="text/css" href="${URL.css}" />
</head>`;
}

function searchForm() {
  return `<form id="search" method="get" action="${URL.search}">
<input type="hidden" name="SearchView" value="" />
<label for="query">Search the site</label>
<input type="text" id="query" name="Query" size="22" value="" />
<input type="submit" class="go" value="Go" />
</form>`;
}

function header(active) {
  const tabs = TABS.map(([key, text, href]) => `<li${key === active ? ' class="current"' : ''}>${link(href, text)}</li>`);
  return `<div id="topbar">
<ul class="utility"><li>${link(URL.doc('visit'), 'Opening hours')}</li><li>${link(URL.doc('membership'), 'Become a member')}</li><li>${link(URL.contact, 'Contact us')}</li></ul>
<span class="textsize">Text size: <b class="ts1">A</b> <b class="ts2">A</b> <b class="ts3">A</b></span>
</div>
<div id="header">
<a href="${URL.home}" class="brand">${img(URL.logo, '', 84, 84, 'logo')}<span class="name">Kestrel Bay<br /><em>Maritime Museum</em></span></a>
<p class="tagline">${typo(SITE.tagline)}</p>
<div class="header-tools">
<p class="phone">Enquiries <strong>${SITE.phone}</strong></p>
${searchForm()}
</div>
</div>
<div id="nav"><ul>
${tabs.join('\n')}
</ul></div>`;
}

const FOOTER_OLD = [
  ['/index.html', 'Home'], ['/visit.htm', 'Visiting the museum'], ['/hours.html', 'Opening hours'], ['/exhibits.htm', 'Exhibits'],
  ['/whatson.html', 'What\'s on'], ['/collection/objects.html', 'Collection search'], ['/members.html', 'Join the museum'],
  ['/about-us.htm', 'About us'], ['/contact.htm', 'Contact us'],
];

function footer() {
  const popular = FOOTER_OLD.map(([href, text]) => `<li>${link(href, text)}</li>`).join('');
  const explore = [['exhibitions', 'Exhibitions'], ['events', 'What\'s On'], ['collection', 'Collection Highlights']]
    .map(([c, t]) => `<li>${link(URL.view(c), t)}</li>`).join('');
  return `<div id="footer">
<div class="footer-cols">
<div class="fcol"><h4>Visit us</h4><p>${SITE.address.map(esc).join('<br />')}</p><p>${typo(SITE.hours)}</p></div>
<div class="fcol"><h4>Explore</h4><ul>${explore}<li>${link(URL.doc('about'), 'About the museum')}</li></ul></div>
<div class="fcol"><h4>Popular pages</h4><ul class="two">${popular}</ul></div>
<div class="fcol last"><h4>Contact</h4><p>Phone ${SITE.phone}<br />Bookings ${SITE.bookings}<br />${link(`mailto:${SITE.email}`, SITE.email)}</p></div>
</div>
<div class="footer-base">
<p class="legal">&copy; 2012 ${esc(SITE.name)}. Demonstration site. Fictional organisation.<br />Page last updated ${SITE.updated}. Best viewed at 1024 &times; 768 or higher.</p>
<a href="${URL.home}" class="badge">${img(URL.badge, 'Powered by Corvane Dominion', 88, 31)}</a>
</div>
</div>`;
}

function layout({title, active, crumbs, sidebar, content, bodyClass, robots}) {
  const crumbTrail = crumbs ? `<div id="breadcrumb">You are here: ${crumbs.map(([h, t]) => (h ? link(h, t) : `<strong>${typo(t)}</strong>`)).join(' &raquo; ')}</div>\n` : '';
  const side = sidebar ? `<div id="sidebar">\n${sidebar}\n</div>\n` : '';
  return `${head(title, robots)}
<body class="${bodyClass}">
<div id="wrap">
${header(active)}
${crumbTrail}<div id="main"${sidebar ? ' class="with-sidebar"' : ''}>
${side}<div id="content">
${content}
</div>
<div class="clear"></div>
</div>
${footer()}
</div>
</body>
</html>
`;
}

// The sidebar of inner pages: the section menu, then fixed boxes.
function sectionMenu(title, items, current) {
  const rows = items.map(([href, text]) => `<li${href === current ? ' class="current"' : ''}>${link(href, text)}</li>`);
  return `<div class="side-box menu"><h3>${typo(title)}</h3><ul>\n${rows.join('\n')}\n</ul></div>`;
}

function hoursBox() {
  return `<div class="side-box hours"><h3>Opening hours</h3><p><strong>Open daily</strong><br />9.30am &ndash; 4.30pm</p><p class="small">Closed Christmas Day and Good Friday.</p><p>${link(URL.doc('visit'), 'Tickets and directions', 'more')}</p></div>`;
}

function memberBox() {
  return `<div class="side-box promo"><h3>Become a member</h3>${thumb('gal-foyer', 'promo-img')}<p>Free entry all year, plus invitations to openings and members' evenings.</p><p>${link(URL.doc('membership'), 'Join today', 'more')}</p></div>`;
}

function collectionMenu(key, current) {
  const c = COLLECTIONS[key];
  const items = [[URL.view(key), `All ${c.title.toLowerCase()}`], ...c.items.map((i) => [URL.item(key, i.slug), i.title])];
  return sectionMenu(c.title, items, current);
}

const ONE_OFF_MENU = [[URL.doc('visit'), 'Visit us'], [URL.doc('membership'), 'Membership'], [URL.doc('about'), 'About the museum'], [URL.contact, 'Contact us']];

// ----- Home -----

const SLIDE_LINKS = {visit: URL.doc('visit'), lighthouse: URL.item('exhibitions', 'the-lighthouse-keepers'), collection: URL.view('collection')};

function carousel() {
  const [first] = HERO_SLIDES;
  const pager = HERO_SLIDES.map((s, i) => `<li${i === 0 ? ' class="on"' : ''}><a href="${SLIDE_LINKS[s.link[0]]}">${img(URL.thumb(s.image), IMAGES[s.image], 96, 72)}<span>${typo(s.title)}</span></a></li>`);
  return `<div id="carousel">
<div class="slide">${photo(first.image, 980, 392)}
<div class="caption"><h2>${typo(first.title)}</h2><p>${typo(first.text)}</p><p>${link(SLIDE_LINKS[first.link[0]], first.link[1], 'button')}</p></div>
<span class="arrow prev">&lsaquo;</span><span class="arrow next">&rsaquo;</span>
</div>
<ul class="pager">
${pager.join('\n')}
</ul>
</div>`;
}

function featureTile(ex) {
  return `<div class="tile">
<a href="${URL.item('exhibitions', ex.slug)}">${img(URL.thumb(ex.image), IMAGES[ex.image], 196, 147)}</a>
<span class="flag">${typo(ex.status)}</span>
<h3>${link(URL.item('exhibitions', ex.slug), ex.title)}</h3>
<p>${typo(ex.summary)}</p>
</div>`;
}

function eventRow(ev) {
  const [num, month] = ev.badge;
  return `<li><span class="datebox"><b>${esc(num)}</b>${esc(month)}</span><span class="what">${link(URL.item('events', ev.slug), ev.title)}<br /><small>${typo(ev.time)}</small></span></li>`;
}

export function homePage() {
  const tiles = EXHIBITIONS.slice(0, 3).map(featureTile).join('\n');
  const events = EVENTS.slice(0, 4).map(eventRow).join('\n');
  const objects = OBJECTS.slice(0, 5).map((o) => `<li><a href="${URL.item('collection', o.slug)}">${thumb(o.image)}<span>${typo(o.title)}</span></a></li>`).join('\n');
  const content = `${carousel()}
<div class="home-cols">
<div class="home-main">
<h2 class="section-title">Now showing</h2>
<div class="tiles">
${tiles}
</div>
<div class="welcome">
<h2 class="section-title">Welcome aboard</h2>
<p>Since 1952 the Kestrel Bay Maritime Museum has collected the stories of the Corrowa Coast: its ships and wrecks, its lighthouse and its boatbuilders. Our galleries fill the sandstone Old Customs House and the restored bond store on the foreshore.</p>
<p>This spring, step inside the lamp room in ${link('/exhibits/lighthouse.htm', 'The Lighthouse Keepers')}, meet the ${link('/collection/figurehead.html', 'Marguerite figurehead')} after her restoration, and sing along at our ${link('/events/shanty.html', 'Sea Shanty Night')}.</p>
</div>
</div>
<div class="home-side">
<div class="side-box whatson"><h3>What's On</h3><ul class="events">
${events}
</ul><p>${link(URL.view('events'), 'All events', 'more')}</p></div>
${hoursBox()}
</div>
<div class="clear"></div>
</div>
<div class="strip">
<h2 class="section-title">From the collection</h2>
<ul class="objects">
${objects}
</ul>
</div>`;
  return layout({title: 'Home', active: 'home', content, bodyClass: 'home'});
}

// ----- One-off pages -----

export function oneOffPage(key) {
  const page = ONE_OFFS[key];
  const sections = page.sections.map(([h, list]) => `<h2>${typo(h)}</h2>\n${list.length > 2 && key === 'membership' ? `<ul class="ticks">${list.map((x) => `<li>${typo(x)}</li>`).join('')}</ul>` : paras(list)}`);
  const content = `<h1>${typo(page.title)}</h1>
<p class="intro">${typo(page.intro)}</p>
<div class="page-image">${photo(page.image, 720, 288)}</div>
${sections.join('\n')}`;
  const sidebar = `${sectionMenu('Plan your visit', ONE_OFF_MENU, URL.doc(key))}\n${hoursBox()}${key === 'membership' ? '' : `\n${memberBox()}`}`;
  return layout({title: page.title, active: key, crumbs: [[URL.home, 'Home'], [null, page.title]], sidebar, content, bodyClass: `page ${key}`});
}

export function contactPage() {
  const types = ['General enquiry', 'Bookings and tours', 'Membership', 'Donating an object', 'Research and archives', 'Venue hire'];
  const content = `<h1>Contact us</h1>
<p class="intro">We welcome your questions and comments. Fill in the form below and a member of our team will reply within three working days.</p>
<form id="enquiry" class="dominoform" method="post" action="${URL.contactPost}">
<input type="hidden" name="__Click" value="0" />
<fieldset>
<legend>Your enquiry</legend>
<div class="field"><label for="Name">Your name <span class="req">*</span></label><input type="text" id="Name" name="Name" size="40" value="" /></div>
<div class="field"><label for="Email">E-mail address <span class="req">*</span></label><input type="text" id="Email" name="Email" size="40" value="" /></div>
<div class="field"><label for="EnquiryType">Type of enquiry</label><select id="EnquiryType" name="EnquiryType">
${types.map((t) => `<option>${esc(t)}</option>`).join('\n')}
</select></div>
<div class="field"><label for="Message">Your message <span class="req">*</span></label><textarea id="Message" name="Message" rows="7" cols="48"></textarea></div>
<div class="field submit"><input type="submit" class="button" value="Send enquiry" /> <span class="req">*</span> <small>Required field</small></div>
</fieldset>
</form>
<h2>Other ways to reach us</h2>
<table class="facts">
<tr><th>Phone</th><td>${SITE.phone}</td></tr>
<tr><th>Bookings</th><td>${SITE.bookings} or ${link(`mailto:${SITE.bookingsEmail}`, SITE.bookingsEmail)}</td></tr>
<tr><th>After hours</th><td>${SITE.mobile} (moorings and emergencies only)</td></tr>
<tr><th>E-mail</th><td>${link(`mailto:${SITE.email}`, SITE.email)}</td></tr>
<tr><th>Post</th><td>PO Box 118, Kestrel Bay</td></tr>
</table>`;
  const sidebar = `${sectionMenu('Plan your visit', ONE_OFF_MENU, URL.contact)}\n<div class="side-box address"><h3>Find us</h3>${thumb('hero-museum', 'promo-img')}<p>${SITE.address.map(esc).join('<br />')}</p></div>\n${hoursBox()}`;
  return layout({title: 'Contact us', active: 'contact', crumbs: [[URL.home, 'Home'], [null, 'Contact us']], sidebar, content, bodyClass: 'page contact'});
}

export function searchResultsPage() {
  const content = `<h1>Search results</h1>
<p class="intro">Site search is not available at the moment while we upgrade the server. We apologise for the inconvenience.</p>
<p>Try one of these pages:</p>
<ul class="ticks"><li>${link(URL.view('exhibitions'), 'Exhibitions')}</li><li>${link(URL.view('events'), 'What\'s On')}</li><li>${link(URL.view('collection'), 'Collection Highlights')}</li><li>${link(URL.doc('visit'), 'Visit us')}</li></ul>`;
  const sidebar = `${sectionMenu('Plan your visit', ONE_OFF_MENU, '')}\n${hoursBox()}`;
  return layout({title: 'Search results', active: '', crumbs: [[URL.home, 'Home'], [null, 'Search results']], sidebar, content, bodyClass: 'page search', robots: 'noindex, nofollow'});
}

// ----- Views (collection index pages) -----

const VIEW_INTRO = {
  exhibitions: 'From the lamp room of Kestrel Head to the wrecks of Tallis Reef: our permanent and changing exhibitions.',
  events: 'Talks, tours, workshops and festivals at the museum and around Kestrel Bay. Bookings on 02 5550 1841.',
  collection: 'A few of the 14,000 objects, photographs and documents in the museum collection.',
};

const VIEW_META = {
  exhibitions: (i) => `${i.dates} | ${i.location}`,
  events: (i) => `${i.date} | ${i.time}`,
  collection: (i) => `${i.accession} | ${i.date}`,
};

const summaryOf = (i) => i.summary ?? i.story[0];

export function viewPage(key) {
  const c = COLLECTIONS[key];
  const rows = c.items.map((i) => `<tr class="view-row">
<td class="view-thumb"><a href="${URL.item(key, i.slug)}">${thumb(i.image)}</a></td>
<td class="view-text"><h2>${link(URL.item(key, i.slug), i.title)}</h2><p class="meta">${typo(VIEW_META[key](i))}</p><p>${typo(summaryOf(i))}</p></td>
</tr>`);
  const content = `<h1>${typo(c.title)}</h1>
<p class="intro">${typo(VIEW_INTRO[key])}</p>
<div class="view-bar"><span>Showing 1 &ndash; ${c.items.length} of ${c.items.length}</span><span class="view-nav">&laquo; Previous | Next &raquo;</span></div>
<table class="view" cellspacing="0">
${rows.join('\n')}
</table>`;
  const sidebar = `${collectionMenu(key, URL.view(key))}\n${hoursBox()}\n${memberBox()}`;
  return layout({title: c.title, active: c.tab, crumbs: [[URL.home, 'Home'], [null, c.title]], sidebar, content, bodyClass: `view ${key}-view`});
}

// ----- Collection documents. One function per collection: the same markup for every page in it. -----

function docShell(key, item, content) {
  const c = COLLECTIONS[key];
  const crumbs = [[URL.home, 'Home'], [URL.view(key), c.title], [null, item.title]];
  const sidebar = `${collectionMenu(key, URL.item(key, item.slug))}\n${hoursBox()}\n${memberBox()}`;
  return layout({title: item.title, active: c.tab, crumbs, sidebar, content, bodyClass: `document ${key}-doc`});
}

const factRows = (rows) => rows.map(([k, v]) => `<tr><th>${typo(k)}</th><td>${typo(v)}</td></tr>`).join('\n');

export function exhibitionPage(ex) {
  const gallery = ex.gallery.map((g) => `<li><a href="${URL.image(g)}">${thumb(g)}</a><span class="caption">${typo(IMAGES[g])}</span></li>`).join('\n');
  const related = ex.related.map((slug) => EXHIBITIONS.find((e) => e.slug === slug))
    .map((r) => `<li><a href="${URL.item('exhibitions', r.slug)}">${img(URL.thumb(r.image), IMAGES[r.image], 96, 72)}</a>${link(URL.item('exhibitions', r.slug), r.title)}<br /><small>${typo(r.dates)}</small></li>`).join('\n');
  const content = `<div class="exhibition">
<span class="doc-flag">${typo(ex.status)}</span>
<h1 class="doc-title">${typo(ex.title)}</h1>
<p class="doc-summary">${typo(ex.summary)}</p>
<div class="doc-hero">${photo(ex.image, 720, 405)}</div>
<table class="doc-facts facts" cellspacing="0">
${factRows([['Dates', ex.dates], ['Location', ex.location], ['Admission', 'Included with museum entry']])}
</table>
<div class="doc-body">
${paras(ex.body)}
</div>
<h2 class="doc-subhead">Gallery</h2>
<ul class="doc-gallery">
${gallery}
</ul>
<h2 class="doc-subhead">Related exhibitions</h2>
<ul class="doc-related">
${related}
</ul>
</div>`;
  return docShell('exhibitions', ex, content);
}

export function eventPage(ev) {
  const content = `<div class="event">
<span class="doc-flag">${typo(ev.category)}</span>
<h1 class="doc-title">${typo(ev.title)}</h1>
<p class="doc-summary">${typo(ev.summary)}</p>
<div class="doc-hero">${photo(ev.image, 720, 405)}</div>
<table class="doc-facts facts" cellspacing="0">
${factRows([['Date', ev.date], ['Time', ev.time], ['Price', ev.price], ['Venue', ev.venue]])}
</table>
<div class="doc-body">
${paras(ev.body)}
</div>
<div class="doc-cta"><a href="${URL.contact}" class="button big">Book now</a><p>or call our bookings line on <strong>${SITE.bookings}</strong></p></div>
</div>`;
  return docShell('events', ev, content);
}

export function objectPage(o) {
  const content = `<div class="object">
<span class="doc-flag">Collection highlight</span>
<h1 class="doc-title">${typo(o.title)}</h1>
<div class="doc-photo">${photo(o.image, 340, 340)}</div>
<table class="doc-facts facts object-facts" cellspacing="0">
${factRows([['Accession number', o.accession], ['Date', o.date], ['Materials', o.materials], ['Provenance', o.provenance]])}
</table>
<div class="clear"></div>
<h2 class="doc-subhead">The story</h2>
<div class="doc-body">
${paras(o.story)}
</div>
</div>`;
  return docShell('collection', o, content);
}

// ----- Error pages -----

function errorPage(title, text, status) {
  const content = `<h1>${typo(title)}</h1>
<p class="intro">${typo(text)}</p>
<p>${link(URL.home, 'Return to the home page', 'more')}</p>
<p class="small">HTTP Web Server: ${status}</p>`;
  return layout({title, active: '', content: `<div class="error-page">${content}</div>`, bodyClass: 'error', robots: 'noindex, nofollow'});
}

export const notFoundPage = () => errorPage('Page not found', 'Sorry, the page you asked for is not on this site. It may have moved when we updated the website.', 'File does not exist');
export const methodPage = () => errorPage('Form not available', 'Sorry, online forms are not available at the moment. Please call us on 02 5550 1840 or send an e-mail to info@kbmm.example.', 'Method not allowed');
