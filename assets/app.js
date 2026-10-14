const { units, title, subtitle } = window.SITE;
const $ = (s) => document.querySelector(s);
const link = (u, s) => `lesson.html?u=${u.id}&s=${s.id}`;

if ($('#units')) {
  $('#units').innerHTML = units.map(u => `
    <section class="unit" style="--c:${u.color}">
      <div class="unit-head"><span class="badge">${u.id}</span><div><h2>${u.title}</h2><p>${u.desc}</p></div></div>
      <ul>${u.subunits.map(s => `<li><a href="${link(u, s)}">${s.title}</a></li>`).join('')}</ul>
    </section>`).join('');
}

if ($('#page')) {
  const q = new URLSearchParams(location.search);
  const u = units.find(x => x.id == q.get('u')) || units[0];
  const s = u.subunits.find(x => x.id == q.get('s')) || u.subunits[0];
  const flat = units.flatMap(x => x.subunits.map(y => [x, y]));
  const i = flat.findIndex(([x, y]) => x === u && y === s);
  document.title = `${s.title} · ${u.title}`;
  document.documentElement.style.setProperty('--c', u.color);
  $('#crumb').textContent = `/ مجزوءة ${u.title}`;
  const nav = (p, label) => p ? `<a href="${link(p[0], p[1])}">${label} ${p[1].title}</a>` : '<span></span>';
  $('#pager').innerHTML = nav(flat[i - 1], 'السابق:') + nav(flat[i + 1], 'التالي:');
  // no-cache: always get the latest edited lesson (GitHub Pages otherwise lets browsers keep the old file ~10 min)
  fetch(s.file, { cache: 'no-cache' }).then(r => { if (!r.ok) throw 0; return r.text(); }).then(html => {
    // Accepts a fragment OR a full standalone page: only the hero + sections are kept, so the site's own style always applies
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const labels = {};
    doc.querySelectorAll('nav a[href^="#"]').forEach(a => labels[a.getAttribute('href').slice(1)] = a.textContent.trim());
    const page = $('#page'); page.replaceChildren();
    const hero = doc.querySelector('.hero'); if (hero) page.append(hero);
    doc.querySelectorAll('section[id]').forEach(sec => page.append(sec));
    if (!page.children.length) page.append(...doc.body.childNodes);
    const items = [...page.querySelectorAll('section[id]')].map(e =>
      `<li><a href="#${e.id}">${e.dataset.nav || labels[e.id] || e.querySelector('h2').textContent}</a></li>`).join('');
    const bar = document.createElement('nav');
    bar.className = 'topnav'; bar.setAttribute('aria-label', 'التنقل داخل الصفحة');
    bar.innerHTML = `<div class="wrap"><ul>${items}</ul></div>`;
    const h = page.querySelector('.hero'); h ? h.after(bar) : page.prepend(bar);
    if (location.hash) document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView();
  }).catch(() => $('#page').innerHTML = `<p class="wrap">تعذّر تحميل الدرس. تأكد أن الملف <code>${s.file}</code> موجود.</p>`);
}
