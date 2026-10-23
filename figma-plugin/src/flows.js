/* ================= Stage 6: user flows =================
   Appended to builder.js by tools/build_plugin.py. Uses the helpers defined there.
   Screens are top-level frames inside one Section per flow, so prototype links can target them. */

const SCR_W = 390, SCR_H = 844, SB_H = 47;
const NAV_TARGET = { Home: '4.01', Activity: '8.01', Budgets: '6.02', Goals: '7.04' };

/* ---------- proposed components the flows needed ---------- */
async function buildFlowComponents() {
  const p = await page('Components · Flows (proposed)');
  const col = column(p);
  const stage = async (title, why, kids, w = 1184) => {
    const b = await board(title + ' · proposed', why);
    const st = frame('stage', 'HORIZONTAL', 0, { align: 'MIN' }); st.layoutWrap = 'WRAP'; sp(st, 'itemSpacing', 24); sp(st, 'counterAxisSpacing', 24);
    fill(st, 'color/surface/canvas'); rad(st, 'lg'); stroke(st, 'color/border/subtle', 1, { dash: [4, 4] }); pad(st, 32); fixedW(st, w);
    for (const k of kids) st.appendChild(k);
    b.appendChild(st); col.appendChild(b); return b;
  };
  const why = n => (DATA.flows.proposed.find(x => x[0] === n) || [n, ''])[1];

  // Device chrome (not product components, needed to make screens read as a phone)
  { const c = comp('Device · Status bar', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'SPACE_BETWEEN' }); fixed(c, SCR_W, SB_H); pad(c, 16, 24, 0, 32); c.primaryAxisAlignItems = 'SPACE_BETWEEN'; c.fills = [];
    c.appendChild(await text('9:41', 'type/label-lg', 'color/text/primary', { name: 'time' }));
    const r = frame('icons', 'HORIZONTAL', 6, { align: 'CENTER' }); add(r, icon('signal', 16), icon('wifi', 16), icon('battery-full', 20)); c.appendChild(r);
    const h = comp('Device · Home indicator', 'HORIZONTAL', 0, { align: 'MAX', justify: 'CENTER' }); fixed(h, SCR_W, 34); h.fills = []; pad(h, 0, 0, 8, 0); h.appendChild(rect(134, 5, 'color/text/primary', 'full'));
    await stage('Device chrome', 'Status bar and home indicator so screens read as a phone in prototypes. Not shipped as product components.', [c, h]); }

  // Phone field
  { const vs = [];
    for (const st of ['Default', 'Filled', 'Error']) {
      const c = comp(`State=${st}`, 'VERTICAL', 6); fixedW(c, 358);
      c.appendChild(await text('Mobile number', 'type/label-md', 'color/text/primary', { name: 'label' }));
      const box = frame('field', 'HORIZONTAL', 12, { align: 'CENTER' }); fixedH(box, 56); pad(box, 0, 16); rad(box, 'md'); fill(box, 'color/surface/sunken');
      stroke(box, st === 'Error' ? 'color/status/danger' : st === 'Filled' ? 'color/border/focus' : 'color/border/default', st === 'Default' ? 1 : 2);
      box.appendChild(await text('+91', 'type/body-lg', 'color/text/primary', { name: 'prefix' })); box.appendChild(rect(1, 24, 'color/border/default'));
      const v = await text(st === 'Default' ? '98765 43210' : st === 'Filled' ? '98765 43210' : '98765 4321', 'type/body-lg', st === 'Default' ? 'color/text/secondary' : 'color/text/primary', { name: 'value' }); box.appendChild(v); v.layoutGrow = 1;
      c.appendChild(box); fillW(box);
      if (st === 'Error') { const e = frame('error', 'HORIZONTAL', 6, { align: 'CENTER' }); add(e, icon('circle-alert', 16, 'color/status/danger'), await text('Enter a 10-digit mobile number', 'type/body-sm', 'color/status/danger', { name: 'helper' })); c.appendChild(e); }
      else c.appendChild(await text('We’ll text you a 6-digit code. Standard SMS rates may apply.', 'type/body-sm', 'color/text/secondary', { name: 'helper', width: 358 }));
      vs.push(c);
    }
    const cs = await setOf(vs, 'Phone field', 1120); cs.description = why('Phone field'); await stage('Phone field', why('Phone field'), [cs]); }

  // Code input
  { const vs = [];
    for (const st of ['Empty', 'Filled', 'Error', 'Locked']) {
      const c = comp(`State=${st}`, 'VERTICAL', 8); fixedW(c, 358);
      const row = frame('boxes', 'HORIZONTAL', 8); sp(row, 'itemSpacing', 8);
      const digits = st === 'Empty' ? '' : st === 'Filled' ? '482913' : st === 'Error' ? '482931' : '';
      for (let i = 0; i < 6; i++) {
        const b = frame('box ' + (i + 1), 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(b, 50, 60); rad(b, 'md');
        fill(b, st === 'Locked' ? 'color/surface/sunken' : 'color/surface/default');
        stroke(b, st === 'Error' ? 'color/status/danger' : st === 'Locked' ? 'color/border/subtle' : (st === 'Empty' && i === 0) ? 'color/border/focus' : 'color/border/default', (st === 'Error' || (st === 'Empty' && i === 0)) ? 2 : 1);
        if (digits[i]) b.appendChild(await text(digits[i], 'type/amount/lg', 'color/text/primary'));
        row.appendChild(b);
      }
      c.appendChild(row);
      const msg = st === 'Error' ? ['circle-alert', 'That code didn’t match. 2 tries left.', 'color/status/danger'] : st === 'Locked' ? ['lock', 'Too many tries. Try again at 10:52 am.', 'color/text/secondary'] : null;
      if (msg) { const e = frame('message', 'HORIZONTAL', 6, { align: 'CENTER' }); add(e, icon(msg[0], 16, msg[2]), await text(msg[1], 'type/body-sm', msg[2], { name: 'helper' })); c.appendChild(e); }
      vs.push(c);
    }
    const cs = await setOf(vs, 'Code input', 1120); cs.description = why('Code input'); await stage('Code input', why('Code input'), [cs]); }

  // Progress steps
  { const c = comp('Progress steps', 'VERTICAL', 0); fixedW(c, 358);
    for (const [st, t, sub] of [['done', 'Linking HDFC Savings', 'Done'], ['current', 'Fetching 12 months of transactions', 'About 20 seconds'], ['waiting', 'Sorting into categories', 'Next']]) {
      const r = frame(t, 'HORIZONTAL', 0, { align: 'MIN' }); sp(r, 'itemSpacing', 12); pad(r, 12, 0);
      const dot = frame('state', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(dot, 28, 28); rad(dot, 'full');
      if (st === 'done') { fill(dot, 'color/status/success'); dot.appendChild(icon('check', 16, 'color/action/on-primary')); }
      else if (st === 'current') { fill(dot, 'color/action/secondary'); stroke(dot, 'color/action/primary', 2); dot.appendChild(ellipse(8, 'color/action/primary')); }
      else { stroke(dot, 'color/border/default', 2); }
      const tx = frame('text', 'VERTICAL', 0); sp(tx, 'itemSpacing', 2);
      add(tx, await text(t, 'type/label-lg', st === 'waiting' ? 'color/text/secondary' : 'color/text/primary', { name: 'title' }), await text(sub, 'type/body-sm', 'color/text/secondary', { name: 'subtitle' }));
      add(r, dot, tx); c.appendChild(r);
    }
    c.description = why('Progress steps'); await stage('Progress steps', why('Progress steps'), [c]); }

  // Consent summary
  { const c = comp('Consent summary', 'VERTICAL', 0); fixedW(c, 358); rad(c, 'lg'); fill(c, 'color/surface/raised'); stroke(c, 'color/border/subtle'); c.clipsContent = true;
    for (const [ic, l, v] of [['receipt', 'What', 'Transactions and balance'], ['history', 'How far back', 'Last 12 months'], ['refresh-cw', 'How often', 'Once a day'], ['calendar', 'For how long', 'Until 18 Oct 2027'], ['target', 'Why', 'To show your spending and headroom']]) {
      const r = frame(l, 'HORIZONTAL', 0, { align: 'MIN' }); sp(r, 'itemSpacing', 12); pad(r, 12, 16); stroke(r, 'color/border/subtle'); r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0;
      const tx = frame('text', 'VERTICAL', 0); sp(tx, 'itemSpacing', 2); add(tx, await text(l, 'type/body-sm', 'color/text/secondary'), await text(v, 'type/label-lg', 'color/text/primary', { name: 'value', width: 290 }));
      add(r, icon(ic, 20, 'color/text/secondary'), tx); c.appendChild(r); fillW(r);
    }
    c.description = why('Consent summary'); await stage('Consent summary', why('Consent summary'), [c]); }

  // Bank tile
  { const vs = [];
    for (const sel of ['false', 'true']) {
      const c = comp(`Selected=${sel}`, 'VERTICAL', 8, { align: 'CENTER' }); fixed(c, 108, 96); c.primaryAxisAlignItems = 'CENTER'; rad(c, 'md'); fill(c, sel === 'true' ? 'color/action/secondary' : 'color/surface/raised'); stroke(c, sel === 'true' ? 'color/action/primary' : 'color/border/subtle', sel === 'true' ? 2 : 1);
      const a = frame('logo', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(a, 40, 40); rad(a, 'md'); fill(a, 'color/surface/sunken'); a.appendChild(await text('HD', 'type/label-md', 'color/text/primary', { name: 'initials' }));
      add(c, a, await text('HDFC Bank', 'type/label-md', 'color/text/primary', { name: 'name' })); vs.push(c);
    }
    const cs = await setOf(vs, 'Bank tile', 520); textProp(cs, 'Bank', 'name', 'HDFC Bank'); textProp(cs, 'Initials', 'initials', 'HD'); cs.description = why('Bank tile'); await stage('Bank tile', why('Bank tile'), [cs]); }

  // System notification
  { const c = comp('System notification', 'HORIZONTAL', 12, { align: 'MIN' }); fixedW(c, 358); pad(c, 16); rad(c, 'xl'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/2');
    const ic = frame('app icon', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(ic, 38, 38); rad(ic, 'md'); fill(ic, 'color/action/primary'); ic.appendChild(icon('gauge', 22, 'color/action/on-primary'));
    const tx = frame('text', 'VERTICAL', 0); sp(tx, 'itemSpacing', 2);
    const top = frame('top', 'HORIZONTAL', 8); const app = await text('HEADROOM', 'type/label-sm', 'color/text/secondary'); top.appendChild(app); app.layoutGrow = 1; top.appendChild(await text('now', 'type/caption', 'color/text/secondary', { name: 'time' }));
    add(tx, top, await text('Food is close to its limit', 'type/label-lg', 'color/text/primary', { name: 'title', width: 276 }), await text('Tap to see what’s left for the rest of the month.', 'type/body-md', 'color/text/primary', { name: 'body', width: 276 }));
    add(c, ic, tx); tx.layoutGrow = 1; fillW(top); for (const k of tx.children) if (k.type === 'TEXT') k.layoutSizingHorizontal = 'FILL'; c.description = why('System notification'); await stage('System notification', why('System notification'), [c]); }

  // Biometric prompt
  { const c = comp('Biometric prompt', 'VERTICAL', 12, { align: 'CENTER' }); fixedW(c, 270); pad(c, 24); rad(c, 'xl'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/3');
    const ic = frame('icon', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(ic, 64, 64); ic.appendChild(icon('scan-face', 56, 'color/action/primary'));
    add(c, ic, await text('Face ID', 'type/title-sm', 'color/text/primary', { name: 'title' }), await text('Unlock Headroom', 'type/body-md', 'color/text/secondary', { name: 'body' }));
    c.description = why('Biometric prompt'); await stage('Biometric prompt', why('Biometric prompt'), [c]); }

  // PIN pad
  { const vs = [];
    for (const st of ['Default', 'Error']) {
      const c = comp(`State=${st}`, 'VERTICAL', 24, { align: 'CENTER' }); fixedW(c, 358);
      const dots = frame('dots', 'HORIZONTAL', 0, { align: 'CENTER' }); sp(dots, 'itemSpacing', 16);
      for (let i = 0; i < 4; i++) { const d = ellipse(16, st === 'Error' ? 'color/status/danger' : i < 2 ? 'color/text/primary' : 'color/surface/sunken'); if (st === 'Default' && i >= 2) stroke(d, 'color/border/default', 2); dots.appendChild(d); }
      c.appendChild(dots);
      c.appendChild(await text(st === 'Error' ? 'Wrong PIN. 3 tries left.' : 'Enter your app PIN', 'type/body-md', st === 'Error' ? 'color/status/danger' : 'color/text/secondary', { name: 'helper' }));
      const grid = frame('keys', 'HORIZONTAL', 0); grid.layoutWrap = 'WRAP'; sp(grid, 'itemSpacing', 12); sp(grid, 'counterAxisSpacing', 12); fixedW(grid, 3 * 96 + 2 * 12);
      for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del']) {
        const key = frame('key ' + k, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(key, 96, 64); rad(key, 'md');
        if (k && k !== 'del') { fill(key, 'color/surface/sunken'); key.appendChild(await text(k, 'type/amount/lg')); } else if (k === 'del') key.appendChild(icon('delete', 24));
        grid.appendChild(key);
      }
      c.appendChild(grid); vs.push(c);
    }
    const cs = await setOf(vs, 'PIN pad', 900); cs.description = why('PIN pad'); await stage('PIN pad', why('PIN pad'), [cs]); }

  // Coach mark
  { const c = comp('Coach mark', 'VERTICAL', 0, { align: 'MIN' }); c.fills = [];
    const arrow = rect(16, 16, 'color/surface/inverse'); arrow.rotation = 45; arrow.name = 'pointer';
    const holder = frame('pointer row', 'HORIZONTAL', 0); pad(holder, 0, 0, 0, 32); fixedH(holder, 8); holder.clipsContent = true; const ar = frame('arrow', 'HORIZONTAL', 0); fixed(ar, 24, 8); ar.clipsContent = true; const sq = rect(14, 14, 'color/surface/inverse'); sq.rotation = 45; sq.x = 2; sq.y = 4; ar.layoutMode = 'NONE'; ar.appendChild(sq); holder.appendChild(ar); arrow.remove();
    const card = frame('card', 'VERTICAL', 0); fixedW(card, 300); pad(card, 16); rad(card, 'lg'); fill(card, 'color/surface/inverse'); sp(card, 'itemSpacing', 8);
    add(card, await text('This is your headroom', 'type/label-lg', 'color/text/inverse', { name: 'title' }), await text('Money left under your monthly limit. It goes down as you spend and resets on the 1st.', 'type/body-md', 'color/text/inverse', { name: 'body', width: 268 }));
    const g = frame('actions', 'HORIZONTAL', 0, { justify: 'MAX' });
    const ok = await text('Got it', 'type/label-lg', 'color/action/on-inverse', { name: 'action' }); g.appendChild(ok); card.appendChild(g); fillW(g);
    add(c, holder, card); c.description = why('Coach mark'); await stage('Coach mark', why('Coach mark'), [c]); }

  // Celebration
  { const c = comp('Celebration', 'VERTICAL', 16, { align: 'CENTER' }); fixedW(c, 358); pad(c, 24, 16);
    const burst = figma.createFrame(); burst.name = 'burst'; burst.resize(160, 120); burst.fills = []; burst.clipsContent = true;
    const cols = ['color/chart/1', 'color/chart/2', 'color/chart/3', 'color/chart/4', 'color/chart/5'];
    const pts = [[24, 32], [128, 28], [20, 74], [130, 78], [48, 22], [104, 20], [36, 92], [118, 94]];
    pts.forEach(([x, y], i) => { const d = rect(8, i % 2 ? 8 : 14, cols[i % cols.length], 'xs'); d.x = x; d.y = y; d.rotation = i * 23; d.name = 'confetti'; burst.appendChild(d); });
    const circle = frame('icon', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(circle, 88, 88); rad(circle, 'full'); fill(circle, 'color/status/success-bg'); circle.appendChild(icon('party-popper', 44, 'color/status/success'));
    circle.layoutPositioning = 'AUTO'; burst.appendChild(circle); circle.x = 36; circle.y = 16;
    add(c, burst, await text('Goa trip, done', 'type/title-lg', 'color/text/primary', { name: 'title', align: 'CENTER' }), await text('You saved ₹60,000 in 9 months. That’s every rupee you planned.', 'type/body-lg', 'color/text/secondary', { name: 'body', width: 320, align: 'CENTER' }));
    c.description = why('Celebration'); await stage('Celebration', why('Celebration'), [c]); }
}

/* ---------- screen kit ---------- */
const SCR = {};      // id -> screen frame
const HOT = {};      // id -> { key: hotspot frame }
const SCR_BG = {};   // id -> screen shown behind a sheet or dialog
function flowName(id) { for (const f of DATA.flows.flows) for (const s of f.screens) if (s[0] === id) return s[1]; return id; }
async function screen(id) {
  const f = figma.createFrame(); f.name = `${id} · ${flowName(id)}`; f.resize(SCR_W, SCR_H); f.clipsContent = true; fill(f, 'color/surface/canvas'); rad(f, 'xl');
  const scroll = frame('content', 'VERTICAL', 0); fixedW(scroll, SCR_W); scroll.x = 0; scroll.y = SB_H; f.appendChild(scroll);
  const s = { id, f, scroll, fixed: [], hotspots: [], bottom: 0 };
  SCR[id] = f; HOT[id] = {};
  return s;
}
async function fBar(s, type, title, o = {}) {
  const b = await inst('Top app bar', 'Type=' + type); b.name = 'Top app bar';
  if (type === 'Large' && !o.home) { const e = b.findOne(k => k.name === 'eye'); if (e) e.visible = false; }
  if (type === 'Large') await setText(b, title, 'large-title'); else await setText(b, title || '', 'title');
  for (const n of (o.hide || [])) { const x = b.findOne(k => k.name === n); if (x) x.visible = false; }
  s.scroll.appendChild(b); fillW(b); s.bar = b; return b;
}
function fBody(s, o = {}) {
  const b = frame('body', 'VERTICAL', 0);
  for (const f2 of ['paddingLeft', 'paddingRight']) b.setBoundVariable(f2, ctx.num['space/layout/page-margin/compact']);
  b.setBoundVariable('paddingTop', ctx.num[o.top || 'space/layout/screen-top/compact']);
  b.setBoundVariable('paddingBottom', ctx.num['space/layout/content-bottom/compact']);
  b.setBoundVariable('itemSpacing', ctx.num[o.gap || 'space/layout/group/compact']);
  s.scroll.appendChild(b); fillW(b); s.body = b; return b;
}
function stack(token, kids = [], dir = 'VERTICAL', o = {}) { const g = frame(o.name || 'group', dir, 0, o); g.setBoundVariable('itemSpacing', ctx.num[token]); for (const k of kids) if (k) g.appendChild(k); return g; }
async function T(chars, style = 'type/body-lg', color = 'color/text/primary', o = {}) { return text(chars, style, color, Object.assign({ width: 358 }, o)); }
async function fBtn(label, variant = 'Primary', size = 'Large') { const b = await inst('Button', `Variant=${variant}, Size=${size}, State=Default`); await setText(b, label, 'label'); b.name = 'Button · ' + label; return b; }
async function fNav(s, active) {
  const n = await inst('Bottom nav bar', 'Active=' + active); s.f.appendChild(n); n.x = 0; n.y = SCR_H - 80 - 34 + 34 - 34; n.y = SCR_H - n.height - 0;
  s.fixed.push(n); s.nav = n; s.bottom = Math.max(s.bottom, n.height);
  for (const k of Object.keys(NAV_TARGET)) { const it = n.findOne(x => x.name === k && x.type === 'FRAME'); if (it) hot(s, it, 'nav-' + k); }
  return n;
}
async function foot(s, kids, o = {}) {
  const ft = frame('footer', 'VERTICAL', 0); fixedW(ft, SCR_W); if (!o.clear) fill(ft, 'color/surface/canvas');
  for (const f2 of ['paddingLeft', 'paddingRight']) ft.setBoundVariable(f2, ctx.num['space/layout/page-margin/compact']);
  ft.setBoundVariable('paddingTop', ctx.num['space/squish/lg/block']); ft.paddingBottom = 34; ft.setBoundVariable('itemSpacing', ctx.num['space/stack/button-stack']);
  for (const k of kids) { ft.appendChild(k); fillW(k); }
  s.f.appendChild(ft); ft.x = 0; ft.y = SCR_H - ft.height; s.fixed.push(ft); s.bottom = Math.max(s.bottom, ft.height); s.foot = ft; return ft;
}
async function fab(s) {
  const b = await inst('Button', 'Variant=Primary, Size=Large, State=Default'); await setText(b, 'Add', 'label');
  const ic = b.findOne(x => x.name === 'icon'); if (ic) ic.visible = true;
  s.f.appendChild(b); b.x = SCR_W - b.width - 16; b.y = SCR_H - (s.nav ? s.nav.height : 34) - b.height - 16; await fx(b, 'elevation/2'); s.fixed.push(b); hot(s, b, 'fab'); return b;
}
function hot(s, node, key) { s.hotspots.push([node, key]); return node; }
async function finish(s) {
  if (!s.foot && !s.nav && !s.noIndicator) s.bottom = Math.max(s.bottom, 34);
  if (s.body && s.bottom) { const spacer = frame('clear fixed bars', 'VERTICAL', 0); fixed(spacer, 1, s.bottom); spacer.fills = []; s.body.appendChild(spacer); }
  if (s.body) for (const k of s.body.children) { if (k.name === 'icon' || k.name === 'who' || k.name === 'clear fixed bars') continue; try { k.layoutSizingHorizontal = 'FILL'; } catch (e) {} }
  if (s.darkChrome) for (const n of s.f.children) if (/^Device/.test(n.name) || n.name === 'Device · Status bar') for (const v of n.findAll(x => true)) { if ('fills' in v && Array.isArray(v.fills) && v.fills.length && v.type !== 'FRAME') v.fills = [paint('color/text/inverse')]; if ('strokes' in v && Array.isArray(v.strokes) && v.strokes.length) v.strokes = [paint('color/text/inverse')]; }
  const sb = await single('Device · Status bar'); s.f.appendChild(sb); sb.x = 0; sb.y = 0; s.fixed.push(sb);
  if (!s.foot && !s.nav && !s.noIndicator) { const hi = await single('Device · Home indicator'); s.f.appendChild(hi); hi.x = 0; hi.y = SCR_H - 34; s.fixed.push(hi); }
  const contentH = SB_H + s.scroll.height;
  if (contentH > SCR_H) s.f.overflowDirection = 'VERTICAL';
  // every tap target gets a hotspot: buttons, links, back/close, undo, refresh, rows, bars, goal cards
  const already = new Set(s.hotspots.map(h => h[0].id));
  const inBg = n => { for (let a = n; a && a !== s.f; a = a.parent) if (/^behind/.test(a.name)) return true; return false; };
  const linkVar = ctx.color['color/text/link'] && ctx.color['color/text/link'].id;
  const auto = (n, key) => { if (!n || already.has(n.id) || inBg(n) || !n.visible) return; let vis = true; for (let a = n; a && a !== s.f; a = a.parent) if (a.visible === false) vis = false; if (!vis) return; already.add(n.id); s.hotspots.push([n, key]); };
  for (const n of s.f.findAll(x => x.type === 'INSTANCE' && /^(Button|Row|Transaction row|Budget bar|Goal card) · /.test(x.name))) auto(n, n.name);
  for (const n of s.f.findAll(x => x.type === 'TEXT' && Array.isArray(x.fills) && x.fills[0] && x.fills[0].boundVariables && x.fills[0].boundVariables.color && x.fills[0].boundVariables.color.id === linkVar)) auto(n, /^see-all:/.test(n.name) ? n.name : 'link:' + n.characters.split(':')[0]);
  for (const n of s.f.findAll(x => x.name === 'Top app bar' && x.type === 'INSTANCE')) { auto(n.findOne(k => k.name === 'chevron-left'), 'back'); const e = n.findOne(k => k.name === 'eye'); if (e && e.visible) auto(e, 'eye'); auto(n.findOne(k => k.name === 'ellipsis-vertical'), 'profile'); }
  for (const n of s.f.findAll(x => x.name === 'Toast')) auto(n.findOne(k => k.name === 'action'), 'undo');
  for (const n of s.f.findAll(x => x.name === 'refresh')) auto(n, 'refresh');
  // hotspots: transparent frames over the target, named, fixed when their source is fixed
  const fb = s.f.absoluteBoundingBox;
  for (const [node, key] of s.hotspots) {
    const b = node.absoluteBoundingBox; if (!b) continue;
    const h = figma.createFrame(); h.name = 'hotspot · ' + key; h.fills = []; h.resize(Math.max(b.width, 44), Math.max(b.height, 44));
    h.x = b.x - fb.x - (Math.max(b.width, 44) - b.width) / 2; h.y = b.y - fb.y - (Math.max(b.height, 44) - b.height) / 2;
    let fixedSrc = false; for (let a = node; a && a !== s.f; a = a.parent) if (s.fixed.includes(a)) fixedSrc = true;
    s.f.appendChild(h); if (fixedSrc) s.fixed.push(h); HOT[s.id][key] = h;
  }
  // fixed layers last, in order, so they stay put while content scrolls
  for (const n of s.fixed) s.f.appendChild(n);
  s.f.numberOfFixedChildren = s.fixed.length;
  if (s.bg) SCR_BG[s.id] = s.bg;
  return s.f;
}
async function sheetOver(s, bgId, build, o = {}) {
  s.bg = bgId;
  // dimmed copy of an earlier screen behind a bottom sheet
  const bg = SCR[bgId].clone(); bg.name = 'behind · ' + bgId; for (const h of bg.findAll(n => n.name.startsWith('hotspot'))) h.remove();
  s.f.appendChild(bg); bg.x = 0; bg.y = 0; s.scroll.visible = false;
  const scrim = rect(SCR_W, SCR_H, 'color/overlay/scrim'); scrim.name = 'scrim'; s.f.appendChild(scrim);
  const sh = frame('sheet', 'VERTICAL', 0, { align: 'CENTER' }); fixedW(sh, SCR_W); fill(sh, 'color/surface/raised'); await fx(sh, 'elevation/3');
  ['topLeftRadius', 'topRightRadius'].forEach(k => sh.setBoundVariable(k, ctx.num['radius/xl']));
  for (const f2 of ['paddingLeft', 'paddingRight']) sh.setBoundVariable(f2, ctx.num['space/inset/xl']);
  sh.setBoundVariable('paddingTop', ctx.num['space/squish/md/block']); sh.paddingBottom = 34;
  sh.setBoundVariable('itemSpacing', ctx.num['space/stack/field-to-field']);
  sh.appendChild(rect(32, 4, 'color/border/default', 'xs'));
  if (o.title) { const h = frame('header', 'HORIZONTAL', 8, { align: 'CENTER' }); const t = await text(o.title, 'type/title-md'); h.appendChild(t); t.layoutGrow = 1; const x = await inst('Back and close patterns', 'Type=Close'); h.appendChild(x); sh.appendChild(h); fillW(h); hot(s, x, 'close'); }
  await build(sh);
  for (const k of sh.children) if (k.type !== 'RECTANGLE' && k.name !== 'centered' && k.name !== 'icon') k.layoutSizingHorizontal = 'FILL';
  s.f.appendChild(sh); sh.x = 0; sh.y = SCR_H - sh.height; s.fixed.push(sh); s.sheet = sh; s.noIndicator = true;
  return sh;
}
async function dialogOver(s, bgId, type, title, bodyTxt, primary, secondary) {
  s.bg = bgId; s.dialog = true;
  const bg = SCR[bgId].clone(); bg.name = 'behind · ' + bgId; for (const h of bg.findAll(n => n.name.startsWith('hotspot'))) h.remove();
  s.f.appendChild(bg); bg.x = 0; bg.y = 0; s.scroll.visible = false;
  const scrim = rect(SCR_W, SCR_H, 'color/overlay/scrim'); scrim.name = 'scrim'; s.f.appendChild(scrim);
  const d = await inst('Modal dialog', 'Type=' + type); await setText(d, title, 'title'); await setText(d, bodyTxt, 'body');
  const acts = d.findOne(n => n.name === 'actions'); if (acts) { const ts = acts.findAll(n => n.type === 'TEXT'); if (ts[0]) await setTextNode(ts[0], primary); if (ts[1]) await setTextNode(ts[1], secondary); hot(s, acts.children[0], 'primary'); hot(s, acts.children[1], 'secondary'); }
  s.f.appendChild(d); d.x = (SCR_W - d.width) / 2; d.y = (SCR_H - d.height) / 2; s.fixed.push(d); s.noIndicator = true; return d;
}
async function setTextNode(t, chars) { if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName); t.characters = chars; return t; }
async function chip(type, sel, label) { const c = await inst('Chips and tags', `Type=${type}, Selected=${sel}`); await setText(c, label, 'label'); return c; }
async function alertBox(type, title, bodyTxt) { const a = await inst('Inline alert', 'Type=' + type); await setText(a, title, 'title'); await setText(a, bodyTxt, 'body'); return a; }
async function listRow(title, sub, trail = 'Chevron', ic) { const info = trail === 'Info'; if (info) trail = 'Value'; const r = await inst('List item', `Lines=${sub ? 'Two' : 'One'}, Trailing=${trail}`); if (info) { const vt = r.findAll(t => t.type === 'TEXT').pop(); if (vt) vt.visible = false; } r.name = (trail === 'Chevron' ? 'Row · ' : 'Info row · ') + title; await setText(r, title, 'title'); if (sub) await setText(r, sub, 'subtitle'); if (ic) { const cur = r.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (cur) { cur.swapComponent(ctx.icons[ic]); for (const v of cur.findAll(n => 'strokes' in n && n.strokes.length)) v.strokes = [paint('color/text/primary')]; } } return r; }
async function toast(type, msg, action) { const t = await inst('Toast / snackbar', 'Type=' + type); t.name = 'Toast'; await setText(t, msg, 'message'); if (action) await setText(t, action, 'action-label'); return t; }
async function floatToast(s, t) { s.f.appendChild(t); t.x = (SCR_W - t.width) / 2; t.y = SCR_H - (s.nav ? s.nav.height : 34) - t.height - 16; s.fixed.push(t); }
function fCard(kids, token = 'space/stack/card-to-card', o = {}) { const c = frame(o.name || 'card', 'VERTICAL', 0); fill(c, 'color/surface/raised'); rad(c, 'lg'); stroke(c, 'color/border/subtle'); pad(c, 16); c.setBoundVariable('itemSpacing', ctx.num[token]); for (const k of kids) if (k) c.appendChild(k); return c; }
function listCard2(kids) { const c = frame('list', 'VERTICAL', 0); fill(c, 'color/surface/raised'); rad(c, 'lg'); stroke(c, 'color/border/subtle'); c.clipsContent = true; for (const k of kids) { c.appendChild(k); } return c; }
async function amountLine(big, small, color = 'color/text/primary') { return stack('space/text/amount-to-caption', [await text(big, 'type/amount/hero', color), await T(small, 'type/body-md', 'color/text/secondary', { width: 326 })]); }
async function iconTile(ic, tone = 'brand', size = 64) { const t = frame('icon', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(t, size, size); rad(t, 'lg'); fill(t, tone === 'success' ? 'color/status/success-bg' : tone === 'warning' ? 'color/status/warning-bg' : tone === 'danger' ? 'color/status/danger-bg' : 'color/finance/headroom'); t.appendChild(icon(ic, size / 2, tone === 'success' ? 'color/status/success' : tone === 'warning' ? 'color/status/warning' : tone === 'danger' ? 'color/status/danger' : 'color/action/on-secondary')); return t; }
function fillAll(fr) { for (const k of fr.children) { try { k.layoutSizingHorizontal = 'FILL'; } catch (e) {} } return fr; }
async function rowKV(k, v, vStyle = 'type/label-lg', vColor = 'color/text/primary') { const r = frame(k, 'HORIZONTAL', 0, { align: 'CENTER' }); sp(r, 'itemSpacing', 12); const a = await text(k, 'type/body-md', 'color/text/secondary'); r.appendChild(a); a.layoutGrow = 1; r.appendChild(await text(v, vStyle, vColor)); return r; }
async function catTile(n, ic, on) { const t = await inst('Category tile', 'Selected=' + on); await setProp(t, 'Category', n, 'label'); const k = Object.keys(t.componentProperties || {}).find(x => x.startsWith('Icon')); if (k) t.setProperties({ [k]: ctx.icons[ic].id }); return t; }
async function budgetBar(state, cat) { const b = await inst('Budget progress bar', 'State=' + state); b.name = 'Budget bar · ' + (cat || state); if (cat) await setText(b, cat, 'category'); return b; }

/* ---------- the screens ---------- */
const BUILD = {
/* F1 ---------------------------------------------------------------- */
'1.01': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact', gap: 'space/layout/section/compact' });
  const g = await inst('Balance card (clearance gauge)', 'State=On track'); for (const n of g.children) if (n.name === 'header' || n.name === 'status') n.visible = false; const tag = await chip('Tag', 'false', 'Example');
  b.appendChild(stack('space/text/heading-to-body', [await text('See how much room you have left this month', 'type/display', 'color/text/primary', { width: 358 }), await T('Not how much you’ve spent. One number, updated as you go.', 'type/body-lg', 'color/text/secondary')]));
  const ex = stack('space/text/eyebrow-to-title', [tag, g]); b.appendChild(ex); ex.layoutSizingHorizontal = 'FILL'; fillW(g);
  const p = await fBtn('Get started'); const sec = await fBtn('I already have an account', 'Ghost');
  await foot(s, [p, sec, await T('By continuing you agree to the Terms and Privacy policy.', 'type/caption', 'color/text/secondary', { align: 'CENTER' })]);
  hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'1.02': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] }); hot(s, s.bar.findOne(n => n.name === 'chevron-left'), 'back');
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('What’s your mobile number?', 'type/title-lg'), await T('It’s how you sign in. We never share it or use it for marketing.', 'type/body-lg', 'color/text/secondary')]));
  const pf = await inst('Phone field', 'State=Filled'); b.appendChild(pf); fillW(pf);
  const or = frame('or', 'HORIZONTAL', 0, { align: 'CENTER' }); sp(or, 'itemSpacing', 12); const l1 = rect(10, 1, 'color/border/subtle'); const l2 = rect(10, 1, 'color/border/subtle'); add(or, l1, await text('or', 'type/body-sm', 'color/text/secondary'), l2); l1.layoutGrow = 1; l2.layoutGrow = 1;
  const g1 = await fBtn('Continue with Google', 'Outline'); const g2 = await fBtn('Continue with Apple', 'Outline');
  b.appendChild(stack('space/stack/button-stack', [or, g1, g2])); fillW(or); fillW(g1); fillW(g2);
  const p = await fBtn('Send code'); await foot(s, [p]); hot(s, p, 'primary');
},
'1.03': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('What’s your mobile number?', 'type/title-lg'), await T('It’s how you sign in. We never share it or use it for marketing.', 'type/body-lg', 'color/text/secondary')]));
  const pf = await inst('Phone field', 'State=Error'); b.appendChild(pf); fillW(pf);
  const p = await fBtn('Send code'); await foot(s, [p]); hot(s, p, 'primary');
},
'1.04': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Enter the 6-digit code', 'type/title-lg'), await T('Sent to +91 98765 43210. It fills in by itself if your phone allows it.', 'type/body-lg', 'color/text/secondary')]));
  const ci = await inst('Code input', 'State=Filled'); b.appendChild(ci);
  const links = stack('space/text/list-item', [await T('Resend code in 0:24', 'type/label-md', 'color/text/secondary'), await T('Change number', 'type/label-md', 'color/text/link')]);
  b.appendChild(links);
  const p = await fBtn('Verify'); await foot(s, [p]); hot(s, p, 'primary');
},
'1.05': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Enter the 6-digit code', 'type/title-lg'), await T('Sent to +91 98765 43210.', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(await inst('Code input', 'State=Error'));
  b.appendChild(await T('Resend code', 'type/label-md', 'color/text/link'));
  const p = await fBtn('Verify'); await foot(s, [p]); hot(s, p, 'primary');
},
'1.06': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Let’s pause for a few minutes', 'type/title-lg'), await T('That’s 5 codes that didn’t match, so we’ve paused sign-in for this number to keep your account safe.', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(await inst('Code input', 'State=Locked'));
  b.appendChild(await alertBox('Info', 'You can try again at 10:52 am', 'Or get the code read out in a call. Nothing in your account has changed.'));
  const p = await fBtn('Call me with a code', 'Tonal'); const sec = await fBtn('Use a different number', 'Ghost');
  await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'1.07': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('What should we call you?', 'type/title-lg'), await T('Just for greetings. It’s never shown in notifications.', 'type/body-lg', 'color/text/secondary')]));
  const ti = await inst('Text input', 'State=Filled'); await setText(ti, 'First name', 'label'); await setText(ti, 'Riya', 'value'); await setText(ti, 'Optional', 'helper'); b.appendChild(ti); fillW(ti);
  const ic = ti.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (ic) ic.visible = false;
  const p = await fBtn('Continue'); const sec = await fBtn('Skip', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'1.08': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  const top = stack('space/media/illustration-to-headline', [await iconTile('scan-face', 'brand', 88), stack('space/text/heading-to-body', [await T('Lock Headroom with Face ID', 'type/title-lg', 'color/text/primary', { align: 'CENTER' }), await T('Your balances stay private even if someone else picks up your phone.', 'type/body-lg', 'color/text/secondary', { align: 'CENTER' })], 'VERTICAL', { align: 'CENTER' })], 'VERTICAL', { align: 'CENTER' });
  b.appendChild(top); fillW(top);
  const opts = listCard2([await listRow('Ask after 1 minute away', 'Recommended', 'Toggle', 'clock'), await listRow('Hide balances by default', 'Press and hold any amount to peek', 'Toggle', 'eye-off')]);
  b.appendChild(opts); fillW(opts); for (const k of opts.children) fillW(k);
  const p = await fBtn('Turn on Face ID'); const sec = await fBtn('Not now', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'1.09': async s => {
  const bg = await inst('Skeleton loader', 'Type=Gauge'); const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(await T('October', 'type/title-lg')); b.appendChild(bg); fillW(bg);
  const r1 = await inst('Skeleton loader', 'Type=Row'); const r2 = await inst('Skeleton loader', 'Type=Row'); b.appendChild(r1); b.appendChild(r2); fillW(r1); fillW(r2);
  const scrim = rect(SCR_W, SCR_H, 'color/overlay/scrim'); scrim.name = 'blur stand-in'; s.f.appendChild(scrim); s.fixed.push(scrim);
  const pr = await single('Biometric prompt'); s.f.appendChild(pr); pr.x = (SCR_W - pr.width) / 2; pr.y = 300; s.fixed.push(pr); hot(s, pr, 'primary');
  const pin = await fBtn('Use PIN instead', 'Ghost'); const ft = await foot(s, [pin], { clear: true }); hot(s, pin, 'secondary');
},
'1.10': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact', gap: 'space/layout/section/compact' });
  b.appendChild(stack('space/text/heading-to-body', [await T('Enter your app PIN', 'type/title-lg', 'color/text/primary', { align: 'CENTER' }), await T('Face ID didn’t work this time.', 'type/body-lg', 'color/text/secondary', { align: 'CENTER' })], 'VERTICAL', { align: 'CENTER' }));
  const pp = await inst('PIN pad', 'State=Error'); b.appendChild(pp); fillW(pp);
  const sec = await fBtn('Forgot PIN? Sign in with a code', 'Ghost'); await foot(s, [sec], { clear: true }); hot(s, sec, 'secondary');
},
/* F2 ---------------------------------------------------------------- */
'2.01': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(stack('space/media/illustration-to-headline', [await iconTile('landmark', 'brand', 72), stack('space/text/heading-to-body', [await T('Bring in your spending automatically', 'type/title-lg'), await T('Connect a bank through an Account Aggregator, India’s RBI-regulated way to share financial data with your consent.', 'type/body-lg', 'color/text/secondary')])]));
  const pts = fCard([]);
  for (const [ic, t, d] of [['eye', 'We can read', 'Transactions and balance, for the accounts you pick'], ['ban', 'We can never', 'Move money, make payments or see your passwords'], ['link-2-off', 'You’re in control', 'Disconnect any time in Settings; we stop at once']]) {
    const r = frame(t, 'HORIZONTAL', 0, { align: 'MIN' }); sp(r, 'itemSpacing', 12); const tx = stack('space/text/title-to-subtitle', [await text(t, 'type/label-lg'), await text(d, 'type/body-md', 'color/text/secondary', { width: 280 })]);
    add(r, icon(ic, 20, 'color/action/on-secondary'), tx); pts.appendChild(r);
  }
  b.appendChild(pts); fillW(pts);
  const p = await fBtn('Connect a bank'); const sec = await fBtn('Add expenses myself', 'Outline'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'2.02': async s => {
  await fBar(s, 'Compact', 'Choose your bank', { hide: ['pencil'] });
  const b = fBody(s);
  const se = await inst('Search', 'State=Empty'); await setText(se, 'Search 300+ banks', 'query'); b.appendChild(se); fillW(se);
  const grid = frame('popular', 'HORIZONTAL', 0); grid.layoutWrap = 'WRAP'; sp(grid, 'itemSpacing', 12); sp(grid, 'counterAxisSpacing', 12); fixedW(grid, 358);
  let first;
  for (const [n, i, sel] of [['HDFC Bank', 'HD', 'true'], ['SBI', 'SB', 'false'], ['ICICI Bank', 'IC', 'false'], ['Axis Bank', 'AX', 'false'], ['Kotak', 'KO', 'false'], ['IDFC FIRST', 'ID', 'false']]) {
    const t = await inst('Bank tile', 'Selected=' + sel); await setText(t, n, 'name'); await setText(t, i, 'initials'); t.resize(111, t.height); grid.appendChild(t); if (!first) first = t;
  }
  b.appendChild(stack('space/text/section-heading-below', [await T('Popular', 'type/title-sm'), grid]));
  const others = listCard2([await listRow('Bank of Baroda', null, 'Chevron', 'landmark'), await listRow('Canara Bank', null, 'Chevron', 'landmark'), await listRow('Punjab National Bank', null, 'Chevron', 'landmark'), await listRow('Yes Bank', null, 'Chevron', 'landmark')]);
  for (const k of others.children) fillW(k);
  b.appendChild(stack('space/text/section-heading-below', [await T('All banks', 'type/title-sm'), others])); fillW(others);
  const p = await fBtn('Continue with HDFC Bank'); await foot(s, [p]); hot(s, p, 'primary');
},
'2.03': async s => {
  await fBar(s, 'Compact', 'Review what you share', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(await T('HDFC Bank will send this to Headroom through your Account Aggregator. You’ll approve it there.', 'type/body-lg', 'color/text/secondary'));
  const cs = await single('Consent summary'); b.appendChild(cs); fillW(cs);
  b.appendChild(await alertBox('Info', 'You can stop sharing any time', 'Settings → Connected banks → Disconnect. We delete nothing you’ve already seen unless you ask.'));
  const p = await fBtn('Continue to Account Aggregator'); const sec = await fBtn('Not now', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'2.04': async s => {
  const hdr = frame('aa header', 'HORIZONTAL', 0, { align: 'CENTER' }); fixedW(hdr, SCR_W); pad(hdr, 12, 16); fill(hdr, 'color/surface/inverse'); sp(hdr, 'itemSpacing', 8);
  add(hdr, icon('shield', 20, 'color/text/inverse'), await text('Account Aggregator · secure consent', 'type/label-md', 'color/text/inverse')); s.scroll.appendChild(hdr);
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Headroom wants to read your HDFC accounts', 'type/title-md'), await T('Choose which accounts to share. You’re now outside the Headroom app.', 'type/body-md', 'color/text/secondary')]));
  const accts = listCard2([]);
  for (const [n, sub, on] of [['Savings ••4821', 'HDFC Bank', true], ['Credit card ••7710', 'HDFC Bank', false]]) { const c = await inst('Checkbox', `Value=${on ? 'On' : 'Off'}, State=Default`); await setText(c, n + ' · ' + sub, 'label'); const wrap = frame('row', 'HORIZONTAL', 0, { align: 'CENTER' }); pad(wrap, 4, 16); wrap.appendChild(c); accts.appendChild(wrap); fillW(wrap); }
  b.appendChild(accts); fillW(accts);
  const ti = await inst('Text input', 'State=Filled'); await setText(ti, 'Code sent to +91 98765 43210', 'label'); await setText(ti, '7 3 0 1 8 4', 'value'); await setText(ti, 'From your Account Aggregator, not Headroom', 'helper'); const ic = ti.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (ic) ic.visible = false; b.appendChild(ti); fillW(ti);
  const p = await fBtn('Approve'); const sec = await fBtn('Reject', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'2.05': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(stack('space/text/heading-to-body', [await T('Bringing in your transactions', 'type/title-lg'), await T('This usually takes under a minute. You can leave; we’ll tell you when it’s ready.', 'type/body-lg', 'color/text/secondary')]));
  const ps = await single('Progress steps'); b.appendChild(ps); fillW(ps);
  const p = await fBtn('Continue in the background', 'Outline'); await foot(s, [p]); hot(s, p, 'primary');
},
'2.06': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(stack('space/media/illustration-to-headline', [await iconTile('circle-check', 'success', 72), stack('space/text/heading-to-body', [await T('1,248 transactions are in', 'type/title-lg'), await T('From HDFC Savings ••4821, 19 Oct 2025 to today. New ones arrive once a day.', 'type/body-lg', 'color/text/secondary')])]));
  const rows = listCard2([await listRow('HDFC Savings ••4821', '1,248 transactions · up to date', 'Chevron', 'landmark')]); for (const k of rows.children) fillW(k); b.appendChild(rows); fillW(rows);
  const p = await fBtn('See where your money went'); await foot(s, [p]); hot(s, p, 'primary');
},
'2.07': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(stack('space/media/illustration-to-headline', [await iconTile('cloud-off', 'warning', 72), stack('space/text/heading-to-body', [await T('HDFC Bank isn’t responding', 'type/title-lg'), await T('Their servers are slow or down right now. This happens to every bank sometimes; nothing is wrong with your account.', 'type/body-lg', 'color/text/secondary')])]));
  b.appendChild(await alertBox('Info', 'We’ll keep trying for 24 hours', 'Turn on notifications and we’ll tell you as soon as it works.'));
  const p = await fBtn('Try again'); const t2 = await fBtn('Choose another bank', 'Outline'); const sec = await fBtn('Add expenses myself', 'Ghost'); await foot(s, [p, t2, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'2.08': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(stack('space/media/illustration-to-headline', [await iconTile('link-2-off', 'brand', 72), stack('space/text/heading-to-body', [await T('No accounts were shared', 'type/title-lg'), await T('Either the request was rejected, or no HDFC accounts are linked to +91 98765 43210.', 'type/body-lg', 'color/text/secondary')])]));
  const tips = fCard([await text('Things to check', 'type/label-lg'), await T('• The number registered with your bank is this one', 'type/body-md', 'color/text/secondary', { width: 326 }), await T('• The account is a savings, current or credit card account', 'type/body-md', 'color/text/secondary', { width: 326 })], 'space/text/list-item');
  b.appendChild(tips); fillW(tips);
  const p = await fBtn('Try again'); const sec = await fBtn('Add expenses myself', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
/* F3 ---------------------------------------------------------------- */
'3.01': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Where your money went', 'type/title-lg'), await T('July to September, about ₹48,200 a month. We’ll use this to suggest a limit.', 'type/body-lg', 'color/text/secondary')]));
  const ch = await inst('Spending charts', 'Type=Donut'); await replaceText(ch, 'Rent and food are 70% of October', 'Rent and food are about 70%'); b.appendChild(ch); fillW(ch);
  const p = await fBtn('Continue'); await foot(s, [p]); hot(s, p, 'primary');
},
'3.02': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('When does your month start?', 'type/title-lg'), await T('Your headroom resets on this day. You can change it later.', 'type/body-lg', 'color/text/secondary')]));
  const opts = stack('space/stack/card-to-card', []);
  for (const [t, d, on] of [['When I get paid', 'Your salary usually lands on the 1st', true], ['On the 1st of every month', 'Calendar months', false], ['On a date I choose', 'For pay days like the 7th or the 25th', false]]) {
    const c = fCard([], 'space/text/title-to-subtitle'); if (on) { stroke(c, 'color/action/primary', 2); fill(c, 'color/action/secondary'); }
    const r = await inst('Radio', `Selected=${on ? 'On' : 'Off'}, State=Default`); await setText(r, t, 'label'); c.appendChild(r); c.appendChild(await T(d, 'type/body-sm', 'color/text/secondary', { width: 326 })); opts.appendChild(c); fillW(c);
  }
  b.appendChild(opts); fillW(opts);
  const p = await fBtn('Continue'); await foot(s, [p]); hot(s, p, 'primary');
},
'3.03': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Set a monthly limit', 'type/title-lg'), await T('You spent about ₹48,200 a month. A little room on top keeps it realistic.', 'type/body-lg', 'color/text/secondary')]));
  const am = await inst('Amount input', 'Variant=Hero, State=Typing'); await setText(am, '₹52,000', 'amount'); await setText(am, 'About ₹12,000 a week', 'context'); b.appendChild(am); fillW(am);
  const sug = frame('suggestions', 'HORIZONTAL', 0); sp(sug, 'itemSpacing', 8); for (const [l, on] of [['₹48,000', 'false'], ['₹52,000', 'true'], ['₹56,000', 'false']]) sug.appendChild(await chip('Choice', on, l));
  b.appendChild(sug);
  b.appendChild(await alertBox('Info', 'Leaves ₹32,500 of your pay untouched', 'Enough for rent, savings and anything this limit doesn’t cover.'));
  const p = await fBtn('Continue'); await foot(s, [p]); hot(s, p, 'primary');
},
'3.04': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Set a monthly limit', 'type/title-lg'), await T('You spent about ₹48,200 a month.', 'type/body-lg', 'color/text/secondary')]));
  const am = await inst('Amount input', 'Variant=Hero, State=Typing'); await setText(am, '₹88,000', 'amount'); await setText(am, 'About ₹20,300 a week', 'context'); b.appendChild(am); fillW(am);
  b.appendChild(await alertBox('Warning', 'That’s ₹3,500 more than you earn', 'You can still use it, but headroom would only run out after your salary does.'));
  const p = await fBtn('Use ₹88,000 anyway', 'Outline'); const sec = await fBtn('Change the limit', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'3.05': async s => {
  await fBar(s, 'Compact', '', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('Split it into categories', 'type/title-lg'), await T('Suggested from your last 3 months. Tap any amount to change it.', 'type/body-lg', 'color/text/secondary')]));
  const rows = listCard2([]);
  for (const [n, sub, v, ic] of [['Rent', 'Fixed · same every month', '₹22,000', 'house'], ['Food and dining', 'You spent ₹9,400 on average', '₹10,000', 'utensils'], ['Shopping', 'You spent ₹5,800 on average', '₹6,000', 'shopping-bag'], ['Transport', 'You spent ₹3,600 on average', '₹4,000', 'bus'], ['Bills', 'Electricity, phone, internet', '₹3,800', 'zap']]) {
    const r = await listRow(n, sub, 'Value', ic); const vt = r.findAll(t => t.type === 'TEXT').pop(); if (vt) await setTextNode(vt, v); rows.appendChild(r); fillW(r);
  }
  b.appendChild(rows); fillW(rows);
  b.appendChild(await alertBox('Info', '₹6,200 not assigned', 'That’s fine. It stays as headroom for anything else.'));
  const p = await fBtn('Start my month'); await foot(s, [p]); hot(s, p, 'primary');
},
'3.06': async s => {
  await fBar(s, 'Large', 'October', { home: true }); hot(s, s.bar.findOne(n => n.name === 'ellipsis-vertical'), 'profile');
  const b = fBody(s);
  const g = await inst('Balance card (clearance gauge)', 'State=On track'); b.appendChild(g); fillW(g);
  await fNav(s, 'Home');
  const cm = await single('Coach mark'); s.f.appendChild(cm); cm.x = 24; cm.y = 420; s.fixed.push(cm); hot(s, cm, 'primary');
},
/* F4 ---------------------------------------------------------------- */
'4.01': async s => { await homeBody(s, 'normal'); },
'4.02': async s => { await homeBody(s, 'hidden'); },
'4.03': async s => { await homeBody(s, 'offline'); },
'4.04': async s => {
  await fBar(s, 'Large', 'October', { home: true });
  const b = fBody(s);
  for (const t of ['Gauge', 'Row', 'Row', 'Row']) { const k = await inst('Skeleton loader', 'Type=' + t); b.appendChild(k); fillW(k); }
  await fNav(s, 'Home'); hot(s, b.children[0], 'primary');
},
'4.05': async s => {
  fill(s.f, 'color/surface/inverse'); s.darkChrome = true;
  const b = fBody(s, { top: 'space/layout/section/compact', gap: 'space/stack/card-to-card' });
  b.appendChild(await T('Sunday, 18 October', 'type/title-sm', 'color/text/inverse', { align: 'CENTER' }));
  b.appendChild(await text('9:41', 'type/display', 'color/text/inverse', { width: 358, align: 'CENTER' }));
  const sp1 = frame('gap', 'VERTICAL', 0); fixed(sp1, 1, 260); sp1.fills = []; b.appendChild(sp1);
  const n = await single('System notification'); b.appendChild(n); fillW(n); hot(s, n, 'notif');
  const n2 = await single('System notification'); await setText(n2, 'New expense in Transport', 'title'); await setText(n2, 'Tap to choose a category.', 'body'); await setText(n2, '2h ago', 'time'); b.appendChild(n2); fillW(n2); hot(s, n2, 'notif2');
},
/* F5 ---------------------------------------------------------------- */
'5.01': async s => {
  await sheetOver(s, '4.01', async sh => {
    const seg = await inst('Segmented control', 'Selected=Week'); await replaceText(seg, 'Week', 'Expense'); await replaceText(seg, 'Month', 'Income'); await replaceText(seg, 'Year', 'Transfer'); sh.appendChild(seg);
    const kp = await single('Number keypad'); kp.strokes = []; await replaceText(kp, '₹1,24,500', '₹0'); await replaceText(kp, 'Food and dining · ₹1,800 left', 'Lands in Food and dining · ₹1,800 left'); await replaceText(kp, 'Add expense', 'Add expense');
    sh.appendChild(kp); const save = kp.findOne(n => n.name === 'primary'); hot(s, save || kp, 'primary'); hot(s, kp.findOne(n => n.name === 'keys'), 'keys');
  }, { title: 'Add expense' });
},
'5.02': async s => {
  await sheetOver(s, '4.01', async sh => {
    const chips = frame('categories', 'HORIZONTAL', 0); chips.setBoundVariable('itemSpacing', ctx.num['space/stack/control-inline']);
    for (const [l, on] of [['Food', 'true'], ['Groceries', 'false'], ['Transport', 'false'], ['More', 'false']]) chips.appendChild(await chip('Choice', on, l));
    sh.appendChild(chips);
    const kp = await single('Number keypad'); kp.strokes = []; await replaceText(kp, '₹1,24,500', '₹386'); await replaceText(kp, 'Food and dining · ₹1,800 left', '₹1,414 left in Food after this'); await replaceText(kp, 'Add expense', 'Add ₹386 expense');
    sh.appendChild(kp); const save = kp.findOne(n => n.name === 'primary'); hot(s, save || kp, 'primary');
    const more = await T('More details: Swiggy · Today · HDFC ••4821', 'type/label-md', 'color/text/link', { align: 'CENTER' }); sh.appendChild(more); hot(s, more, 'secondary');
  }, { title: 'Add expense' });
},
'5.03': async s => {
  await sheetOver(s, '4.01', async sh => {
    const head = await amountLine('₹386', 'Food and dining · ₹1,414 left after this'); sh.appendChild(head);
    const fields = stack('space/stack/field-to-field', []);
    for (const [l, v] of [['Merchant', 'Swiggy'], ['Note', 'Dinner with Arjun']]) { const t = await inst('Text input', 'State=Filled'); await setText(t, l, 'label'); await setText(t, v, 'value'); const h = t.findOne(n => n.name === 'helper'); if (h) h.visible = false; const ic = t.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (ic) ic.visible = false; fields.appendChild(t); fillW(t); }
    sh.appendChild(fields);
    const rows = listCard2([await listRow('Today, 1:42 pm', null, 'Chevron', 'calendar'), await listRow('HDFC Savings ••4821', null, 'Chevron', 'landmark'), await listRow('Doesn’t repeat', null, 'Chevron', 'repeat')]); for (const k of rows.children) fillW(k); sh.appendChild(rows);
    const p = await fBtn('Add ₹386 expense'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'More details' });
},
'5.04': async s => { await homeBody(s, 'saved'); },
'5.05': async s => {
  await sheetOver(s, '4.01', async sh => {
    const kp = await single('Number keypad'); kp.strokes = []; await replaceText(kp, '₹1,24,500', '₹0'); await replaceText(kp, 'Food and dining · ₹1,800 left', 'Enter an amount first');
    const ctxT = kp.findAll(t => t.type === 'TEXT' && t.characters === 'Enter an amount first')[0]; if (ctxT) ctxT.fills = [paint('color/status/danger')];
    sh.appendChild(kp); hot(s, kp.findOne(n => n.name === 'keys'), 'keys');
  }, { title: 'Add expense' });
},
'5.06': async s => {
  await dialogOver(s, '5.02', 'Confirm', 'Add this again?', 'It looks like the ₹386 Swiggy payment HDFC already sent us today at 1:40 pm.', 'Add it anyway', 'Don’t add');
},
'5.07': async s => { await homeBody(s, 'offline-saved'); },
'5.08': async s => {
  await sheetOver(s, '4.01', async sh => {
    const head = stack('space/text/heading-to-body', [await text('Paid ₹386 to Swiggy?', 'type/title-md'), await T('From HDFC Savings ••4821 · Today, 1:40 pm. Choose a category.', 'type/body-md', 'color/text/secondary', { width: 342 })]); sh.appendChild(head);
    const picker = frame('categories', 'HORIZONTAL', 0); picker.layoutWrap = 'WRAP'; sp(picker, 'itemSpacing', 8); sp(picker, 'counterAxisSpacing', 8);
    for (const [ic, n, on] of [['utensils', 'Food', true], ['shopping-basket', 'Groceries', false], ['bus', 'Transport', false], ['shopping-bag', 'Shopping', false], ['zap', 'Bills', false], ['plus', 'More', false]]) { const t = await catTile(n, ic, on); picker.appendChild(t); }
    sh.appendChild(picker);
    const rem = await rowKV('Remember for Swiggy', 'On'); sh.appendChild(rem);
    const p = await fBtn('Save as Food'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Payment detected' });
},
'5.09': async s => {
  await fBar(s, 'Compact', 'Expense', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/amount-to-caption', [await text('−₹386', 'type/amount/hero'), await T('Swiggy · Food and dining', 'type/body-lg', 'color/text/secondary')]));
  const rows = listCard2([await listRow('Today, 1:42 pm', 'Date', 'Chevron', 'calendar'), await listRow('Food and dining', 'Category · ₹1,414 left this month', 'Chevron', 'utensils'), await listRow('HDFC Savings ••4821', 'Account · imported', 'Chevron', 'landmark'), await listRow('Dinner with Arjun', 'Note', 'Chevron', 'pencil')]);
  for (const k of rows.children) fillW(k); b.appendChild(rows); fillW(rows);
  const del = await fBtn('Delete expense', 'Ghost'); b.appendChild(del); fillW(del);
  const dl = del.findAll(t => t.type === 'TEXT')[0]; if (dl) dl.fills = [paint('color/status/danger')]; hot(s, del, 'primary');
},
'5.10': async s => {
  await fBar(s, 'Large', 'Activity');
  const b = fBody(s);
  const rows = listCard2([]); for (const r of [['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket'], ['Pending', 'Uber', 'Transport · Pending', '−₹212', 'bus']]) { const i = await txInst(...r); rows.appendChild(i); fillW(i); }
  b.appendChild(stack('space/text/section-heading-below', [await T('Today', 'type/label-md', 'color/text/secondary'), rows])); fillW(rows);
  await fNav(s, 'Activity');
  const t = await toast('Action', 'Expense deleted', 'Undo'); await floatToast(s, t); hot(s, t, 'primary');
},
'5.11': async s => {
  await sheetOver(s, '5.03', async sh => {
    const cal = await inst('Date range picker', 'Type=Calendar'); cal.strokes = []; sh.appendChild(cal);
    const sel = await T('Today, Sunday 18 October', 'type/label-md', 'color/text/secondary', { width: 342, align: 'CENTER' }); sh.appendChild(sel);
    const p = await fBtn('Use 18 October'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Pick a date' });
},
'5.12': async s => {
  await sheetOver(s, '5.03', async sh => {
    const opts = stack('space/stack/card-to-card', []);
    for (const [t, d, on] of [['HDFC Savings ••4821', 'Last used', true], ['ICICI Salary ••0937', 'Salary account', false], ['Cash', 'Not linked to a bank', false]]) {
      const c = fCard([], 'space/text/title-to-subtitle'); if (on) { stroke(c, 'color/action/primary', 2); fill(c, 'color/action/secondary'); }
      const r = await inst('Radio', `Selected=${on ? 'On' : 'Off'}, State=Default`); await setText(r, t, 'label'); c.appendChild(r); c.appendChild(await T(d, 'type/body-sm', 'color/text/secondary', { width: 300 })); opts.appendChild(c); fillW(c);
    }
    sh.appendChild(opts);
    const p = await fBtn('Done'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Pay from' });
},
'5.13': async s => {
  await sheetOver(s, '5.03', async sh => {
    const opts = stack('space/stack/card-to-card', []);
    for (const [t, d, on] of [['Doesn’t repeat', 'A one-off expense', true], ['Every week', 'Same day each week', false], ['Every month', 'Shows in Coming up on Home before it’s due', false], ['Every year', 'Insurance, memberships', false]]) {
      const c = fCard([], 'space/text/title-to-subtitle'); if (on) { stroke(c, 'color/action/primary', 2); fill(c, 'color/action/secondary'); }
      const r = await inst('Radio', `Selected=${on ? 'On' : 'Off'}, State=Default`); await setText(r, t, 'label'); c.appendChild(r); c.appendChild(await T(d, 'type/body-sm', 'color/text/secondary', { width: 300 })); opts.appendChild(c); fillW(c);
    }
    sh.appendChild(opts);
    const p = await fBtn('Done'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Repeat' });
},
/* F6 ---------------------------------------------------------------- */
'6.01': async s => { await homeBody(s, 'near'); },
'6.02': async s => { await budgetDetail(s, 'near'); },
'6.03': async s => { await budgetDetail(s, 'over'); },
'6.04': async s => {
  await sheetOver(s, '6.03', async sh => {
    sh.appendChild(await T('Shopping is ₹740 over. Pick a budget with room to cover it.', 'type/body-md', 'color/text/secondary', { width: 342 }));
    const opts = stack('space/stack/card-to-card', []);
    for (const [n, left, give, on] of [['Transport', '₹1,850 left', 'Can give ₹740', true], ['Bills', '₹1,200 left', 'Can give ₹740', false], ['Food and dining', '₹1,800 left', 'Close to its limit', false]]) {
      const c = fCard([], 'space/text/title-to-subtitle'); if (on) { stroke(c, 'color/action/primary', 2); fill(c, 'color/action/secondary'); }
      const r = await inst('Radio', `Selected=${on ? 'On' : 'Off'}, State=${n === 'Food and dining' ? 'Disabled' : 'Default'}`); await setText(r, n, 'label'); c.appendChild(r); c.appendChild(await T(`${left} · ${give}`, 'type/body-sm', 'color/text/secondary', { width: 300 })); opts.appendChild(c); fillW(c);
    }
    sh.appendChild(opts);
    sh.appendChild(await rowKV('Amount', '₹740', 'type/amount/md'));
    const p = await fBtn('Move ₹740 to Shopping'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Move room' });
},
'6.05': async s => {
  await budgetDetail(s, 'fixed');
  const t = await toast('Action', 'Moved ₹740 from Transport', 'Undo'); await floatToast(s, t); hot(s, t, 'primary');
},
'6.06': async s => {
  await sheetOver(s, '6.03', async sh => {
    const am = await inst('Amount input', 'Variant=Hero, State=Typing'); await setText(am, '₹7,000', 'amount'); await setText(am, 'Shopping limit, was ₹6,000', 'context'); sh.appendChild(am);
    const sum = fCard([await rowKV('Monthly limit', '₹52,000 → ₹53,000'), await rowKV('Headroom after this', '₹19,450', 'type/amount/md')], 'space/text/list-item'); sh.appendChild(sum);
    sh.appendChild(await T('Applies from today. October’s history stays as it was.', 'type/body-sm', 'color/text/secondary', { width: 342 }));
    const p = await fBtn('Raise to ₹7,000'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Raise Shopping limit' });
},
'6.07': async s => {
  await sheetOver(s, '6.03', async sh => {
    sh.appendChild(await iconTile('triangle-alert', 'warning', 56));
    sh.appendChild(stack('space/text/heading-to-body', [await text('No budget has room to spare', 'type/title-md'), await T('Every budget is close to its limit or over. Moving money around wouldn’t help this month.', 'type/body-md', 'color/text/secondary', { width: 342 })]));
    const p = await fBtn('Raise the monthly limit'); const sec = await fBtn('Keep tracking', 'Ghost'); sh.appendChild(p); sh.appendChild(sec); hot(s, p, 'primary'); hot(s, sec, 'secondary');
    sh.appendChild(await T('Going over once is normal. We’ll look at it together in the month-end review.', 'type/body-sm', 'color/text/secondary', { width: 342, align: 'CENTER' }));
  }, { title: 'Move room' });
},
/* F7 ---------------------------------------------------------------- */
'7.01': async s => {
  await fBar(s, 'Large', 'Goals');
  const b = fBody(s);
  const es = await inst('Empty state', 'Type=First use'); await setText(es, 'Save for something that matters', 'title'); await setText(es, 'Tell us what and by when. We’ll work out how much a month and keep you on pace.', 'body'); await replaceText(es, 'Add expense', 'Create a goal');
  const ic = es.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (ic) ic.swapComponent(ctx.icons['target']);
  b.appendChild(es); fillW(es); const bt = es.findOne(n => n.name === 'button'); hot(s, bt || es, 'primary');
  const ideas = frame('ideas', 'HORIZONTAL', 0); ideas.layoutWrap = 'WRAP'; sp(ideas, 'itemSpacing', 8); sp(ideas, 'counterAxisSpacing', 8); fixedW(ideas, 358);
  for (const l of ['Emergency fund', 'Trip', 'New phone', 'Course']) ideas.appendChild(await chip('Choice', 'false', l));
  b.appendChild(stack('space/text/section-heading-below', [await T('Popular goals', 'type/title-sm'), ideas]));
  await fNav(s, 'Goals');
},
'7.02': async s => {
  await fBar(s, 'Compact', 'New goal', { hide: ['pencil'] });
  const b = fBody(s);
  const f = stack('space/stack/field-to-field', []);
  for (const [l, v, h] of [['What are you saving for?', 'Goa trip', 'Short and specific works best'], ['Target', '₹60,000', 'Include everything: travel, stay, food'], ['By when?', 'February 2027', 'About 4 months away']]) { const t = await inst('Text input', 'State=Filled'); await setText(t, l, 'label'); await setText(t, v, 'value'); await setText(t, h, 'helper'); const ic = t.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (ic) ic.visible = false; f.appendChild(t); fillW(t); }
  b.appendChild(f); fillW(f);
  const p = await fBtn('See the plan'); await foot(s, [p]); hot(s, p, 'primary');
},
'7.03': async s => {
  await fBar(s, 'Compact', 'Your plan', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/amount-to-caption', [await text('₹5,500 a month', 'type/amount/lg'), await T('gets you to ₹60,000 by February 2027', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(fCard([await rowKV('Already saved', '₹38,000'), await rowKV('Still to save', '₹22,000'), await rowKV('Months left', '4')], 'space/text/list-item'));
  b.appendChild(await alertBox('Info', 'Fits your headroom', 'This month you have ₹18,450 left. Setting ₹5,500 aside leaves ₹12,950.'));
  const p = await fBtn('Create goal'); await foot(s, [p]); hot(s, p, 'primary');
},
'7.04': async s => {
  await fBar(s, 'Large', 'Goals');
  const b = fBody(s);
  const g1 = await inst('Savings goal card', 'State=In progress'); const g2 = await inst('Savings goal card', 'State=Behind'); g1.name = 'Goal card · Goa trip'; g2.name = 'Goal card · Emergency fund';
  b.appendChild(stack('space/stack/card-to-card', [g1, g2])); fillW(g1); fillW(g2); hot(s, g1, 'primary');
  const add = await fBtn('New goal', 'Outline'); b.appendChild(add); fillW(add);
  await fNav(s, 'Goals');
},
'7.05': async s => {
  await sheetOver(s, '7.04', async sh => {
    const am = await inst('Amount input', 'Variant=Hero, State=Typing'); await setText(am, '₹5,500', 'amount'); await setText(am, 'Goa trip · ₹43,500 of ₹60,000 after this', 'context'); sh.appendChild(am);
    const chips = frame('quick', 'HORIZONTAL', 0); sp(chips, 'itemSpacing', 8); for (const [l, on] of [['₹2,000', 'false'], ['₹5,500 planned', 'true'], ['₹10,000', 'false']]) chips.appendChild(await chip('Choice', on, l)); sh.appendChild(chips);
    sh.appendChild(await T('Set aside from HDFC Savings ••4821. Headroom goes down by the same amount; no money moves.', 'type/body-sm', 'color/text/secondary', { width: 342 }));
    const p = await fBtn('Add ₹5,500'); sh.appendChild(p); hot(s, p, 'primary');
  }, { title: 'Add to Goa trip' });
},
'7.06': async s => {
  await fBar(s, 'Compact', 'Emergency fund', { hide: ['pencil'] });
  const b = fBody(s);
  const g = await inst('Savings goal card', 'State=Behind'); b.appendChild(g); fillW(g);
  b.appendChild(stack('space/text/heading-to-body', [await T('A bit behind, and that’s okay', 'type/title-md'), await T('You added ₹4,000 less than planned over the last two months. Here are two ways to get back on track.', 'type/body-lg', 'color/text/secondary')]));
  const p = await fBtn('Add ₹2,000 more a month'); const sec = await fBtn('Move the date to March', 'Outline'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
'7.07': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  const c = await single('Celebration'); b.appendChild(c); fillW(c);
  const g = await inst('Savings goal card', 'State=Reached'); await setText(g, 'Goa trip', 'name'); await replaceText(g, '₹45,000', '₹60,000'); await replaceText(g, 'of ₹45,000', 'of ₹60,000'); { const gi = g.findOne(x => x.type === 'INSTANCE' && /^icon\//.test(x.name)); if (gi) gi.swapComponent(ctx.icons['tree-palm']); } b.appendChild(g); fillW(g);
  const p = await fBtn('Done'); const t2 = await fBtn('Start another goal', 'Outline'); await foot(s, [p, t2]); hot(s, p, 'primary');
},
'7.08': async s => {
  await fBar(s, 'Compact', 'Your plan', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/amount-to-caption', [await text('₹22,000 a month', 'type/amount/lg', 'color/finance/over-budget'), await T('would be needed to reach ₹60,000 by November', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(await alertBox('Warning', 'That’s more than your headroom', 'You have ₹18,450 left this month. The earliest realistic date is February 2027, at ₹5,500 a month.'));
  const p = await fBtn('Use February 2027'); const sec = await fBtn('Change the target', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary'); hot(s, sec, 'secondary');
},
/* F8 ---------------------------------------------------------------- */
'8.01': async s => { await activityBody(s, 'list'); },
'8.02': async s => { await activityBody(s, 'search'); },
'8.03': async s => {
  await fBar(s, 'Large', 'Activity');
  const b = fBody(s);
  const se = await inst('Search', 'State=Filled'); await setText(se, 'zomato march', 'query'); b.appendChild(se); fillW(se);
  const es = await inst('Empty state', 'Type=No results'); await setText(es, 'Nothing for “zomato march”', 'title'); await setText(es, 'You’re searching October. Try all time, or clear the category filter.', 'body'); await replaceText(es, 'Clear filters', 'Search all time'); b.appendChild(es); fillW(es);
  const bt = es.findOne(n => n.name === 'button'); hot(s, bt || es, 'primary');
  await fNav(s, 'Activity');
},
'8.04': async s => {
  await sheetOver(s, '8.01', async sh => {
    const sec = async (title, labels) => { const w = frame('chips', 'HORIZONTAL', 0); w.layoutWrap = 'WRAP'; sp(w, 'itemSpacing', 8); sp(w, 'counterAxisSpacing', 8); for (const [l, on] of labels) w.appendChild(await chip('Filter', on, l)); const g = stack('space/text/section-heading-below', [await text(title, 'type/label-lg'), w]); w.layoutSizingHorizontal = 'FILL'; return g; };
    sh.appendChild(await sec('Period', [['This month', 'true'], ['Last month', 'false'], ['Last 3 months', 'false'], ['Custom', 'false']]));
    sh.appendChild(await sec('Categories', [['Food', 'true'], ['Groceries', 'false'], ['Shopping', 'false'], ['Transport', 'false'], ['Bills', 'false']]));
    sh.appendChild(await sec('Type', [['Expenses', 'true'], ['Income', 'false'], ['Transfers', 'false']]));
    const p = await fBtn('Show 23 transactions'); sh.appendChild(p); hot(s, p, 'primary');
    sh.appendChild(await T('Clear all', 'type/label-md', 'color/text/link', { align: 'CENTER', width: 342 }));
  }, { title: 'Filters' });
},
'8.05': async s => {
  await fBar(s, 'Compact', 'Transaction', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/amount-to-caption', [await text('−₹386', 'type/amount/hero'), await T('Swiggy · Food and dining', 'type/body-lg', 'color/text/secondary')]));
  const rows = listCard2([await listRow('Food and dining', 'Category · tap to change', 'Chevron', 'utensils'), await listRow('Today, 1:40 pm', 'Imported from HDFC Savings ••4821', 'Info', 'landmark'), await listRow('UPI ref 4829 1037 7710', 'Reference', 'Info', 'receipt')]);
  for (const k of rows.children) fillW(k); b.appendChild(rows); fillW(rows); hot(s, rows.children[0], 'primary');
  const t = await fBtn('Mark as transfer', 'Outline'); b.appendChild(t); fillW(t);
},
'8.06': async s => {
  await sheetOver(s, '8.05', async sh => {
    const picker = frame('categories', 'HORIZONTAL', 0); picker.layoutWrap = 'WRAP'; sp(picker, 'itemSpacing', 8); sp(picker, 'counterAxisSpacing', 8);
    for (const [ic, n, on] of [['utensils', 'Food', false], ['shopping-basket', 'Groceries', true], ['bus', 'Transport', false], ['shopping-bag', 'Shopping', false]]) { const t = await catTile(n, ic, on); picker.appendChild(t); }
    sh.appendChild(picker);
    sh.appendChild(fCard([await text('Apply to all Swiggy payments?', 'type/label-lg'), await T('14 past payments and any new ones will move to Groceries.', 'type/body-md', 'color/text/secondary', { width: 310 })], 'space/text/title-to-subtitle'));
    const p = await fBtn('Apply to all 15'); const sec = await fBtn('Just this one', 'Ghost'); sh.appendChild(p); sh.appendChild(sec); hot(s, p, 'primary'); hot(s, sec, 'secondary');
  }, { title: 'Change category' });
},
'8.07': async s => {
  await activityBody(s, 'rule');
  const t = await toast('Action', '15 Swiggy payments moved to Groceries', 'Undo'); await floatToast(s, t); hot(s, t, 'primary');
},
'8.08': async s => {
  await activityBody(s, 'transfer');
  const t = await toast('Action', 'Marked as a transfer, not spending', 'Undo'); await floatToast(s, t);
},
/* F9 ---------------------------------------------------------------- */
'9.01': async s => {
  await fBar(s, 'Compact', 'October review', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('You stayed ₹4,120 under your limit', 'type/title-lg'), await T('October was steady: rent, food and a weekend trip, and still room to spare.', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(fCard([await rowKV('Spent', '₹47,880', 'type/amount/md'), await rowKV('Limit', '₹52,000', 'type/amount/md'), await rowKV('Added to goals', '₹5,500', 'type/amount/md', 'color/finance/savings')], 'space/text/list-item'));
  const p = await fBtn('See where it went'); await foot(s, [p]); hot(s, p, 'primary');
},
'9.02': async s => {
  await fBar(s, 'Compact', 'Where it went', { hide: ['pencil'] });
  const b = fBody(s);
  const bars = fCard([], 'space/stack/field-to-field');
  for (const [st, n] of [['Under', 'Transport'], ['Under', 'Bills'], ['Near', 'Food and dining'], ['Over', 'Shopping']]) { const x = await budgetBar(st, n); if (n === 'Bills') { await replaceText(x, '₹2,150 of ₹4,000', '₹2,600 of ₹3,800'); await replaceText(x, 'On track · ₹1,850 left', 'On track · ₹1,200 left'); } bars.appendChild(x); fillW(x); }
  b.appendChild(bars); fillW(bars);
  b.appendChild(await alertBox('Info', 'Shopping went over twice this year', 'Both times in a sale month. A ₹7,000 limit for November would cover it.'));
  const p = await fBtn('Continue'); await foot(s, [p]); hot(s, p, 'primary');
},
'9.03': async s => {
  await fBar(s, 'Compact', 'Use your leftover', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/amount-to-caption', [await text('₹4,120', 'type/amount/hero', 'color/text/primary'), await T('left from October', 'type/body-lg', 'color/text/secondary')]));
  const opts = stack('space/stack/card-to-card', []);
  for (const [t, d, on] of [['Add to Goa trip', 'Gets you there 3 weeks sooner', true], ['Carry into November', 'November starts with ₹56,120 of headroom', false], ['Leave it', 'It stays in your account, untracked', false]]) {
    const c = fCard([], 'space/text/title-to-subtitle'); if (on) { stroke(c, 'color/action/primary', 2); fill(c, 'color/action/secondary'); }
    const r = await inst('Radio', `Selected=${on ? 'On' : 'Off'}, State=Default`); await setText(r, t, 'label'); c.appendChild(r); c.appendChild(await T(d, 'type/body-sm', 'color/text/secondary', { width: 326 })); opts.appendChild(c); fillW(c);
  }
  b.appendChild(opts); fillW(opts);
  const p = await fBtn('Continue'); await foot(s, [p]); hot(s, p, 'primary');
},
'9.04': async s => {
  await fBar(s, 'Compact', 'Plan November', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(await T('Based on October. Only Shopping changed.', 'type/body-lg', 'color/text/secondary'));
  const rows = listCard2([]);
  for (const [n, sub, v, ic] of [['Rent', 'Same', '₹22,000', 'house'], ['Food and dining', 'Same', '₹10,000', 'utensils'], ['Shopping', 'Was ₹6,000 · went over in October', '₹7,000', 'shopping-bag'], ['Transport', 'Same', '₹4,000', 'bus'], ['Bills', 'Same', '₹3,800', 'zap']]) { const r = await listRow(n, sub, 'Value', ic); const vt = r.findAll(t => t.type === 'TEXT').pop(); if (vt) await setTextNode(vt, v); rows.appendChild(r); fillW(r); }
  b.appendChild(rows); fillW(rows);
  b.appendChild(await rowKV('Monthly limit', '₹53,000', 'type/amount/md'));
  const p = await fBtn('Start November'); await foot(s, [p]); hot(s, p, 'primary');
},
'9.05': async s => {
  await fBar(s, 'Large', 'November', { home: true }); hot(s, s.bar.findOne(n => n.name === 'ellipsis-vertical'), 'profile');
  const b = fBody(s);
  const g = await inst('Balance card (clearance gauge)', 'State=Empty'); b.appendChild(g); fillW(g);
  await replaceText(g, 'October · 13 days left', 'November · 30 days left'); await replaceText(g, 'Set a monthly limit to see your headroom', '₹53,000 of headroom. Fresh month.');
  const bt = g.findOne(n => n.name === 'button'); if (bt) bt.visible = false;
  b.appendChild(await alertBox('Success', '₹4,120 added to Goa trip', 'You’re now 3 weeks ahead of plan.'));
  await fNav(s, 'Home'); hot(s, g, 'primary');
},
'9.06': async s => {
  await fBar(s, 'Compact', 'September review', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('September went ₹5,400 over', 'type/title-lg'), await T('Mostly the festival sale: Shopping ended at ₹11,200. Everything else was close to plan.', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(fCard([await text('One thing to try', 'type/label-lg'), await T('Raise Shopping to ₹7,000 in sale months and lower it in the rest. Your yearly total stays the same.', 'type/body-md', 'color/text/secondary', { width: 326 })], 'space/text/title-to-subtitle'));
  const p = await fBtn('Plan October'); await foot(s, [p]); hot(s, p, 'primary');
},
/* F10 --------------------------------------------------------------- */
'10.01': async s => {
  await fBar(s, 'Compact', 'You', { hide: ['pencil'] });
  const b = fBody(s);
  const who = frame('who', 'HORIZONTAL', 0, { align: 'CENTER' }); sp(who, 'itemSpacing', 12); const av = await inst('Avatar', 'Type=Initials, Size=Large'); await setText(av, 'R', 'initials');
  add(who, av, stack('space/text/title-to-subtitle', [await text('Riya', 'type/title-md'), await text('+91 ••••• 43210', 'type/body-md', 'color/text/secondary')])); b.appendChild(who);
  const sect = async (title, rows) => { const c = listCard2(rows); for (const k of rows) fillW(k); const g = stack('space/text/section-heading-below', [await T(title, 'type/label-md', 'color/text/secondary'), c]); return [g, c]; };
  const banks = await listRow('Connected banks', 'HDFC Savings ••4821 · until 18 Oct 2027', 'Chevron', 'landmark');
  const exp = await listRow('Export your data', 'CSV or PDF', 'Chevron', 'download');
  const [g1, c1] = await sect('Privacy', [await listRow('Face ID lock', 'After 1 minute away', 'Toggle', 'scan-face'), await listRow('Hide balances by default', null, 'Toggle', 'eye-off'), banks, exp]);
  const [g2, c2] = await sect('App', [await listRow('Month starts', 'When I get paid', 'Chevron', 'calendar'), await listRow('Notifications', 'Budgets at 80% and 100%', 'Chevron', 'bell'), await listRow('Help and feedback', null, 'Chevron', 'info')]);
  b.appendChild(g1); b.appendChild(g2); fillW(c1); fillW(c2); fillW(g1); fillW(g2);
  const so = await fBtn('Sign out', 'Outline'); const del = await fBtn('Delete account', 'Ghost'); const dl = del.findAll(t => t.type === 'TEXT')[0]; if (dl) dl.fills = [paint('color/status/danger')];
  b.appendChild(stack('space/stack/button-stack', [so, del])); fillW(so); fillW(del);
  hot(s, banks, 'banks'); hot(s, exp, 'export'); hot(s, del, 'delete'); hot(s, so, 'signout');
},
'10.02': async s => {
  await fBar(s, 'Compact', 'Connected banks', { hide: ['pencil'] });
  const b = fBody(s);
  const cs = await single('Consent summary'); b.appendChild(stack('space/text/section-heading-below', [await T('HDFC Savings ••4821', 'type/title-sm'), cs])); fillW(cs);
  const dis = await fBtn('Disconnect HDFC', 'Outline'); b.appendChild(dis); fillW(dis); hot(s, dis, 'primary');
  const add = await fBtn('Add a bank', 'Ghost'); b.appendChild(add); fillW(add);
},
'10.03': async s => { await dialogOver(s, '10.02', 'Destructive', 'Disconnect HDFC Bank?', 'New transactions stop coming in today. The 1,248 already imported stay, and you can add expenses by hand.', 'Disconnect', 'Cancel'); },
'10.04': async s => {
  await fBar(s, 'Compact', 'Export your data', { hide: ['pencil'] });
  const b = fBody(s);
  const period = frame('period', 'HORIZONTAL', 0); period.layoutWrap = 'WRAP'; sp(period, 'itemSpacing', 8); sp(period, 'counterAxisSpacing', 8); for (const [l, on] of [['This month', 'false'], ['Last 12 months', 'true'], ['Everything', 'false']]) period.appendChild(await chip('Choice', on, l));
  b.appendChild(stack('space/text/section-heading-below', [await T('Period', 'type/title-sm'), period]));
  const fmt = stack('space/stack/card-to-card', []);
  for (const [t, d, on] of [['CSV', 'For spreadsheets', true], ['PDF', 'A readable summary', false]]) { const c = fCard([], 'space/text/title-to-subtitle'); if (on) { stroke(c, 'color/action/primary', 2); fill(c, 'color/action/secondary'); } const r = await inst('Radio', `Selected=${on ? 'On' : 'Off'}, State=Default`); await setText(r, t, 'label'); c.appendChild(r); c.appendChild(await T(d, 'type/body-sm', 'color/text/secondary', { width: 326 })); fmt.appendChild(c); fillW(c); }
  b.appendChild(stack('space/text/section-heading-below', [await T('Format', 'type/title-sm'), fmt])); fillW(fmt);
  b.appendChild(await T('You’ll confirm with Face ID. The file is named headroom-export-oct-2026.csv, with no amounts in the name.', 'type/body-sm', 'color/text/secondary'));
  const p = await fBtn('Export'); await foot(s, [p]); hot(s, p, 'primary');
},
'10.05': async s => { await dialogOver(s, '10.01', 'Confirm', 'Sign out of Headroom?', 'Your data stays safe in your account. This phone keeps nothing; sign in with your number to come back.', 'Sign out', 'Cancel'); },
'10.06': async s => {
  await fBar(s, 'Compact', 'Delete account', { hide: ['pencil'] });
  const b = fBody(s);
  b.appendChild(stack('space/text/heading-to-body', [await T('This deletes everything', 'type/title-lg'), await T('Budgets, goals, 1,248 transactions and your bank connection. Your bank accounts themselves aren’t touched.', 'type/body-lg', 'color/text/secondary')]));
  b.appendChild(await alertBox('Info', 'You have 7 days to change your mind', 'Sign in before 25 Oct and restore it in one tap. After that it can’t be undone.'));
  const ti = await inst('Text input', 'State=Filled'); await setText(ti, 'Type the last 4 digits of +91 ••••• 43210', 'label'); await setText(ti, '3210', 'value'); await setText(ti, 'Those aren’t the last 4 digits of your number', 'helper');
  const ic = ti.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (ic) ic.visible = false; const hp = ti.findOne(n => n.name === 'helper'); if (hp) hp.visible = false; b.appendChild(ti); fillW(ti);
  const p = await inst('Button', 'Variant=Destructive, Size=Large, State=Default'); await setText(p, 'Delete my account', 'label'); p.name = 'Button · Delete my account'; const sec = await fBtn('Keep my account', 'Ghost'); await foot(s, [p, sec]); hot(s, p, 'primary');
},
'10.07': async s => {
  const b = fBody(s, { top: 'space/layout/section/compact' });
  b.appendChild(stack('space/media/illustration-to-headline', [await iconTile('calendar-check', 'brand', 72), stack('space/text/heading-to-body', [await T('Your account will be deleted on 25 Oct', 'type/title-lg'), await T('We’ve sent the date to +91 ••••• 43210. Sign in before then to restore it; after that, everything is gone for good.', 'type/body-lg', 'color/text/secondary')])]));
  const p = await fBtn('Done'); await foot(s, [p]); hot(s, p, 'primary');
},
'10.08': async s => {
  await homeBody(s, 'restore');
},
'10.09': async s => {
  await fBar(s, 'Compact', 'Notifications', { hide: ['pencil'] });
  const b = fBody(s);
  const rows = listCard2([await listRow('Close to a limit', 'At 80% of any budget', 'Toggle', 'triangle-alert'), await listRow('Over a limit', 'When a budget goes over', 'Toggle', 'chevrons-up'), await listRow('Payment detected', 'Choose a category in one tap', 'Toggle', 'receipt'), await listRow('Month-end review', 'On the 1st', 'Toggle', 'calendar-check')]);
  for (const k of rows.children) fillW(k); b.appendChild(rows);
  const priv = listCard2([await listRow('Show amounts on the lock screen', 'Off: “Food is close to its limit”', 'Value', 'lock')]); const vt = priv.children[0].findAll(t => t.type === 'TEXT').pop(); if (vt) await setTextNode(vt, 'Off'); fillW(priv.children[0]);
  b.appendChild(stack('space/text/section-heading-below', [await T('Privacy', 'type/label-md', 'color/text/secondary'), priv])); priv.layoutSizingHorizontal = 'FILL';
  b.appendChild(await T('Preview: “Food is close to its limit. Tap to see what’s left for the rest of the month.”', 'type/body-sm', 'color/text/secondary'));
},
'10.10': async s => {
  await fBar(s, 'Compact', 'Help and feedback', { hide: ['pencil'] });
  const b = fBody(s);
  const se = await inst('Search', 'State=Empty'); await setText(se, 'Search help', 'query'); b.appendChild(se);
  const faq = listCard2([await listRow('Why don’t I see today’s payments?', 'Bank imports run once a day', 'Info', 'clock'), await listRow('How is headroom calculated?', 'Monthly limit minus spending', 'Info', 'gauge'), await listRow('Is my bank data safe?', 'Read-only, revoke any time', 'Info', 'shield')]);
  for (const k of faq.children) fillW(k);
  b.appendChild(stack('space/text/section-heading-below', [await T('Common questions', 'type/title-sm'), faq])); faq.layoutSizingHorizontal = 'FILL';
  const c1 = await fBtn('Chat with us · replies in about 10 min', 'Outline'); const c2 = await fBtn('Email support · replies within a day', 'Ghost');
  b.appendChild(stack('space/stack/button-stack', [c1, c2])); fillW(c1); fillW(c2);
},
};

/* ---------- shared screen bodies ---------- */
async function homeBody(s, mode) {
  await fBar(s, 'Large', 'October', { home: true }); hot(s, s.bar.findOne(n => n.name === 'eye'), 'eye'); hot(s, s.bar.findOne(n => n.name === 'ellipsis-vertical'), 'profile');
  if (mode === 'hidden') { const e = s.bar.findOne(n => n.name === 'eye'); const ic = e && e.findOne(n => n.type === 'INSTANCE'); if (ic) ic.swapComponent(ctx.icons['eye-off']); }
  if (mode === 'offline' || mode === 'offline-saved') { const bn = await inst('Banner', 'Type=Neutral'); s.scroll.appendChild(bn); fillW(bn); }
  if (mode === 'restore') { const bn = await inst('Banner', 'Type=Warning'); await setText(bn, 'Your account is set to be deleted on 25 Oct.', 'message'); await replaceText(bn, 'Reconnect', 'Restore'); const bi = bn.findOne(n => n.type === 'INSTANCE'); if (bi) bi.swapComponent(ctx.icons['calendar']); s.scroll.appendChild(bn); fillW(bn); hot(s, bn, 'primary'); }
  const b = fBody(s);
  const g = await inst('Balance card (clearance gauge)', 'State=' + (mode === 'hidden' ? 'Hidden' : mode === 'near' ? 'Near limit' : 'On track')); b.appendChild(g); fillW(g);
  if (mode === 'saved') { await replaceText(g, '₹18,450', '₹18,064'); await replaceText(g, '₹33,550', '₹33,936'); }
  const sync = await single('Sync status line'); if (mode === 'offline' || mode === 'offline-saved') await setText(sync, 'Offline · updated 3h ago', 'status');
  if (mode === 'near') { b.appendChild(await alertBox('Warning', 'You’re at 88% of your monthly limit', '₹6,240 left for 13 days: about ₹480 a day keeps you under.')); }
  b.appendChild(sync); fillW(sync);
  const bud = listCard2([]); bud.setBoundVariable('itemSpacing', ctx.num['space/stack/field-to-field']); pad(bud, 16);
  for (const [st, nm] of [['Over', 'Shopping'], ['Near', 'Food and dining'], ['Under', 'Transport']]) { const i = await budgetBar(st, nm); bud.appendChild(i); fillW(i); if (nm === 'Food and dining') hot(s, i, 'budget'); }
  b.appendChild(stack('space/text/section-heading-below', [await sectionHead('Budgets closest to their limit', 'See all'), bud])); fillW(bud);
  const recent = listCard2([]);
  const rows = mode === 'saved' ? [['Expense', 'Swiggy', 'Food and dining · now', '−₹386'], ['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket']]
    : mode === 'offline-saved' ? [['Pending', 'Swiggy', 'Food and dining · Not synced', '−₹386'], ['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket']]
    : [['Expense', 'Swiggy', 'Food and dining · 1:42 pm', '−₹386'], ['Income', 'Acme Ltd', 'Salary · Received', '+₹84,500'], ['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket']];
  for (const r of rows) { const i = await txInst(...r); recent.appendChild(i); fillW(i); }
  if (mode === 'offline-saved') { const tg = recent.children[0].findAll(n => n.type === 'TEXT' && n.characters === 'Pending')[0]; if (tg) await setTextNode(tg, 'Not synced'); }
  if (mode === 'hidden') for (const t of [...g.findAll(n => n.type === 'TEXT'), ...recent.findAll(n => n.type === 'TEXT'), ...bud.findAll(n => n.type === 'TEXT')]) if (/₹[\d,]+/.test(t.characters)) await setTextNode(t, t.characters.replace(/₹[\d,]+/g, '₹•••••'));
  b.appendChild(stack('space/text/section-heading-below', [await sectionHead('Recent activity', 'See all'), recent])); fillW(recent);
  await fNav(s, 'Home'); await fab(s);
  if (mode === 'saved') { const t = await toast('Action', 'Expense added', 'Undo'); s.f.appendChild(t); t.x = 16; t.y = SCR_H - 80 - 56 - 16 - t.height - 12; s.fixed.push(t); }
  if (mode === 'offline-saved') { const t = await toast('Info', 'Saved offline. It’ll sync when you’re back.'); s.f.appendChild(t); t.x = 16; t.y = SCR_H - 80 - 56 - 16 - t.height - 12; s.fixed.push(t); hot(s, t, 'primary'); }
  if (mode === 'saved') hot(s, g, 'primary');
  if (mode === 'near') hot(s, b.children[1], 'primary');
}
async function budgetDetail(s, mode) {
  await fBar(s, 'Compact', mode === 'near' ? 'Food and dining' : 'Shopping', { hide: ['pencil'] }); hot(s, s.bar.findOne(n => n.name === 'chevron-left'), 'back');
  const b = fBody(s);
  if (mode === 'near') {
    b.appendChild(await amountLine('₹1,800', 'left of your ₹10,000 limit · 13 days to go'));
    const bb = await budgetBar('Near', 'Food and dining'); for (const n of bb.children) if (n.name === 'header' || n.name === 'status') n.visible = false; b.appendChild(bb); fillW(bb);
    b.appendChild(await alertBox('Warning', 'Food is close to its limit', '₹1,800 left for 13 days, about ₹138 a day.'));
    const ch = await inst('Spending charts', 'Type=Line'); b.appendChild(ch); fillW(ch);
    hot(s, ch, 'primary');
  } else if (mode === 'over') {
    b.appendChild(await amountLine('₹740 over', 'your ₹6,000 Shopping limit · 13 days to go', 'color/finance/over-budget'));
    const bb = await budgetBar('Over', 'Shopping'); for (const n of bb.children) if (n.name === 'header' || n.name === 'status') n.visible = false; b.appendChild(bb); fillW(bb);
    b.appendChild(await alertBox('Info', 'Your other budgets still have room', 'Overall you have ₹18,450 of headroom, so this is fixable without stress.'));
    const p = await fBtn('Move room from another budget'); const sec = await fBtn('Raise this limit', 'Outline'); b.appendChild(stack('space/stack/button-stack', [p, sec])); fillW(p); fillW(sec); hot(s, p, 'primary'); hot(s, sec, 'secondary');
    const rows = listCard2([]); for (const r of [['Expense', 'Myntra', 'Shopping · Yesterday', '−₹1,899', 'shopping-bag'], ['Expense', 'Amazon', 'Shopping · 14 Oct', '−₹2,340', 'shopping-bag']]) { const i = await txInst(...r); rows.appendChild(i); fillW(i); }
    b.appendChild(stack('space/text/section-heading-below', [await sectionHead('This month', 'See all'), rows])); fillW(rows);
  } else {
    b.appendChild(stack('space/text/heading-to-body', [await T('Shopping is back within its limit', 'type/title-lg'), await T('Its limit is now ₹6,740 for October. Your overall headroom didn’t change.', 'type/body-lg', 'color/text/secondary')]));
    const bb = await budgetBar('Near', 'Shopping'); for (const n of bb.children) if (n.name === 'header' || n.name === 'status') n.visible = false; b.appendChild(bb); fillW(bb);
    b.appendChild(fCard([await rowKV('Shopping', '₹6,000 → ₹6,740'), await rowKV('Transport', '₹4,000 → ₹3,260'), await rowKV('Overall headroom', 'Still ₹18,450', 'type/amount/md')], 'space/text/list-item'));
  }
  await fNav(s, 'Budgets');
}
async function activityBody(s, mode) {
  await fBar(s, 'Large', 'Activity');
  const b = fBody(s);
  const se = await inst('Search', mode === 'search' ? 'State=Filled' : 'State=Empty'); if (mode === 'search') await setText(se, 'swiggy', 'query'); b.appendChild(se); fillW(se); hot(s, se, 'search');
  const chips = frame('filters', 'HORIZONTAL', 0); chips.setBoundVariable('itemSpacing', ctx.num['space/stack/control-inline']);
  for (const [l, on] of [['October', 'true'], ['Food', mode === 'search' ? 'true' : 'false'], ['Filters', 'false']]) chips.appendChild(await chip('Filter', on, l));
  b.appendChild(chips); hot(s, chips.children[2], 'filter');
  if (mode === 'search') {
    b.appendChild(await T('6 results · −₹2,316 in total', 'type/label-md', 'color/text/secondary'));
    const rows = listCard2([]); for (const r of [['Expense', 'Swiggy', 'Food and dining · Today', '−₹386'], ['Expense', 'Swiggy', 'Food and dining · 16 Oct', '−₹412'], ['Expense', 'Swiggy Instamart', 'Groceries · 12 Oct', '−₹640', 'shopping-basket']]) { const i = await txInst(...r); rows.appendChild(i); fillW(i); }
    b.appendChild(rows); fillW(rows); hot(s, rows.children[0], 'row');
  } else {
    const sum = await single('Period summary'); b.appendChild(sum); fillW(sum);
    const day = async (label, net, rows) => { const h = frame(label, 'HORIZONTAL', 8, { align: 'CENTER' }); const t = await text(label, 'type/label-md', 'color/text/secondary'); h.appendChild(t); t.layoutGrow = 1; h.appendChild(await text(net, 'type/amount/sm', 'color/text/secondary')); const c = listCard2([]); for (const r of rows) { const i = await txInst(...r); c.appendChild(i); fillW(i); } const g = stack('space/text/section-heading-below', [h, c]); b.appendChild(g); fillW(c); fillW(h); return c; };
    const c1 = await day('Today', mode === 'transfer' ? '−₹661' : '−₹1,047', [mode === 'transfer' ? ['Saved', 'To ICICI ••0937', 'Transfer · not spending', '₹386', 'arrow-right'] : mode === 'rule' ? ['Expense', 'Swiggy', 'Groceries · 1:42 pm', '−₹386', 'shopping-basket'] : ['Expense', 'Swiggy', 'Food and dining · 1:42 pm', '−₹386'], ['Pending', 'Uber', 'Transport · Pending', '−₹212', 'bus'], ['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket']]);
    hot(s, c1.children[0], 'row');
    await day('Yesterday', '+₹80,799', [['Income', 'Acme Ltd', 'Salary · Received', '+₹84,500'], ['Saved', 'Goa trip', 'Moved to goal', '₹5,000'], ['Refund', 'Amazon', 'Shopping · Refund', '+₹1,299']]);
  }
  await fNav(s, 'Activity'); await fab(s);
}

/* ---------- lay out flows as sections and wire the prototype ---------- */
async function buildFlows() {
  const p = await page('Flows');
  const GAP_X = 96, CAP_H = 150, PAD = 96;
  let y = 0; const starts = [];
  for (const f of DATA.flows.flows) {
    const sec = figma.createSection(); sec.name = `${f.id} · ${f.name}`; p.appendChild(sec); sec.x = 0; sec.y = y;
    fill(sec, 'color/surface/default'); sec.strokes = [];
    const head = frame('About this flow', 'VERTICAL', 0); head.setBoundVariable('itemSpacing', ctx.num['space/text/heading-to-body']);
    add(head, await text(`${f.id} · ${f.name}`, 'type/display'), await text(f.goal, 'type/body-lg', 'color/text/secondary', { width: 1100 }), await text('Measure: ' + f.measure, 'type/body-md', 'color/text/secondary', { width: 1100 }));
    sec.appendChild(head); head.x = PAD; head.y = PAD;
    const rowsY = { main: PAD + head.height + 72, edge: 0 };
    rowsY.edge = rowsY.main + CAP_H + SCR_H + 120;
    const xi = { main: 0, edge: 0 };
    for (const label of ['main', 'edge']) { if (!f.screens.some(x => x[2] === label)) continue; const t = await text(label === 'main' ? 'Main path' : 'Edge states', 'type/title-md', 'color/text/secondary'); sec.appendChild(t); t.x = PAD; t.y = rowsY[label] - 48; }
    for (const [id, name, kind, note] of f.screens) {
      const s = await screen(id);
      try { await BUILD[id](s); } catch (e) { log.push(`screen ${id} failed: ${e.message}`); }
      await finish(s);
      const x = PAD + xi[kind] * (SCR_W + GAP_X); xi[kind]++;
      sec.appendChild(s.f); s.f.x = x; s.f.y = rowsY[kind] + CAP_H;
      const cap = frame('caption ' + id, 'VERTICAL', 0); cap.setBoundVariable('itemSpacing', ctx.num['space/text/title-to-subtitle']);
      add(cap, await text(`${id}  ${name}`, 'type/title-sm'), await text(note, 'type/body-sm', 'color/text/secondary', { width: SCR_W }));
      sec.appendChild(cap); cap.x = x; cap.y = rowsY[kind];
      if (kind === 'edge' || id === f.screens[0][0] || ['1.09', '4.05', '5.08', '9.01', '7.01'].includes(id)) starts.push({ nodeId: s.f.id, name: `${id} ${name}` });
    }
    const wMax = Math.max(xi.main, xi.edge, 3);
    sec.resizeWithoutConstraints(PAD * 2 + wMax * (SCR_W + GAP_X) - GAP_X, (xi.edge ? rowsY.edge + CAP_H + SCR_H : rowsY.main + CAP_H + SCR_H) + PAD);
    y += sec.height + 200;
  }
  // ---- routing: spec links first, then screen overrides, then global routes, then back/close
  const ORDER = []; const FLOW_OF = {};
  for (const f of DATA.flows.flows) for (const sc of f.screens) { ORDER.push(sc[0]); FLOW_OF[sc[0]] = f; }
  const PREV = {};
  for (const f of DATA.flows.flows) for (const [id] of f.screens) { const src = f.screens.find(x => x[4].some(l => l[1] === id && x[0] !== id)); const mains = f.screens.filter(x => x[2] === 'main').map(x => x[0]); PREV[id] = src ? src[0] : mains[Math.max(0, mains.indexOf(id) - 1)]; }
  const ROUTES = {
    'Button · Continue with Google': '1.07', 'Button · Continue with Apple': '1.07', 'link:Change number': '1.02', 'link:Resend code': '1.04',
    'Button · Choose another bank': '2.02', 'Button · New goal': '7.02', 'Button · Start another goal': '7.02', 'Button · Keep my account': '10.01',
    'Button · Add a bank': '2.02', 'Button · Mark as transfer': '8.08', 'link:Clear all': '8.01',
    'Button · Chat with us · replies in about 10 min': '10.01', 'Button · Email support · replies within a day': '10.01',
    'see-all:Budgets closest to their limit': '6.02', 'see-all:Recent activity': '8.01', 'see-all:This month': '8.01', 'see-all:Coming up': '8.01',
    'Transaction row · Swiggy': '8.05', 'Budget bar · Food and dining': '6.02', 'Budget bar · Shopping': '6.03',
    'Goal card · Goa trip': '7.05', 'Goal card · Emergency fund': '7.06', 'Row · Month starts': '3.02', 'Row · HDFC Savings ••4821': '10.02', 'Row · Connected banks': '10.02', 'Row · Export your data': '10.04',
    'refresh': '4.04', 'eye': '4.02', 'profile': '10.01', 'fab': '5.01', 'budget': '6.02', 'search': '8.02', 'filter': '8.04', 'row': '8.05',
    'nav-Home': '4.01', 'nav-Activity': '8.01', 'nav-Budgets': '6.02', 'nav-Goals': '7.04',
  };
  const OVERRIDE = {
    '2.02': { 'Row · Bank of Baroda': '2.03', 'Row · Canara Bank': '2.03', 'Row · Punjab National Bank': '2.03', 'Row · Yes Bank': '2.03' },
    '4.01': { eye: '4.02' }, '4.02': { eye: '4.01' }, '4.03': { eye: '4.02' }, '5.04': { eye: '4.02', undo: '4.01' }, '5.07': { eye: '4.02' }, '6.01': { eye: '4.02' }, '10.08': { eye: '4.02' },
    '5.10': { undo: '5.09' }, '6.05': { undo: '6.03' }, '8.07': { undo: '8.05' }, '8.08': { undo: '8.05' },
    '5.09': { 'Row · Food and dining': '8.06', 'Button · Delete expense': '5.10', 'Row · Today, 1:42 pm': '5.03', 'Row · HDFC Savings ••4821': '5.03', 'Row · Dinner with Arjun': '5.03' },
    '8.05': { 'Row · Food and dining': '8.06' }, '8.06': { secondary: '8.05' },
    '5.03': { 'Row · Today, 1:42 pm': '5.11', 'Row · HDFC Savings ••4821': '5.12', 'Row · Doesn’t repeat': '5.13' },
    '10.01': { 'Row · Notifications': '10.09', 'Row · Help and feedback': '10.10' },
    '3.06': { 'nav-Home': '4.01' }, '4.05': { notif2: '5.08' },
  };
  const SHEETS = new Set(['5.01', '5.02', '5.03', '5.05', '5.08', '5.11', '5.12', '5.13', '6.04', '6.06', '6.07', '7.05', '8.04', '8.06']);
  const DIALOGS = new Set(['5.06', '10.03', '10.05']);
  const SMART = new Set(['4.01>4.02', '4.02>4.01', '5.01>5.02', '5.02>5.03', '5.05>5.02', '6.02>6.03', '4.04>4.01', '5.04>4.01', '2.05>2.06', '7.04>7.05', '6.03>6.04', '6.03>6.06', '5.09>5.10', '8.05>8.06', '6.04>6.05', '6.06>6.05']);
  const ez = { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 0.05, y1: 0.7, x2: 0.1, y2: 1 } };   // motion/easing/enter
  const std = { type: 'CUSTOM_CUBIC_BEZIER', easingFunctionCubicBezier: { x1: 0.2, y1: 0, x2: 0, y2: 1 } };   // motion/easing/standard
  const transition = (from, to, key) => {
    if (SMART.has(from + '>' + to)) return { type: 'SMART_ANIMATE', easing: std, duration: 0.28 };
    if (/^nav-/.test(key)) return { type: 'DISSOLVE', easing: std, duration: 0.12 };
    if (DIALOGS.has(to) || DIALOGS.has(from)) return { type: 'DISSOLVE', easing: std, duration: 0.2 };
    if (SHEETS.has(to) && !SHEETS.has(from)) return { type: 'MOVE_IN', direction: 'TOP', matchLayers: false, easing: ez, duration: 0.28 };
    if (SHEETS.has(from) && !SHEETS.has(to)) return { type: 'DISSOLVE', easing: std, duration: 0.2 };
    if (key === 'back' || key === 'close' || key === 'undo' || ORDER.indexOf(to) < ORDER.indexOf(from) && FLOW_OF[to] === FLOW_OF[from]) return { type: 'SLIDE_IN', direction: 'RIGHT', matchLayers: false, easing: std, duration: 0.28 };
    return { type: 'SLIDE_IN', direction: 'LEFT', matchLayers: false, easing: std, duration: 0.28 };
  };
  const go = (from, to, key) => ({ trigger: { type: 'ON_CLICK' }, actions: [{ type: 'NODE', destinationId: SCR[to].id, navigation: 'NAVIGATE', transition: transition(from, to, key), preserveScrollPosition: false }] });
  let links = 0; const dead = [], bad = [], rows = [];
  for (const f of DATA.flows.flows) for (const [id, , , , lk] of f.screens) {
    const want = {}; for (const [k, to] of lk) want[k] = to;
    const bg = SCR_BG[id];
    for (const [k, h] of Object.entries(HOT[id] || {})) {
      let to = want[k] || (OVERRIDE[id] || {})[k] || ROUTES[k];
      if (!to && /^Transaction row · /.test(k) && id !== '8.05') to = '8.05';   // every transaction opens the detail template
      if (!to && /^Budget bar · /.test(k)) to = /Shopping/.test(k) ? '6.03' : '6.02';
      if (!to && (k === 'back' || k === 'close')) to = bg || PREV[id];
      if (to === id) continue;
      if (!to || !SCR[to]) { if (/^(Row|Transaction row|Budget bar|Goal card) · /.test(k)) { rows.push(`${id} ${k.replace(/^\w+( row)? · /, '')}`); h.remove(); } else dead.push(`${id} ${k}`); continue; }
      try { await h.setReactionsAsync([go(id, to, k)]); links++; } catch (e) { bad.push(`${id}:${k}→${to}`); }
    }
  }
  // timed steps: imports finish, loading resolves, toasts dismiss
  // (no timer on 5.04: dismissing the toast must not jump to a Home without the new expense)
  const TIMED = [['2.05', '2.06', 2.5], ['4.04', '4.01', 1.2], ['1.09', '4.01', 1.6]];
  for (const [from, to, t] of TIMED) { try { await SCR[from].setReactionsAsync([{ trigger: { type: 'AFTER_TIMEOUT', timeout: t }, actions: [{ type: 'NODE', destinationId: SCR[to].id, navigation: 'NAVIGATE', transition: transition(from, to, 'timer'), preserveScrollPosition: false }] }]); links++; } catch (e) { bad.push(`${from} timer→${to}`); } }
  p.flowStartingPoints = starts;
  log.push(`flows: ${Object.keys(SCR).length} screens · ${links} prototype links · ${starts.length} starting points`);
  log.push(dead.length ? `BUTTONS WITHOUT A DESTINATION (${dead.length}): ${dead.join(', ')}` : 'every button, link, back, close, undo and tab has a destination');
  if (rows.length) log.push(`rows left unlinked (no designed screen yet, ${rows.length}): ${rows.join(', ')}`);
  if (bad.length) log.push('rejected links: ' + bad.join(', '));
}
