// Builds index.html from src/template.html + content/*.json.
// Staff edit content/*.json in Pages CMS. Netlify runs this on every deploy.
// Never hand-edit the generated index.html.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const read = f => JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f + '.json'), 'utf8'));
const c = Object.fromEntries(['hero', 'why', 'soccer', 'football', 'ages', 'sizing', 'teams', 'volunteer', 'contact', 'seo'].map(s => [s, read(s)]));

// ---------- helpers ----------
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// keep the last two words together so nothing ends on one orphaned word
const tie = s => s.replace(/ ([^\s<>]{1,14}(?:<\/[a-z]+>)*)$/, '&nbsp;$1');
const fmt = s => tie(esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\*(.+?)\*/g, '<em>$1</em>')
  .replace(/\[(.+?)\]\(((?:https?:\/\/|mailto:|tel:|#)[^\s)]*)\)/g, (m, t, u) => `<a href="${u}"${/^https?:/.test(u) ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`));
const txt = s => tie(esc(s));
const img = p => '/' + esc(String(p || '').replace(/^\//, ''));
const ext = u => /^https?:/.test(u) ? ' target="_blank" rel="noopener"' : '';
const mapLink = a => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(a);
const telLink = p => 'tel:+1' + String(p).replace(/\D/g, '').replace(/^1/, '');
const smsLink = p => 'sms:+1' + String(p).replace(/\D/g, '').replace(/^1/, '');
const icon = (id, cls = 'i') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const money = n => '$' + String(n).replace(/[^\d.]/g, '');
const SOON = 'Date coming soon';
const sectionHead = (x, id, extra = '') => `
      <div class="sec-head">
        <p class="eyebrow">${txt(x.eyebrow)}</p>
        <h2 id="${id}-h">${txt(x.heading)}</h2>${extra}
      </div>`;

// garment drawings for the sizing charts
const GARMENTS = {
  'Jersey': `<path class="g-fill" d="M70 30 L48 38 L18 70 L36 92 L56 76 L56 172 L144 172 L144 76 L164 92 L182 70 L152 38 L130 30 Q100 52 70 30Z"/><path class="g-trim" d="M70 30 Q100 52 130 30 L122 28 Q100 42 78 28Z"/><path class="g-trim" d="M18 70 L36 92 L44 86 L26 64Z M182 70 L164 92 L156 86 L174 64Z"/>`,
  'Shorts': `<path class="g-fill" d="M46 40 L154 40 L166 160 L110 166 L100 92 L90 166 L34 160Z"/><path class="g-trim" d="M46 40 L154 40 L155 54 L45 54Z"/><path class="g-star" d="M140 140 l4 -10 l4 10 l10 1 l-8 6 l3 10 l-9 -6 l-9 6 l3 -10 l-8 -6Z"/>`,
  'Socks': `<path class="g-fill" d="M76 20 L124 20 L124 128 Q124 150 146 158 L162 164 Q178 172 172 186 Q166 196 146 192 L92 180 Q72 176 74 154 L76 128Z"/><path class="g-trim" d="M76 20 L124 20 L124 34 L76 34Z"/><path class="g-trim" d="M76 48 L124 48 L124 54 L76 54Z"/>`,
  'Cheer top': `<path class="g-fill" d="M66 26 L48 34 Q52 70 46 92 L46 176 L154 176 L154 92 Q148 70 152 34 L134 26 Q100 92 66 26Z"/><path class="g-trim" d="M46 120 L100 150 L154 120 L154 134 L100 164 L46 134Z"/>`,
  'Skort': `<path class="g-trim" d="M62 36 L138 36 L140 54 L60 54Z"/><path class="g-fill" d="M60 54 L140 54 L170 164 L30 164Z"/><path class="g-line" d="M80 54 L66 164 M100 54 L100 164 M120 54 L134 164"/><path class="g-trim" d="M34 150 L166 150 L170 164 L30 164Z"/>`,
  'Sleeveless shell': `<path class="g-fill" d="M68 24 L50 30 Q56 66 48 90 L48 176 L152 176 L152 90 Q144 66 150 30 L132 24 Q100 70 68 24Z"/><path class="g-trim" d="M68 24 Q100 70 132 24 L124 22 Q100 58 76 22Z"/>`,
  'Mock turtleneck': `<path class="g-fill" d="M74 34 L50 42 L26 150 L44 156 L58 90 L58 176 L142 176 L142 90 L156 156 L174 150 L150 42 L126 34Z"/><path class="g-trim" d="M76 16 L124 16 L126 36 Q100 44 74 36Z"/>`
};
// where the measuring arrows sit on each drawing (y positions)
const ARROWS = {
  'Jersey': [[56, 144, 92, 'Chest']], 'Shorts': [[46, 154, 47, 'Waist'], [40, 160, 84, 'Hip']],
  'Socks': [], 'Cheer top': [[50, 150, 92, 'Chest']], 'Skort': [[62, 138, 45, 'Waist'], [50, 150, 96, 'Hip']],
  'Sleeveless shell': [[50, 150, 96, 'Chest']], 'Mock turtleneck': [[58, 142, 96, 'Chest']]
};
const garmentSvg = g => {
  const arrows = (ARROWS[g] || []).map(([x1, x2, y, label]) => `<g class="g-arrow"><path d="M${x1 + 6} ${y} L${x2 - 6} ${y}"/><path d="M${x1 + 12} ${y - 5} L${x1 + 5} ${y} L${x1 + 12} ${y + 5} M${x2 - 12} ${y - 5} L${x2 - 5} ${y} L${x2 - 12} ${y + 5}"/><rect x="${(x1 + x2) / 2 - 24}" y="${y - 9}" width="48" height="18" rx="9"/><text x="${(x1 + x2) / 2}" y="${y + 4}">${esc(label)}</text></g>`).join('');
  return `<svg class="garment" viewBox="0 0 200 200" aria-hidden="true">${GARMENTS[g] || GARMENTS['Jersey']}${arrows}</svg>`;
};
const CROP = { 'Top': 'center top', 'Upper third': 'center 30%', 'Center': 'center', 'Lower third': 'center 70%', 'Bottom': 'center bottom' };
const COLORS = { Blue: 'blue', Orange: 'orange', Magenta: 'magenta', Purple: 'purple', Navy: 'navy' };

// ---------- sections ----------
const h = c.hero;
const hero = `
  <section class="hero" id="top" aria-labelledby="hero-h">
    <div class="hero-field" aria-hidden="true"></div>
    <div class="wrap hero-grid">
      <div class="hero-copy">
        <p class="eyebrow light">${txt(h.eyebrow)}</p>
        <h1 id="hero-h">${txt(h.heading).replace(/game\./, '<span class="hl">game.</span>')}</h1>
        <p class="lead">${fmt(h.text)}</p>
        <div class="sport-cards">
          <a class="sport-card soccer" href="#soccer">
            <span class="sc-icon">${icon('ball')}</span>
            <span class="sc-body"><span class="sc-season">${txt(h.soccerCard.season)}</span><span class="sc-label">${txt(h.soccerCard.label)}</span><span class="sc-text">${txt(h.soccerCard.text)}</span></span>
            ${icon('arrow', 'i sc-go')}
          </a>
          <a class="sport-card football" href="#football">
            <span class="sc-icon">${icon('football')}</span>
            <span class="sc-body"><span class="sc-season">${txt(h.footballCard.season)}</span><span class="sc-label">${txt(h.footballCard.label)}</span><span class="sc-text">${txt(h.footballCard.text)}</span></span>
            ${icon('arrow', 'i sc-go')}
          </a>
        </div>
      </div>
      <div class="hero-photo">
        <div class="photo-frame"><img src="${img(h.photo)}" alt="${esc(h.photoAlt)}" width="900" height="700" fetchpriority="high"></div>
        <div class="hero-ball" aria-hidden="true">${icon('soccer-ball', 'ball-svg')}</div>
        <div class="hero-sticker" aria-hidden="true"><svg class="whistle"><use href="#i-whistle-solid"/></svg><span>Everyone<br>plays</span></div>
      </div>
    </div>
  </section>`;

const why = `
  <section class="why" aria-labelledby="why-h">
    <div class="wrap">${sectionHead(c.why, 'why')}
      <ul class="why-grid">
${c.why.items.map((x, i) => `        <li class="why-card reveal" style="--d:${i * 70}ms"><span class="why-icon">${icon(x.icon)}</span><h3>${txt(x.title)}</h3><p>${fmt(x.text)}</p></li>`).join('\n')}
      </ul>
    </div>
  </section>`;

const datesList = (x) => `
          <ol class="timeline">
${x.dates.map(d => `            <li class="reveal"><span class="t-dot" aria-hidden="true"></span><p class="t-label">${txt(d.label)}</p><p class="t-date${d.date ? '' : ' soon'}">${txt(d.date || SOON)}</p>${d.place ? `<p class="t-place">${icon('pin')}${txt(d.place)}</p>` : ''}${d.note ? `<p class="t-note">${fmt(d.note)}</p>` : ''}</li>`).join('\n')}
          </ol>
          ${x.datesNote ? `<p class="small-note">${icon('alert')}${fmt(x.datesNote)}</p>` : ''}`;

const regCard = (x, sport) => {
  const window_ = x.registrationOpens || x.registrationCloses
    ? `<p class="reg-window">${x.registrationOpens ? `Opens <strong>${txt(x.registrationOpens)}</strong>` : ''}${x.registrationOpens && x.registrationCloses ? '<br>' : ''}${x.registrationCloses ? `Closes <strong>${txt(x.registrationCloses)}</strong>` : ''}</p>`
    : `<p class="reg-window">Registration dates coming&nbsp;soon</p>`;
  return `
        <aside class="reg-card ${sport}" aria-label="${esc(x.heading)} registration">
          <p class="reg-season">${txt(x.eyebrow)}</p>
          <p class="price"><span class="amt">${esc(money(x.price))}</span> <span>${txt(x.priceNote)}</span></p>
          ${x.lateFee ? `<p class="late">Late registration: ${esc(money(x.lateFee))} after the&nbsp;deadline.</p>` : ''}
          ${window_}
          <a class="btn btn-big" href="${esc(x.registerUrl)}"${ext(x.registerUrl)}>Register now ${icon('arrow')}</a>
          <p class="reg-note">${fmt(x.registrationNotes)}</p>
        </aside>`;
};
const kitBlock = (title, items, bring) => `
          <div class="kit reveal">
            <h4>${icon('shirt')}${txt(title)}</h4>
            <ul>${items.map(i => `<li>${icon('check')}${txt(i)}</li>`).join('')}</ul>
            <p class="bring"><strong>You bring:</strong> ${fmt(bring)}</p>
          </div>`;

const sportSection = (x, id, sport, art) => `
  <section class="sport ${sport}" id="${id}" aria-labelledby="${id}-h">
    <div class="wrap">
      <div class="sport-top">
        <div>${x.logo ? `
          <img class="sport-logo" src="${img(x.logo)}" alt="" width="189" height="52">` : ''}
          <p class="eyebrow">${txt(x.eyebrow)}</p>
          <h2 id="${id}-h">${txt(x.heading)}</h2>
          <p class="sport-intro">${fmt(x.intro)}</p>
        </div>
        <div class="sport-art" aria-hidden="true">${art}</div>
      </div>${x.photo ? `
      <figure class="sport-photo reveal" style="--pos:${esc(CROP[x.photoCrop] || 'center')}"><img src="${img(x.photo)}" alt="${esc(x.photoAlt)}" width="1800" height="1202" loading="lazy"></figure>` : ''}
      <div class="sport-grid">
        <div class="sport-main">
          <h3 class="sub">${icon('people')}Who can play</h3>
          <div class="who">
${x.who.map(w => `            <div class="who-item reveal"><h4>${txt(w.title)}</h4><p>${fmt(w.text)}</p></div>`).join('\n')}
          </div>
          <h3 class="sub">${icon('clock')}Time commitment</h3>
          <ul class="sched">
${x.schedule.map(s => `            <li class="reveal"><span class="s-icon">${icon(s.icon)}</span><div><h4>${txt(s.title)}</h4><p>${fmt(s.text)}</p></div></li>`).join('\n')}
          </ul>
          <h3 class="sub">${icon('shirt')}What's included</h3>
          <div class="kits">${x.kits ? x.kits.map(k => kitBlock(k.title, k.items, k.bring)).join('') : kitBlock('Player kit', x.kit, x.bring)}
          </div>
          <p class="size-link"><a href="#sizing">${icon('ruler')}See the uniform size&nbsp;charts</a></p>
        </div>
        <div class="sport-side">${regCard(x, sport)}
        </div>
      </div>
      <div class="dates">
        <h3 class="sub">${icon('calendar')}Key dates</h3>${datesList(x)}
      </div>
    </div>
  </section>`;

const soccerArt = `
          <svg class="roll-scene" viewBox="0 0 420 140">
            <path class="grass" d="M0 118 H420"/>
            <g class="goal"><path d="M330 116 V40 H410 V116"/><path class="net" d="M340 40 V116 M352 40 V116 M364 40 V116 M376 40 V116 M388 40 V116 M400 40 V116 M330 56 H410 M330 72 H410 M330 88 H410 M330 104 H410"/></g>
            <g class="roller"><use href="#i-soccer-ball" x="-22" y="74" width="44" height="44"/></g>
          </svg>`;
const footballArt = `
          <svg class="kick-scene" viewBox="0 0 420 160">
            <path class="grass" d="M0 150 H420"/>
            <g class="posts"><path d="M330 150 V100 M290 100 H370 M290 100 V18 M370 100 V18"/></g>
            <g class="kicked"><use href="#i-football-solid" x="-18" y="-12" width="36" height="24"/></g>
            <g class="poms"><g class="pom p1"><use href="#i-pom-solid" x="0" y="0" width="56" height="56"/></g><g class="pom p2"><use href="#i-pom-solid" x="0" y="0" width="56" height="56"/></g></g>
          </svg>`;

const sz = c.sizing;
const sizing = `
  <section class="sizing" id="sizing" aria-labelledby="sizing-h">
    <div class="wrap">${sectionHead(sz, 'sizing', `\n        <p class="sec-text">${fmt(sz.text)}</p>`)}
      <div class="size-tabs" role="tablist" aria-label="Sport">
${sz.groups.map((g, gi) => `        <button role="tab" id="sg-${gi}" class="size-tab ${COLORS[g.color] || 'blue'}" aria-selected="${gi === 0}" aria-controls="sgp-${gi}"${gi ? ' tabindex="-1"' : ''}>${txt(g.name)}</button>`).join('\n')}
      </div>
${sz.groups.map((g, gi) => `      <div class="size-group ${COLORS[g.color] || 'blue'}" role="tabpanel" id="sgp-${gi}" aria-labelledby="sg-${gi}"${gi ? ' hidden' : ''}>
        <div class="garment-picks">
${g.charts.map((ch, ci) => `          <button class="pick" aria-pressed="${ci === 0}" data-chart="ch-${gi}-${ci}">${garmentSvg(ch.garment)}<span>${txt(ch.name)}</span></button>`).join('\n')}
        </div>
${g.charts.map((ch, ci) => `        <div class="chart" id="ch-${gi}-${ci}"${ci ? ' hidden' : ''}>
          <figure class="chart-art">${garmentSvg(ch.garment)}<figcaption>Measure: <strong>${txt(ch.measure)}</strong></figcaption></figure>
          <div class="table-wrap">
            <table>
              <caption>${txt(ch.name)} sizes${ch.columns.length > 2 && ch.measure !== 'Shoe size' ? ' (inches)' : ''}</caption>
              <thead><tr>${ch.columns.map(col => `<th scope="col">${esc(col)}</th>`).join('')}</tr></thead>
              <tbody>
${ch.rows.map(r => `                <tr${/^A/.test(r.cells[0]) && /^Y/.test(ch.rows[0].cells[0]) && ch.rows.find(x => /^A/.test(x.cells[0])) === r ? ' class="adult-start"' : ''}>${r.cells.map((cell, k) => k === 0 ? `<th scope="row">${esc(cell)}</th>` : `<td>${esc(cell)}</td>`).join('')}</tr>`).join('\n')}
              </tbody>
            </table>
          </div>
        </div>`).join('\n')}
      </div>`).join('\n')}
      <p class="small-note">${fmt(sz.note)}</p>
    </div>
  </section>`;

// age chart: calculated from the fall year, never typed by staff
const a = c.ages;
const Y = Number(a.fallYear);
const ageRows = [];
for (let k = Number(a.youngest); k <= Number(a.oldest); k++) ageRows.push({ k, from: `8/1/${Y - k}`, to: `7/31/${Y - k + 1}`, years: `${Y - k}-${Y - k + 1}` });
const ages = `
  <section class="ages" id="ages" aria-labelledby="ages-h">
    <div class="wrap ages-grid">
      <div>${sectionHead(a, 'ages', `\n        <p class="sec-text">${fmt(a.text)}</p>`)}
        <form class="age-finder" data-fall="${Y}" data-min="${a.youngest}" data-max="${a.oldest}" onsubmit="return false">
          <label for="bday">Child's birthday</label>
          <div class="af-row"><input id="bday" type="date" min="${Y - Number(a.oldest)}-08-01" max="${Y - Number(a.youngest) + 1}-07-31"><output class="af-out" for="bday" aria-live="polite"><span class="af-div">--</span><span class="af-cap">Age group</span></output></div>
        </form>
      </div>
      <details class="age-chart">
        <summary>Full age chart: Fall ${Y} to Spring ${Y + 1}</summary>
        <div class="table-wrap"><table>
          <thead><tr><th scope="col">Age group</th><th scope="col">Birth years</th><th scope="col">Birthdays from</th></tr></thead>
          <tbody>
${ageRows.map(r => `            <tr><th scope="row">${r.k}U</th><td>${r.years}</td><td>${r.from} to ${r.to}</td></tr>`).join('\n')}
          </tbody>
        </table></div>
      </details>
    </div>
  </section>`;

const t = c.teams;
const teams = `
  <section class="teams" id="teams" aria-labelledby="teams-h">
    <div class="wrap teams-grid">
      <div>${sectionHead(t, 'teams', `\n        <p class="sec-text">${fmt(t.text)}</p>`)}
      </div>
      <div class="faq">
${t.questions.map(q => `        <details class="reveal"><summary>${txt(q.question)}${icon('plus')}</summary><p>${fmt(q.answer)}</p></details>`).join('\n')}
      </div>
    </div>
  </section>`;

const v = c.volunteer;
const sportClass = s => ({ Soccer: 'soccer', Football: 'football', Cheer: 'cheer' }[s] || 'soccer');
const volunteer = `
  <section class="volunteer" id="volunteer" aria-labelledby="volunteer-h">
    <div class="wrap">${sectionHead(v, 'volunteer', `\n        <p class="sec-text">${fmt(v.text)}</p>`)}
      <ul class="roles">
${v.roles.map((r, i) => `        <li class="role reveal" style="--d:${i * 60}ms"><span class="why-icon">${icon(r.icon)}</span><h3>${txt(r.title)}</h3><p>${fmt(r.text)}</p></li>`).join('\n')}
      </ul>
      <div class="vol-actions">
        <a class="btn soccer" href="${esc(c.soccer.volunteerUrl)}"${ext(c.soccer.volunteerUrl)}>${icon('ball')}Volunteer for soccer</a>
        <a class="btn football" href="${esc(c.football.volunteerUrl)}"${ext(c.football.volunteerUrl)}>${icon('football')}Volunteer for flag football &amp;&nbsp;cheer</a>
      </div>
      <figure class="bigquote reveal"><blockquote>${txt('“' + v.quote + '”')}</blockquote><figcaption>${txt(v.quoteBy)}</figcaption></figure>
      <h3 class="sub">${icon('calendar')}${txt(v.trainingsHeading)}</h3>
      <ul class="trainings">
${v.trainings.map(x => `        <li class="${sportClass(x.sport)} reveal"><span class="tag">${txt(x.sport)}</span><h4>${txt(x.title)}</h4><p class="t-date${x.date ? '' : ' soon'}">${txt(x.date || SOON)}${x.time ? ` · ${txt(x.time)}` : ''}</p><p class="t-place">${icon('pin')}${txt(x.place)}</p></li>`).join('\n')}
      </ul>
      <p class="small-note">${fmt(v.trainingsNote)}</p>
    </div>
  </section>`;

const ct = c.contact;
const contact = `
  <section class="testimonial" aria-label="What families say">
    <div class="wrap"><figure class="reveal"><blockquote>${txt('“' + ct.testimonial + '”')}</blockquote><figcaption>${txt(ct.testimonialBy)}</figcaption></figure></div>
  </section>
  <section class="contact" id="contact" aria-labelledby="contact-h">
    <div class="wrap contact-grid">
      <div>${sectionHead(ct, 'contact', `\n        <p class="sec-text">${fmt(ct.text)}</p>`)}
        <div class="contact-btns">
          <a class="btn btn-light" href="mailto:${esc(ct.email)}">${icon('mail')}${esc(ct.email)}</a>
          <a class="btn btn-light" href="${smsLink(ct.phone)}">${icon('phone')}Text ${esc(ct.phone)}</a>
        </div>
      </div>
      <ul class="locations">
${ct.locations.map(l => `        <li><span class="why-icon">${icon('pin')}</span><div><h3>${txt(l.name)}</h3><p class="addr">${esc(l.address)}</p><p>${fmt(l.note)}</p><a class="dir-link" href="${mapLink(l.address)}" target="_blank" rel="noopener">Get directions</a></div></li>`).join('\n')}
      </ul>
    </div>
  </section>`;

const content = [hero, why, sportSection(c.soccer, 'soccer', 'soccer', soccerArt), sportSection(c.football, 'football', 'football', footballArt), sizing, ages, teams, volunteer, contact].join('\n');

let out = fs.readFileSync(path.join(ROOT, 'src', 'template.html'), 'utf8');
const vars = {
  TITLE: esc(c.seo.title), DESC: esc(c.seo.description), OG_IMAGE: 'https://upwardomaha.com' + img(c.seo.shareImage),
  CONTENT: content, FOOTER: fmt(c.seo.footer), YEAR: String(new Date().getFullYear()),
  EMAIL: esc(ct.email), PHONE: esc(ct.phone), SMS: smsLink(ct.phone),
  SOCCER_REG: esc(c.soccer.registerUrl), FOOTBALL_REG: esc(c.football.registerUrl),
  SOCCER_SEASON: txt(c.soccer.eyebrow), FOOTBALL_SEASON: txt(c.football.eyebrow)
};
out = out.replace(/\{\{([A-Z_]+)\}\}/g, (m, k) => (k in vars ? vars[k] : m));
fs.writeFileSync(path.join(ROOT, 'index.html'), out);
console.log('Built index.html (' + Math.round(out.length / 1024) + ' KB)');
