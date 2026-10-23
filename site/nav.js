/* Headroom spec site: one sidebar for every page.
   Top: the five stages. Middle: this page's sections. Bottom: the other stages,
   theme, tokens download. Also owns theme switching and section highlighting.
   Pages mark sections with <section id> (+ optional data-toc-label / data-toc-group)
   or group headings with <h2 class="grp">. Load after the page's own script. */
(function () {
  const STAGES = [
    ['index.html', 'Foundations', 'Color, type, spacing and motion'],
    ['components.html', 'Components', '35 components in every state'],
    ['content.html', 'Voice', 'Tone, writing guides and formatting'],
    ['patterns.html', 'Patterns', 'Five flows, storyboarded'],
    ['proof.html', 'Proof', 'Four screens with a live token audit'],
  ];
  const side = document.querySelector('aside.side');
  if (!side) return;
  const page = side.dataset.page || 'index.html';
  const idx = STAGES.findIndex(s => s[0] === page);
  const ic = (n, s = 18) => `<i data-lucide="${n}" style="width:${s}px;height:${s}px"></i>`;

  /* ---------- sections from the page ---------- */
  const items = [];
  if (page === 'proof.html') items.push({ group: 'Screens' });
  document.querySelectorAll('main h2.grp, main section[id]').forEach(el => {
    if (el.matches('h2.grp')) { items.push({ group: el.textContent.trim() }); if (el.dataset.tocLink && el.id) items.push({ id: el.id, label: el.dataset.tocLink }); return; }
    if (el.dataset.toc === 'skip') return;
    if (el.dataset.tocGroup) items.push({ group: el.dataset.tocGroup });
    const h = el.querySelector('h2, h3');
    const label = el.dataset.tocLabel || (h ? h.textContent.trim() : el.id);
    items.push({ id: el.id, label: label.replace(/ \(clearance gauge\)$/, '') });
  });

  side.innerHTML = `
    <div class="side-top">
      <a class="brand" href="index.html"><span class="mark" aria-hidden="true"></span><span>Headroom<small>Design system</small></span></a>
      <button class="side-menu" type="button" aria-expanded="false" aria-controls="side-panel">${ic('menu', 20)}<span>Sections</span></button>
    </div>
    <nav class="stages" aria-label="Stages">${STAGES.map(([h, n], i) => `<a href="${h}" data-short="${['Base', 'Parts', 'Voice', 'Flows', 'Proof'][i]}" ${i === idx ? 'aria-current="page"' : ''}><b>${i + 1}</b>${n}</a>`).join('')}</nav>
    <div class="side-panel" id="side-panel">
      <div class="toc-scroll"><nav aria-label="On this page"><p class="side-h">${STAGES[idx][1]}</p><ul class="toc">${items.map(it => it.group ? `<li class="g">${it.group}</li>` : `<li><a href="#${it.id}">${it.label}</a></li>`).join('')}</ul></nav></div>
      <div class="side-foot">
        <p class="side-h">Other stages</p>
        <ul class="others">${STAGES.map(([h, n, d], i) => i === idx ? '' : `<li><a href="${h}"><span>Stage ${i + 1}: ${n}</span><small>${d}</small>${ic('arrow-right', 16)}</a></li>`).join('')}</ul>
        <div class="motion-row"><span id="mo-l">Motion</span><div class="theme mo" role="group" aria-labelledby="mo-l"><button type="button" data-m="full">Full</button><button type="button" data-m="reduce">Reduced</button></div></div>
        <div class="foot-row"><div class="theme" role="group" aria-label="Theme"><button type="button" data-t="light">Light</button><button type="button" data-t="dark">Dark</button><button type="button" data-t="system">Auto</button></div><a class="dl" href="../tokens/tokens.json" download title="Download tokens.json" aria-label="Download tokens.json">${ic('download', 18)}</a></div>
      </div>
    </div>`;

  /* ---------- theme ---------- */
  const root = document.documentElement;
  function setTheme(t, announce = true) {
    try { localStorage.setItem('hr-theme', t); } catch (e) {}
    if (t === 'system') root.removeAttribute('data-theme'); else root.setAttribute('data-theme', t);
    side.querySelectorAll('.theme button[data-t]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.t === t)));
    if (announce) document.dispatchEvent(new CustomEvent('hr:theme', { detail: t }));
  }
  let saved = 'system';
  try { saved = localStorage.getItem('hr-theme') || 'system'; } catch (e) {}
  const q = new URLSearchParams(location.search).get('theme');
  if (['light', 'dark', 'system'].includes(q)) saved = q;
  setTheme(saved, false);
  side.querySelectorAll('.theme button[data-t]').forEach(b => b.addEventListener('click', () => setTheme(b.dataset.t)));
  window.hrSetTheme = setTheme;

  /* ---------- motion: the OS setting is the default, the sidebar can override it ---------- */
  function setMotion(m, store = true) {
    if (store) { try { localStorage.setItem('hr-motion', m); } catch (e) {} }
    root.dataset.motion = m;
    side.querySelectorAll('.mo button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.m === m)));
    document.dispatchEvent(new CustomEvent('hr:motion', { detail: m }));
  }
  let mo = null;
  try { mo = localStorage.getItem('hr-motion'); } catch (e) {}
  setMotion(mo || (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'full'), false);
  side.querySelectorAll('.mo button').forEach(b => b.addEventListener('click', () => { setMotion(b.dataset.m); if (b.dataset.m === 'full' && window.hrMotionReplay) hrMotionReplay(document); }));
  window.hrSetMotion = setMotion;

  /* ---------- mobile panel ---------- */
  const btn = side.querySelector('.side-menu');
  const close = () => { side.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); };
  btn.addEventListener('click', () => { const o = !side.classList.contains('open'); side.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); });
  side.querySelectorAll('.toc a').forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

  /* ---------- current section ---------- */
  const links = [...side.querySelectorAll('.toc a')];
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => {
      const on = a.getAttribute('href') === '#' + e.target.id;
      a.setAttribute('aria-current', String(on));
      if (on && matchMedia('(min-width: 840px)').matches) {
        const p = side.querySelector('.toc-scroll'), r = a.getBoundingClientRect(), pr = p.getBoundingClientRect();
        if (r.top < pr.top + 40 || r.bottom > pr.bottom - 40) p.scrollTo({ top: p.scrollTop + r.top - pr.top - pr.height / 3, behavior: 'smooth' });
      }
    });
  }), { rootMargin: '-30% 0px -60% 0px' });
  items.forEach(it => it.id && document.getElementById(it.id) && io.observe(document.getElementById(it.id)));

  if (window.lucide) lucide.createIcons();
})();
