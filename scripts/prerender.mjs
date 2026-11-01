import fs from 'node:fs/promises';
import path from 'node:path';

const distDir = path.resolve('dist');
const template = await fs.readFile(path.join(distDir, 'index.html'), 'utf8');
const translations = JSON.parse(await fs.readFile(path.resolve('src/i18n/strings.json'), 'utf8'));
const baseUrl = 'https://spinwords.web.app';

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function safeRuleHtml(value) {
  return escapeHtml(value).replace(/&lt;strong&gt;/gi, '<strong>').replace(/&lt;\/strong&gt;/gi, '</strong>');
}
function upsertMeta(document, attribute, value, content) {
  const pattern = new RegExp('<meta[^>]*' + attribute + '=["\\']' + value + '["\\'][^>]*>', 'i');
  const tag = '<meta ' + attribute + '="' + value + '" content="' + escapeHtml(content) + '" />';
  if (pattern.test(document)) return document.replace(pattern, tag);
  return document.replace('</head>', tag + '\n</head>');
}
function upsertTitle(document, title) {
  return document.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + escapeHtml(title) + '</title>');
}
function renderDocument(options) {
  const { lang, title, description, keywords, canonical, robots, body } = options;
  let html = template.replace(/<html lang=["'][^"']*["']>/i, '<html lang="' + lang + '">');
  html = upsertTitle(html, title);
  html = upsertMeta(html, 'name', 'description', description);
  html = upsertMeta(html, 'name', 'robots', robots);
  html = upsertMeta(html, 'name', 'keywords', keywords || '');
  html = upsertMeta(html, 'property', 'og:title', title);
  html = upsertMeta(html, 'property', 'og:description', description);
  html = upsertMeta(html, 'property', 'og:url', canonical || (baseUrl + '/' + lang));
  html = upsertMeta(html, 'property', 'og:locale', lang === 'it' ? 'it_IT' : 'en_US');
  html = upsertMeta(html, 'name', 'twitter:title', title);
  html = upsertMeta(html, 'name', 'twitter:description', description);
  html = html.replace(/<link\s+rel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, '');
  const suffix = canonical && canonical.endsWith('/rules') ? '/rules' : '';
  const links = canonical
    ? '<link rel="canonical" href="' + canonical + '" />\n' +
      '<link rel="alternate" hreflang="it" href="' + baseUrl + '/it' + suffix + '" />\n' +
      '<link rel="alternate" hreflang="en" href="' + baseUrl + '/en' + suffix + '" />\n' +
      '<link rel="alternate" hreflang="x-default" href="' + baseUrl + '/it' + suffix + '" />\n'
    : '';
  html = html.replace('</head>', links + '</head>');
  const schema = {
    '@context': 'https://schema.org', '@type': 'VideoGame',
    name: lang === 'it' ? 'GiraParole' : 'SpinWords',
    alternateName: lang === 'it' ? 'SpinWords' : 'GiraParole',
    description, url: canonical || (baseUrl + '/' + lang),
    applicationCategory: 'Game', genre: ['Word Game', 'Puzzle', 'Party Game'],
    gamePlatform: ['Web Browser', 'Desktop', 'Mobile'], operatingSystem: 'Any',
    playMode: ['SinglePlayer', 'MultiPlayer'],
    numberOfPlayers: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 4 },
    inLanguage: lang, image: baseUrl + '/og-image-v2.jpg',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
    isAccessibleForFree: true
  };
  const schemaTag = '<script type="application/ld+json">' + JSON.stringify(schema) + '</script>';
  html = html.replace(/<script\s+type=["']application\/ld\+json["'][\s\S]*?<\/script>/i, schemaTag);
  html = html.replace(/<div id="root">[\s\S]*?<\/div>/i, '<div id="root">' + body + '</div>');
  return html;
}
function renderRules(lang) {
  const strings = translations[lang] || {};
  const sections = Array.isArray(strings['start.rulesBody']) ? strings['start.rulesBody'] : [];
  const heading = strings['rules.pageHeading'] || (lang === 'it' ? 'Regole del Gioco' : 'Game Rules');
  const intro = lang === 'it'
    ? 'GiraParole è un gioco della ruota online in cui devi indovinare una frase misteriosa, accumulare punti e usare i potenziamenti al momento giusto.'
    : 'SpinWords is an online wheel and word game where you guess a mystery phrase, earn points, and use power-ups at the right time.';
  const sectionHtml = sections.map(function(section) {
    const sectionTitle = section.title ? '<h2>' + escapeHtml(section.title) + '</h2>' : '';
    const lines = (section.content || []).map(function(line) { return '<p>' + safeRuleHtml(line) + '</p>'; }).join('');
    return '<section>' + sectionTitle + lines + '</section>';
  }).join('');
  const homeLabel = lang === 'it' ? 'Torna a GiraParole' : 'Back to SpinWords';
  return '<main class="seo-prerender-content"><h1>' + escapeHtml(heading) + '</h1><p>' +
    escapeHtml(intro) + '</p>' + sectionHtml + '<p><a href="/' + lang + '">' + homeLabel + '</a></p></main>';
}
const pages = [
  { lang:'it', route:'it', title:'GiraParole – Gioco della Ruota della Fortuna Online Gratis',
    description:'Gioca gratis a GiraParole: gira la ruota, indovina la frase misteriosa e sfida gli amici in un gioco di parole online, in solitaria o in multiplayer.',
    keywords:'gioco della ruota online, gioco di parole online, indovina la frase, gioco online gratis, gioco multiplayer con amici',
    canonical:baseUrl+'/it',
    body:'<main class="seo-prerender-content"><h1>GiraParole: gioco della ruota della fortuna online gratis</h1><p>Gira la ruota, indovina la frase misteriosa e accumula punti. Gioca da solo o sfida i tuoi amici in multiplayer: GiraParole è un gioco di parole online gratuito, direttamente dal browser.</p><p><a href="/it/rules">Scopri le regole del gioco</a></p></main>' },
  { lang:'en', route:'en', title:'SpinWords – Free Online Wheel and Word Game',
    description:'Play SpinWords for free: spin the wheel, guess the mystery phrase, and challenge friends in this online word game, solo or in multiplayer mode.',
    keywords:'online wheel game, online word game, guess the phrase, free online game, multiplayer game with friends',
    canonical:baseUrl+'/en',
    body:'<main class="seo-prerender-content"><h1>SpinWords: free online wheel and word game</h1><p>Spin the wheel, guess the mystery phrase, and earn points. Play solo or challenge your friends in multiplayer mode: SpinWords is a free online word game that runs in your browser.</p><p><a href="/en/rules">Read the game rules</a></p></main>' },
  { lang:'it', route:'it/rules', title:'Regole del Gioco GiraParole – Come Giocare e Fare Punti',
    description:'Scopri tutte le regole di GiraParole: come girare la ruota, indovinare la frase misteriosa, guadagnare punti e usare i potenziamenti.',
    keywords:'regole GiraParole, come giocare alla ruota della fortuna, regole gioco di parole, punteggio, potenziamenti',
    canonical:baseUrl+'/it/rules', body:renderRules('it') },
  { lang:'en', route:'en/rules', title:'SpinWords Game Rules – How to Play and Score Points',
    description:'Learn the SpinWords rules: how to spin the wheel, guess the mystery phrase, earn points, and use power-ups in solo or multiplayer games.',
    keywords:'SpinWords rules, how to play wheel game, word game rules, scoring, power-ups',
    canonical:baseUrl+'/en/rules', body:renderRules('en') }
];
for (const page of pages) {
  const html = renderDocument({ ...page, robots:'index, follow' });
  const outputDir = path.join(distDir, page.route);
  await fs.mkdir(outputDir, { recursive:true });
  await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
}
for (const lang of ['it','en']) {
  for (const route of ['game','lobby','scoreboard']) {
    const title = lang === 'it' ? 'Partita GiraParole' : 'SpinWords game';
    const description = lang === 'it' ? 'Pagina di gioco GiraParole.' : 'SpinWords game page.';
    const body = '<main class="seo-prerender-content"><h1>' + escapeHtml(title) + '</h1><p>' + escapeHtml(description) + '</p></main>';
    const html = renderDocument({ lang, title, description, keywords:'', canonical:null, robots:'noindex, follow', body });
    const outputDir = path.join(distDir, lang, route);
    await fs.mkdir(outputDir, { recursive:true });
    await fs.writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  }
}
console.log('Prerendered 4 indexable pages and 6 noindex app routes.');
