/* Headroom DS Builder — builds the Headroom design system in the current Figma file.
   Safe to re-run: variables and styles are updated by name, generated pages are rebuilt.
   Everything visual is bound to variables from the "Color" (Light) collection. */

const FONT = 'Anek Latin';
const WEIGHT = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold' };
const PAGE_NAMES = ['Cover', 'Guidelines', 'Foundations', 'Icons', 'Components · Basics', 'Components · Containers and feedback', 'Components · Navigation', 'Components · Finance', 'Proof screens'];
const log = [];
const ctx = { color: {}, dark: {}, prim: {}, num: {}, styles: {}, effects: {}, icons: {} };

/* ---------------- utilities ---------------- */
const hex = h => ({ r: parseInt(h.slice(1, 3), 16) / 255, g: parseInt(h.slice(3, 5), 16) / 255, b: parseInt(h.slice(5, 7), 16) / 255 });
const rgba = s => { const [r, g, b, a] = s.match(/[\d.]+/g).map(Number); return { r: r / 255, g: g / 255, b: b / 255, a }; };
const css = p => 'var(--' + p.replace(/\//g, '-') + ')';
function paint(name, store = ctx.color) {
  const v = store[name]; if (!v) throw new Error('Missing colour variable ' + name);
  return figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', v);
}
function fill(node, ...names) { node.fills = names.filter(Boolean).map(n => paint(n)); return node; }
function stroke(node, name, w = 1, opts = {}) {
  node.strokes = [paint(name)]; node.strokeWeight = w; node.strokeAlign = opts.align || 'INSIDE';
  if (opts.dash) node.dashPattern = opts.dash; return node;
}
function bindNum(node, field, varName, fallback) {
  const v = ctx.num[varName];
  if (v) node.setBoundVariable(field, v); else node[field] = fallback;
}
function rad(node, r) { for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) bindNum(node, k, 'radius/' + r, 0); return node; }
const SPACE = {};
/* Every padding and gap binds to a semantic spacing token chosen by axis and context, never a primitive.
   Off-scale values snap to the nearest token (3→4, 6→8 padding, 10→8, 28→24). */
const SEM = {
  inset:  { 0: 'space/inset/none', 3: 'space/inset/xs', 4: 'space/inset/xs', 8: 'space/inset/sm', 12: 'space/inset/md', 16: 'space/inset/lg', 20: 'space/inset/xl', 24: 'space/inset/xl', 28: 'space/inset/xl', 32: 'space/layout/section/compact', 40: 'space/inset/2xl', 48: 'space/layout/section/expanded' },
  block:  { 0: 'space/inset/none', 2: 'space/squish/sm/block', 4: 'space/inset/xs', 8: 'space/squish/md/block', 12: 'space/squish/xl/block', 16: 'space/inset/lg', 20: 'space/inset/xl', 24: 'space/inset/xl', 28: 'space/inset/xl', 32: 'space/layout/section/compact', 40: 'space/inset/2xl', 48: 'space/layout/section/expanded' },
  inline: { 0: 'space/inset/none', 4: 'space/inset/xs', 6: 'space/squish/sm/inline', 8: 'space/squish/sm/inline', 12: 'space/squish/md/inline', 16: 'space/squish/lg/inline', 20: 'space/squish/xl/inline', 24: 'space/inset/xl', 28: 'space/inset/xl', 32: 'space/layout/page-margin/expanded', 40: 'space/layout/page-margin/large', 48: 'space/layout/section/expanded' },
  row:    { 0: 'space/icon/target-to-target', 2: 'space/icon/target-to-target', 4: 'space/text/inline', 6: 'space/icon/to-text-sm', 8: 'space/icon/to-text-md', 10: 'space/icon/to-text-md', 12: 'space/media/tile-to-text', 16: 'space/media/thumb-to-text', 24: 'space/layout/gutter/expanded', 32: 'space/layout/section/compact', 48: 'space/layout/section/expanded' },
  column: { 0: 'space/stack/row-to-row', 2: 'space/text/title-to-subtitle', 4: 'space/text/amount-to-caption', 6: 'space/text/label-to-field', 8: 'space/text/heading-to-body', 10: 'space/text/heading-to-body', 12: 'space/stack/card-to-card', 16: 'space/stack/field-to-field', 24: 'space/stack/group-to-group', 32: 'space/stack/fieldset-to-fieldset', 40: 'space/layout/section/medium', 48: 'space/layout/section/expanded' },
  wrap:   { 8: 'space/stack/control-inline', 12: 'space/stack/card-to-card', 16: 'space/layout/gutter/medium', 24: 'space/layout/gutter/expanded' },
};
const unbound = new Set();
function semFor(node, field, px, kind) {
  if (kind) return SEM[kind][px];
  if (field === 'itemSpacing') return SEM[node.layoutMode === 'HORIZONTAL' ? 'row' : 'column'][px];
  if (field === 'counterAxisSpacing') return SEM.wrap[px];
  return SEM[/Top|Bottom/.test(field) ? 'block' : 'inline'][px];
}
function sp(node, field, px, kind) {
  const n = semFor(node, field, px, kind), v = n && ctx.num[n];
  if (v) node.setBoundVariable(field, v); else { node[field] = px; unbound.add(`${field} ${px}`); }
}
function pad(node, y, x = y, b = y, l = x) {
  const k = (y === x && x === b && b === l) ? 'inset' : undefined;
  sp(node, 'paddingTop', y, k); sp(node, 'paddingRight', x, k); sp(node, 'paddingBottom', b, k); sp(node, 'paddingLeft', l, k); return node;
}
function al(node, dir = 'VERTICAL', gap = 0, o = {}) {
  node.layoutMode = dir; node.primaryAxisSizingMode = 'AUTO'; node.counterAxisSizingMode = 'AUTO';
  sp(node, 'itemSpacing', gap);
  if (o.align) node.counterAxisAlignItems = o.align;
  if (o.justify) node.primaryAxisAlignItems = o.justify;
  if (!o.keepFill) node.fills = [];
  return node;
}
function frame(name, dir = 'VERTICAL', gap = 0, o = {}) { const f = figma.createFrame(); f.name = name; al(f, dir, gap, o); f.clipsContent = false; return f; }
function fixedW(node, w) { const sz = node.primaryAxisSizingMode; node.resize(w, Math.max(node.height, 1)); if (node.layoutMode === 'VERTICAL') { node.primaryAxisSizingMode = 'AUTO'; node.counterAxisSizingMode = 'FIXED'; } else { node.primaryAxisSizingMode = 'FIXED'; node.counterAxisSizingMode = 'AUTO'; } return node; }
function fixedH(node, h) { node.resize(Math.max(node.width, 1), h); if (node.layoutMode === 'HORIZONTAL') { node.counterAxisSizingMode = 'FIXED'; node.primaryAxisSizingMode = 'AUTO'; } else { node.primaryAxisSizingMode = 'FIXED'; } return node; }
function fixed(node, w, h) { node.resize(w, h); node.primaryAxisSizingMode = 'FIXED'; node.counterAxisSizingMode = 'FIXED'; return node; }
function add(parent, ...kids) { for (const k of kids) if (k) parent.appendChild(k); return parent; }
function fillW(node) { node.layoutSizingHorizontal = 'FILL'; return node; }
async function text(chars, style = 'type/body-md', color = 'color/text/primary', o = {}) {
  const t = figma.createText();
  await t.setTextStyleIdAsync(ctx.styles[style].id);
  t.characters = String(chars);
  fill(t, color);
  if (o.width) { t.textAutoResize = 'HEIGHT'; t.resize(o.width, t.height); }
  if (o.align) t.textAlignHorizontal = o.align;
  if (o.name) t.name = o.name;
  return t;
}
function rect(w, h, color, r) { const n = figma.createRectangle(); n.resize(w, h); if (color) fill(n, color); else n.fills = []; if (r) rad(n, r); return n; }
function ellipse(d, color) { const n = figma.createEllipse(); n.resize(d, d); fill(n, color); return n; }
function icon(name, size = 24, color = 'color/text/primary') {
  const c = ctx.icons[name]; if (!c) throw new Error('Missing icon ' + name);
  const i = c.createInstance(); i.resize(size, size);
  for (const v of i.findAll(n => n.type === 'VECTOR' || n.type === 'ELLIPSE' || n.type === 'RECTANGLE' || n.type === 'LINE' || n.type === 'BOOLEAN_OPERATION')) { if (v.strokes && v.strokes.length) v.strokes = [paint(color)]; if (Array.isArray(v.fills) && v.fills.some(f => f.type === 'SOLID')) v.fills = [paint(color)]; }
  return i;
}
function dash(width, color = 'color/finance/clearance-line', vertical = false) {
  const l = figma.createLine(); l.resize(vertical ? 0.01 : width, 0); if (vertical) l.rotation = -90;
  l.strokes = [paint(color)]; l.strokeWeight = 2; l.dashPattern = [6, 4]; l.strokeCap = 'NONE'; l.name = 'clearance-line'; return l;
}
const inr = n => { const s = String(Math.round(Math.abs(n))); const last3 = s.slice(-3), rest = s.slice(0, -3); return (n < 0 ? '-' : '') + (rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3 : last3); }; // the plugin sandbox has no Intl

/* ---------------- 1. variables ---------------- */
async function buildVariables() {
  const cols = await figma.variables.getLocalVariableCollectionsAsync();
  const vars = await figma.variables.getLocalVariablesAsync();
  const coll = (name, mode) => { let c = cols.find(x => x.name === name); if (!c) { c = figma.variables.createVariableCollection(name); c.renameMode(c.modes[0].modeId, mode); } return c; };
  const mk = (c, name, type) => vars.find(v => v.variableCollectionId === c.id && v.name === name) || figma.variables.createVariable(name, c, type);
  const prim = coll('Primitives', 'Value'), pm = prim.modes[0].modeId;
  for (const [ramp, stops] of Object.entries(DATA.prims)) for (const [stop, h] of Object.entries(stops)) {
    const v = mk(prim, `${ramp}/${stop}`, 'COLOR'); v.setValueForMode(pm, hex(h)); v.scopes = []; v.setVariableCodeSyntax('WEB', `var(--color-${ramp}-${stop})`); v.description = `${(DATA.primNames[ramp] || {})[stop] || ''} · ${h}`; ctx.prim[`${ramp}/${stop}`] = v;
  }
  const scopes = p => {
    if (p.startsWith('color/surface/') || p.startsWith('color/overlay/') || /-bg$/.test(p) || /(headroom|spent|over-fill|near-fill|savings-fill)$/.test(p) || p === 'color/action/secondary') return ['FRAME_FILL', 'SHAPE_FILL'];
    if (p.startsWith('color/border/')) return ['STROKE_COLOR'];
    if (p.startsWith('color/text/')) return ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
    if (p === 'color/finance/clearance-line' || p.startsWith('color/chart/') || /^color\/action\/primary/.test(p)) return ['FRAME_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
    return ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR'];
  };
  const light = coll('Color', 'Light'), lm = light.modes[0].modeId;
  const dark = coll('Color · Dark', 'Dark'), dm = dark.modes[0].modeId;
  const val = r => r.startsWith('rgba') ? rgba(r) : figma.variables.createVariableAlias(ctx.prim[r]);
  for (const [p, l, d, desc] of DATA.semantic) {
    const a = mk(light, p, 'COLOR'); a.setValueForMode(lm, val(l)); a.scopes = scopes(p); a.setVariableCodeSyntax('WEB', css(p)); const nm = r => r.startsWith('rgba') ? r : `${(DATA.primNames[r.split('/')[0]] || {})[r.split('/')[1]] || ''} (${r})`; a.description = `${desc} Light: ${nm(l)}. Dark: ${nm(d)}.`.trim(); ctx.color[p] = a;
    const b = mk(dark, p, 'COLOR'); b.setValueForMode(dm, val(d)); b.scopes = []; b.setVariableCodeSyntax('WEB', css(p)); b.description = 'Dark value. Hidden from pickers until the file can use a real Dark mode (Starter plan: 1 mode).'; ctx.dark[p] = b;
  }
  const nums = (name, rows, sc) => { const c = coll(name, 'Value'), m = c.modes[0].modeId; for (const [n, v, d] of rows) { const x = mk(c, n, 'FLOAT'); x.setValueForMode(m, v); x.scopes = sc; x.setVariableCodeSyntax('WEB', css(n)); if (d) x.description = d; ctx.num[n] = x; } };
  { const c = coll('Spacing', 'Value'), m = c.modes[0].modeId, byPath = {};
    for (const [n, v, d] of DATA.spacing.filter(r => /^space\/\d+$/.test(r[0]))) { const x = mk(c, n, 'FLOAT'); x.setValueForMode(m, v); x.scopes = []; x.setVariableCodeSyntax('WEB', css(n)); x.description = 'Primitive. Use a semantic space/* token instead. ' + (d || ''); ctx.num[n] = x; byPath[n] = x; }
    for (const g of DATA.spGroups) for (const [n, ref, v, axis, between, ex] of g.tokens) { const x = mk(c, n, 'FLOAT'); x.setValueForMode(m, figma.variables.createVariableAlias(byPath[ref])); x.scopes = ['GAP']; x.setVariableCodeSyntax('WEB', css(n)); x.description = `${between.replace(/ ↔ /g, ' to ')}. ${ex.replace(/ ↔ /g, ' to ')} (${ref}, ${v}px)`; ctx.num[n] = x; }
    for (const [n, cpt, med, exp, lg, between] of DATA.spLayout) for (const [bp, v] of [['compact', cpt], ['medium', med], ['expanded', exp], ['large', lg]]) { const x = mk(c, `${n}/${bp}`, 'FLOAT'); x.setValueForMode(m, v); x.scopes = ['GAP']; x.setVariableCodeSyntax('WEB', css(n)); x.description = `${between} (${bp}).`; ctx.num[`${n}/${bp}`] = x; }
    const keep = new Set(Object.keys(ctx.num).filter(k => k.startsWith('space/')));
    for (const v of vars) if (v.variableCollectionId === c.id && !keep.has(v.name)) v.remove(); }
  nums('Radius', DATA.radius, ['CORNER_RADIUS']);
  nums('Size', DATA.size, ['WIDTH_HEIGHT']);
  nums('Border', [['border/width/hairline', 1, 'Dividers, input rest state.'], ['border/width/strong', 2, 'Focus ring, selected, error.'], ['border/width/clearance', 2, 'Clearance line. Dash 6 on, 4 off.']], ['STROKE_FLOAT']);
  nums('Motion', [['motion/duration/instant', 0, 'Reduced-motion replacement.'], ['motion/duration/fast', 120, 'Press, toggles, ticks.'], ['motion/duration/base', 200, 'Hover, tabs, chips.'], ['motion/duration/moderate', 280, 'Sheets and modals enter.'], ['motion/duration/slow', 400, 'Fills and chart draw, once per first view.'], ['motion/duration/deliberate', 640, 'Goal reached only.']], []);
  const ty = coll('Typography', 'Value'), tm = ty.modes[0].modeId;
  for (const [n, v, d] of [['font/family/brand', FONT, 'Display, titles and every amount.'], ['font/family/ui', FONT, 'Web value. iOS uses SF Pro, Android uses Roboto.'], ['motion/easing/standard', 'cubic-bezier(0.2, 0, 0, 1)'], ['motion/easing/enter', 'cubic-bezier(0.05, 0.7, 0.1, 1)'], ['motion/easing/exit', 'cubic-bezier(0.3, 0, 0.8, 0.15)']]) {
    const x = mk(ty, n, 'STRING'); x.setValueForMode(tm, v); x.scopes = n.startsWith('font/') ? ['FONT_FAMILY'] : []; x.setVariableCodeSyntax('WEB', css(n)); if (d) x.description = d;
  }
  for (const v of vars) if (v.variableCollectionId === prim.id && !ctx.prim[v.name]) v.remove();
  log.push(`variables: ${Object.keys(ctx.prim).length} primitives, ${Object.keys(ctx.color).length} colour (+ dark set), ${Object.keys(ctx.num).length} numbers`);
}

/* ---------------- 2. styles ---------------- */
async function buildStyles() {
  for (const w of Object.values(WEIGHT)) await figma.loadFontAsync({ family: FONT, style: w });
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  const existing = await figma.getLocalTextStylesAsync();
  for (const t of DATA.types) {
    let s = existing.find(x => x.name === t.name) || figma.createTextStyle();
    s.name = t.name; s.fontName = { family: FONT, style: WEIGHT[t.weight] }; s.fontSize = t.size;
    s.lineHeight = { unit: 'PIXELS', value: t.line }; s.letterSpacing = { unit: 'PERCENT', value: t.tracking * 100 };
    s.description = (t.desc || '') + (t.numeric ? ' Numeric: turn on tabular figures (tnum) and slashed zero in Type details.' : '') + (t.width && t.width !== '100%' ? ` Code uses width ${t.width} on the wdth axis.` : '');
    ctx.styles[t.name] = s;
  }
  const effects = await figma.getLocalEffectStylesAsync();
  const sh = (y, blur, a, dark) => ({ type: 'DROP_SHADOW', color: dark ? { r: 0, g: 0, b: 0, a } : { r: 7 / 255, g: 11 / 255, b: 15 / 255, a }, offset: { x: 0, y }, radius: blur, spread: 0, visible: true, blendMode: 'NORMAL' });
  const defs = {
    'elevation/1': [sh(1, 2, .06), sh(2, 8, .06)], 'elevation/2': [sh(2, 4, .06), sh(8, 24, .10)], 'elevation/3': [sh(4, 8, .08), sh(16, 48, .16)],
    'elevation-dark/2': [sh(8, 24, .40, true)], 'elevation-dark/3': [sh(16, 48, .56, true)],
  };
  for (const [n, fx] of Object.entries(defs)) { let s = effects.find(x => x.name === n) || figma.createEffectStyle(); s.name = n; s.effects = fx; s.description = n.includes('dark') ? 'Dark mode: elevation is tonal (surface/raised) plus this shadow.' : 'Shadows tinted with neutral/1000, never pure black.'; ctx.effects[n] = s; }
  log.push(`styles: ${DATA.types.length} text, ${Object.keys(defs).length} effect`);
}
async function fx(node, n) { await node.setEffectStyleIdAsync(ctx.effects[n].id); }

/* ---------------- 3. pages ---------------- */
async function page(name) {
  let p = figma.root.children.find(x => x.name === name);
  if (!p) { if (name === 'Cover' && figma.root.children.length === 1 && figma.root.children[0].children.length === 0) { p = figma.root.children[0]; p.name = 'Cover'; } else { p = figma.createPage(); p.name = name; } }
  await figma.setCurrentPageAsync(p);
  for (const c of [...p.children]) c.remove();
  p.backgrounds = [{ type: 'SOLID', color: hex('#F3F7FC') }];
  return p;
}
async function board(title, desc, width = 1280) {
  const b = frame('Board · ' + title, 'VERTICAL', 24); fill(b, 'color/surface/default'); rad(b, 'xl'); pad(b, 48); fixedW(b, width);
  b.appendChild(await text(title, 'type/title-lg'));
  if (desc) b.appendChild(await text(desc, 'type/body-lg', 'color/text/secondary', { width: Math.min(820, width - 96) }));
  return b;
}
function column(pageNode, gap = 80) { const c = frame('Column', 'VERTICAL', 0); c.itemSpacing = gap; c.x = 120; c.y = 120; pageNode.appendChild(c); return c; }

/* ---------------- 4. icons ---------------- */
async function buildIcons() {
  const p = await page('Icons');
  const col = column(p);
  const b = await board('Icons', 'All icons by Not Boring Icons (notboringicons.com), stroke style, 24px grid, round caps, re-weighted to 1.75 at 24px. Component names keep Headroom’s icon names; each description gives the Not Boring Icons source. Amber cells are stand-ins for meanings not in the library yet. Category icons sit in a 40px tile beside their name; system chrome uses SF Symbols / Material Symbols on device.');
  const grid = frame('Icon grid', 'HORIZONTAL', 16); grid.layoutWrap = 'WRAP'; sp(grid, 'counterAxisSpacing', 16); fixedW(grid, 1184);
  for (const [name, svg] of Object.entries(DATA.icons)) {
    const node = figma.createNodeFromSvg(svg);
    const c = figma.createComponent(); c.name = 'icon/' + name; c.resize(24, 24); c.fills = []; c.clipsContent = false;
    for (const ch of [...node.children]) { c.appendChild(ch); }
    node.remove();
    for (const v of c.findAll(n => 'strokes' in n)) { if (v.strokes && v.strokes.length) v.strokes = [paint('color/text/primary')]; if (Array.isArray(v.fills) && v.fills.some(f => f.type === 'SOLID')) v.fills = [paint('color/text/primary')]; if ('constraints' in v) v.constraints = { horizontal: 'SCALE', vertical: 'SCALE' }; }
    const src = DATA.iconSrc[name] || {};
    c.description = `Not Boring Icons "${src.src}" (notboringicons.com)${src.standIn ? ' · stand-in: not in the library yet' : ''}. Swap via the Icon property on components.`;
    const cell = frame('cell', 'VERTICAL', 8, { align: 'CENTER' }); fill(cell, src.standIn ? 'color/status/warning-bg' : 'color/surface/canvas'); rad(cell, 'md'); pad(cell, 16, 8); fixedW(cell, 132);
    add(cell, c, await text(name, 'type/caption', 'color/text/secondary', { align: 'CENTER' }));
    grid.appendChild(cell);
    ctx.icons[name] = c;
  }
  b.appendChild(grid); col.appendChild(b);
  log.push(`icons: ${Object.keys(ctx.icons).length}`);
}

/* ---------------- 5. cover + foundations ---------------- */
async function gaugeNode(w, h, pct, o = {}) {
  const g = figma.createFrame(); g.name = 'clearance-gauge'; g.resize(w, h); fill(g, 'color/finance/headroom'); rad(g, 'lg'); g.clipsContent = true;
  const fh = Math.max(0.01, Math.min(pct, 1.16) * (h * 0.84));
  const f = rect(w, fh, pct > 1 ? 'color/finance/over-fill' : pct >= .8 ? 'color/finance/near-fill' : 'color/finance/spent'); f.y = h - fh; f.name = 'fill'; f.constraints = { horizontal: 'STRETCH', vertical: 'MAX' }; g.appendChild(f);
  const l = dash(w); l.y = h * 0.16; l.constraints = { horizontal: 'STRETCH', vertical: 'MIN' }; g.appendChild(l);
  if (o.labels !== false) {
    const lim = await text('Limit ₹52,000', 'type/label-sm'); lim.x = w - lim.width - 16; lim.y = h * 0.16 - 22; lim.constraints = { horizontal: 'MAX', vertical: 'MIN' }; g.appendChild(lim);
    const room = frame('headroom', 'VERTICAL', 2); add(room, await text(pct > 1 ? 'Over the limit by' : 'Headroom', 'type/label-md', 'color/text/secondary'), await text('₹' + inr(Math.abs(Math.round(52000 * (1 - pct)))), 'type/amount/hero', pct > 1 ? 'color/finance/over-budget' : 'color/text/primary'));
    const fillTop = h - fh; room.x = 20; room.y = (pct >= 0.8 && pct <= 1) ? fillTop + 16 : h * 0.16 + 18; g.appendChild(room);
    const sp2 = frame('spent', 'VERTICAL', 0); add(sp2, await text('Spent so far', 'type/label-md'), await text('₹' + inr(Math.round(52000 * pct)), 'type/amount/lg')); sp2.x = 20; sp2.y = h - 76; sp2.constraints = { horizontal: 'MIN', vertical: 'MAX' }; g.appendChild(sp2);
  }
  return g;
}
async function buildCover() {
  const p = await page('Cover');
  const f = figma.createFrame(); f.name = 'Cover'; f.resize(1920, 1080); fill(f, 'color/surface/canvas'); f.x = 0; f.y = 0; p.appendChild(f);
  const left = frame('Intro', 'VERTICAL', 24); left.x = 160; left.y = 260; f.appendChild(left);
  const t1 = await text('Headroom', 'type/display'); t1.name = 'Wordmark (cover only, outside the type scale)'; t1.fontSize = 120; t1.lineHeight = { unit: 'PIXELS', value: 120 };
  add(left, t1, await text('A money app that shows how much room you have left, not how much you’ve spent.', 'type/title-md', 'color/text/secondary', { width: 760 }),
    await text('Design system v' + DATA.gov.version + ' · Foundations, 35 components and 5 proposed components · Generated from tokens.json · Icons by Not Boring Icons (notboringicons.com)', 'type/body-md', 'color/text/secondary', { width: 760 }),
    await text('Note: this file is on Figma Starter (1 variable mode). Light lives in the “Color” collection; dark values live in “Color · Dark” with the same names, ready to become a Dark mode after an upgrade.', 'type/body-sm', 'color/status/info', { width: 760 }));
  const card = frame('Gauge card', 'VERTICAL', 16); fill(card, 'color/surface/raised'); rad(card, 'xl'); pad(card, 28); await fx(card, 'elevation/3'); card.x = 1180; card.y = 200;
  add(card, await text('October · 13 days left', 'type/title-sm'), await gaugeNode(520, 560, 33550 / 52000), await text('On track · about ₹1,419 a day', 'type/label-lg', 'color/status/success'));
  f.appendChild(card);
}
async function buildFoundations() {
  const p = await page('Foundations');
  const col = column(p);
  // primitives
  const b1 = await board('Color · primitives', 'Six OKLCH ramps with a name for every stop (Neutral Light Black = neutral/900). Never used directly in components (hidden from pickers); semantic tokens alias them.');
  for (const [ramp, stops] of Object.entries(DATA.prims)) {
    const row = frame(ramp, 'HORIZONTAL', 0, { align: 'CENTER' }); const rl = await text(((DATA.primNames[ramp] || {})['500'] || ramp).split(' ')[0] + '\ncolor/' + ramp, 'type/label-md'); rl.resize(110, rl.height); rl.textAutoResize = 'HEIGHT'; row.appendChild(rl);
    const strip = frame('ramp', 'HORIZONTAL', 0); rad(strip, 'md'); strip.clipsContent = true; stroke(strip, 'color/border/subtle');
    for (const [stop, h] of Object.entries(stops)) {
      const sw = frame(stop, 'VERTICAL', 0, { justify: 'MAX' }); const swW = Math.min(88, Math.floor(1074 / Object.keys(stops).length)); fixed(sw, swW, 92); sw.fills = [figma.variables.setBoundVariableForPaint({ type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', ctx.prim[`${ramp}/${stop}`])]; pad(sw, 8);
      const L = (() => { const c = hex(h); return 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b; })();
      const lab = await text(`${((DATA.primNames[ramp] || {})[stop] || '').split(' ').slice(1).join(' ')}\n${stop}\n${h}`, 'type/caption', L > 0.45 ? 'color/text/primary' : 'color/text/inverse', { width: swW - 16 }); sw.appendChild(lab);
      strip.appendChild(sw);
    }
    add(row, strip); b1.appendChild(row);
  }
  col.appendChild(b1);
  // semantic
  const b2 = await board('Color · semantic', 'What components consume. Left swatch: Color (Light). Right swatch: Color · Dark. Every text pairing measured at WCAG AA in tools/build_tokens.py.');
  const grid = frame('Semantic grid', 'HORIZONTAL', 16); grid.layoutWrap = 'WRAP'; sp(grid, 'counterAxisSpacing', 12); fixedW(grid, 1184);
  for (const [path, l, d] of DATA.semantic) {
    const cell = frame(path, 'HORIZONTAL', 12, { align: 'CENTER' }); fill(cell, 'color/surface/canvas'); rad(cell, 'md'); pad(cell, 12); fixedW(cell, 384);
    const s1 = rect(32, 32, path, 'sm'); stroke(s1, 'color/border/subtle');
    const s2 = rect(32, 32, null, 'sm'); s2.fills = [paint(path, ctx.dark)]; stroke(s2, 'color/border/subtle');
    const tx = frame('label', 'VERTICAL', 0); const nmz = r => r.startsWith('rgba') ? r : ((DATA.primNames[r.split('/')[0]] || {})[r.split('/')[1]] || r); add(tx, await text(path.replace('color/', ''), 'type/label-md'), await text(`${nmz(l)} · ${nmz(d)}`, 'type/caption', 'color/text/secondary'));
    add(cell, s1, s2, tx); grid.appendChild(cell);
  }
  b2.appendChild(grid); col.appendChild(b2);
  // type
  const b3 = await board('Typography', 'Anek Latin carries display, titles and every amount (native ₹, tabular figures, slashed zero, narrow tabular commas). On phones, body and controls use SF Pro / Roboto.');
  const samples = { 'type/display': 'Room to breathe', 'type/title-lg': 'October budget', 'type/title-md': 'Food and dining', 'type/title-sm': 'Recent activity', 'type/body-lg': 'You have ₹18,450 left for the next 13 days.', 'type/body-md': 'Swiggy · Food and dining · Today, 1:42 pm', 'type/body-sm': 'Budgets reset on the 1st of every month.', 'type/label-lg': 'Add expense', 'type/label-md': 'This month', 'type/label-sm': 'Over', 'type/caption': '1 Oct – 31 Oct · amounts in ₹', 'type/amount/hero': '₹18,450', 'type/amount/lg': '₹52,000', 'type/amount/md': '−₹1,899', 'type/amount/sm': '+₹84,500', 'type/amount/compact': '₹1,24,500 · ₹98,000' };
  for (const t of DATA.types) {
    const row = frame(t.name, 'HORIZONTAL', 32, { align: 'CENTER' }); fixedW(row, 1184);
    const meta = frame('meta', 'VERTICAL', 2); add(meta, await text(t.name, 'type/label-md'), await text(`${t.size}/${t.line} · ${WEIGHT[t.weight]}`, 'type/caption', 'color/text/secondary')); meta.resize(220, meta.height); meta.counterAxisSizingMode = 'FIXED';
    add(row, meta, await text(samples[t.name] || t.name, t.name)); b3.appendChild(row);
  }
  col.appendChild(b3);
  // spacing + radius + elevation
  const b4 = await board('Spacing, radius and elevation', '4px base with an 8px rhythm. Radius grows with size. Light-mode shadows are tinted with neutral/1000; dark mode is tonal.');
  const spRow = frame('spacing', 'VERTICAL', 8);
  for (const [n, v] of DATA.spacing.filter(r => /^space\/\d+$/.test(r[0]))) { const r = frame(n, 'HORIZONTAL', 16, { align: 'CENTER' }); const lab = await text(`${n} · ${v}px`, 'type/label-md'); lab.resize(160, lab.height); lab.textAutoResize = 'HEIGHT'; add(r, lab, rect(Math.max(v * 4, 1), 16, 'color/finance/spent', v ? 'xs' : null)); spRow.appendChild(r); }
  const rRow = frame('radius', 'HORIZONTAL', 24);
  for (const [n, v] of DATA.radius) { const c = frame(n, 'VERTICAL', 8); const sq = rect(96, 72, 'color/finance/headroom'); rad(sq, n.replace('radius/', '')); stroke(sq, 'color/action/primary', 2); add(c, sq, await text(`${n} · ${v > 999 ? 'pill' : v + 'px'}`, 'type/caption', 'color/text/secondary')); rRow.appendChild(c); }
  const eRow = frame('elevation', 'HORIZONTAL', 32); fill(eRow, 'color/surface/canvas'); pad(eRow, 32); rad(eRow, 'lg');
  for (const e of ['elevation/1', 'elevation/2', 'elevation/3']) { const c = frame(e, 'VERTICAL', 8); fill(c, 'color/surface/raised'); rad(c, 'lg'); pad(c, 20); fixed(c, 220, 120); await fx(c, e); add(c, await text(e, 'type/label-md')); eRow.appendChild(c); }
  add(b4, spRow, rRow, eRow); col.appendChild(b4);
  // semantic spacing, one board per relationship group
  for (const g of DATA.spGroups) {
    const bg = await board('Spacing · ' + g.title, g.intro);
    const grid = frame('tokens', 'HORIZONTAL', 16); grid.layoutWrap = 'WRAP'; sp(grid, 'counterAxisSpacing', 16); fixedW(grid, 1184);
    for (const [n, ref, v, axis, between, ex] of g.tokens) {
      const card = frame(n, 'VERTICAL', 8); fill(card, 'color/surface/canvas'); rad(card, 'lg'); pad(card, 16); fixedW(card, 384);
      const dia = frame('diagram', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fill(dia, 'color/surface/default'); rad(dia, 'md'); fixed(dia, 352, 120);
      const box = (w, h) => { const r = rect(w, h, 'color/surface/sunken', 'xs'); stroke(r, 'color/border/default'); return r; };
      const gap = (w, h) => { const r = rect(Math.max(w, 1), Math.max(h, 1), 'color/action/secondary'); stroke(r, 'color/border/focus', 1, { dash: [3, 2] }); return r; };
      if (axis === 'all') { const o = frame('inset', 'VERTICAL', 0); fill(o, 'color/action/secondary'); stroke(o, 'color/border/focus', 1, { dash: [3, 2] }); rad(o, 'sm'); for (const f of ['paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight']) o.setBoundVariable(f, ctx.num[n]); o.appendChild(box(72, 24)); dia.appendChild(o); }
      else if (axis === 'inline') add(dia, box(44, 28), gap(v, 28), box(44, 28));
      else if (axis === 'both') { const w = frame('wrap', 'HORIZONTAL', 0); w.layoutWrap = 'WRAP'; w.setBoundVariable('itemSpacing', ctx.num[n]); w.setBoundVariable('counterAxisSpacing', ctx.num[n]); fixedW(w, 3 * 36 + 2 * v); for (let i = 0; i < 6; i++) w.appendChild(box(36, 18)); dia.appendChild(w); }
      else { const c2 = frame('stack', 'VERTICAL', 0); add(c2, box(120, 18), gap(120, v), box(120, 18)); dia.appendChild(c2); }
      add(card, dia, await text(n, 'type/label-md'), await text(`${v}px · ${ref} · ${axis}`, 'type/caption', 'color/status/info'),
        await text(between.replace(/ ↔ /g, ' to '), 'type/body-md', 'color/text/primary', { width: 352 }), await text(ex.replace(/ ↔ /g, ' to '), 'type/body-sm', 'color/text/secondary', { width: 352 }));
      if (ctx.num[n]) card.setBoundVariable('itemSpacing', ctx.num['space/200']);
      grid.appendChild(card);
    }
    const tallest = Math.max(...grid.children.map(k => k.height)); for (const k of grid.children) k.minHeight = tallest;
    bg.appendChild(grid); col.appendChild(bg);
  }
  { const bl = await board('Spacing · layout (responsive)', 'The only spacing that changes with screen size. Each value is its own variable: space/layout/page-margin/compact … /large.');
    const hdr = ['Token', 'Compact', 'Medium', 'Expanded', 'Large', 'Between'];
    const rowF = async (cells, style, color) => { const r = frame('row', 'HORIZONTAL', 16, { align: 'BASELINE' }); fixedW(r, 1184); const ws = [260, 100, 100, 100, 100, 420]; for (let i = 0; i < cells.length; i++) { const t = await text(cells[i], style, color, { width: ws[i] }); r.appendChild(t); } return r; };
    bl.appendChild(await rowF(hdr, 'type/label-sm', 'color/text/secondary'));
    for (const [n, a, b2, c2, d2, between] of DATA.spLayout) bl.appendChild(await rowF([n, a + 'px', b2 + 'px', c2 + 'px', d2 + 'px', between.replace(/ ↔ /g, ' to ')], 'type/body-md'));
    const rules = frame('rules', 'VERTICAL', 12); for (const [h, d] of DATA.spRules) rules.appendChild(await text(`${h}. ${d}`, 'type/body-md', 'color/text/secondary', { width: 1100 }));
    add(bl, await text('Rules', 'type/title-sm'), rules); col.appendChild(bl); }
  // motion
  const b5 = await board('Motion', 'Durations and easings are variables (Motion, Typography collections). Fills and chart lines animate once per first view; amounts never count up; Reduce Motion becomes a quick crossfade.');
  const rows = [['motion/duration/fast', '120ms', 'Press feedback, toggles, ticks'], ['motion/duration/base', '200ms', 'Hover, tab indicator, chips'], ['motion/duration/moderate', '280ms', 'Sheets and modals enter (exit at 70%)'], ['motion/duration/slow', '400ms', 'Gauge, budget and chart fills'], ['motion/duration/deliberate', '640ms', 'Goal reached, once'], ['motion/easing/standard', '(0.2, 0, 0, 1)', 'Most movement'], ['motion/easing/enter', '(0.05, 0.7, 0.1, 1)', 'Things arriving'], ['motion/easing/exit', '(0.3, 0, 0.8, 0.15)', 'Things leaving']];
  for (const [a, bb, c] of rows) { const r = frame(a, 'HORIZONTAL', 24, { align: 'BASELINE' }); const t1 = await text(a, 'type/label-md'); t1.resize(260, t1.height); const t2 = await text(bb, 'type/amount/sm'); t2.resize(160, t2.height); add(r, t1, t2, await text(c, 'type/body-md', 'color/text/secondary')); b5.appendChild(r); }
  col.appendChild(b5);
}

/* ---------------- 6. component helpers ---------------- */
function comp(name, dir = 'HORIZONTAL', gap = 0, o = {}) { const c = figma.createComponent(); c.name = name; al(c, dir, gap, o); c.clipsContent = false; return c; }
async function setOf(variants, name, wrapWidth = 1184) {
  const cs = figma.combineAsVariants(variants, figma.currentPage);
  cs.name = name; cs.layoutMode = 'HORIZONTAL'; cs.layoutWrap = 'WRAP'; sp(cs, 'itemSpacing', 24); sp(cs, 'counterAxisSpacing', 24);
  pad(cs, 32);
  cs.primaryAxisSizingMode = 'FIXED'; cs.counterAxisSizingMode = 'AUTO'; cs.resize(wrapWidth, cs.height); cs.counterAxisSizingMode = 'AUTO';
  cs.counterAxisAlignItems = Math.max(...cs.children.map(v => v.height)) <= 64 ? 'CENTER' : 'MIN'; // short controls line up on their centres; tall specimens top-align
  fill(cs, 'color/surface/canvas'); rad(cs, 'lg'); stroke(cs, 'color/border/subtle', 1, { dash: [4, 4] });
  const d = Object.values(DATA.comps).find(c => c.name === name || c.name.startsWith(name));
  if (d) cs.description = d.purpose + (d.a11y.length ? '\n\nAccessibility: ' + d.a11y.join(' ') : '');
  return cs;
}
function textProp(cs, label, nodeName, def) {
  const texts = cs.children.map(v => v.findOne(x => x.name === nodeName && x.type === 'TEXT')).filter(Boolean);
  if (new Set(texts.map(t => t.characters)).size > 1) { log.push(`text property skipped (variants differ): ${cs.name} / ${label}`); return null; }
  if (texts.length) def = texts[0].characters;
  const key = cs.addComponentProperty(label, 'TEXT', def);
  for (const v of cs.children) { const n = v.findOne(x => x.name === nodeName && x.type === 'TEXT'); if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { characters: key }); }
  return key;
}
function boolProp(cs, label, nodeName, def) {
  const key = cs.addComponentProperty(label, 'BOOLEAN', def);
  for (const v of cs.children) { const n = v.findOne(x => x.name === nodeName); if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { visible: key }); }
  return key;
}
function swapProp(cs, label, nodeName, defIcon) {
  const key = cs.addComponentProperty(label, 'INSTANCE_SWAP', ctx.icons[defIcon].id);
  for (const v of cs.children) { const n = v.findOne(x => x.name === nodeName && x.type === 'INSTANCE'); if (n) n.componentPropertyReferences = Object.assign({}, n.componentPropertyReferences, { mainComponent: key }); }
  return key;
}
async function compBoard(col, id, cs, extra) {
  const d = DATA.comps[id] || { name: cs.name, purpose: DATA.gaps[cs.name] || '' };
  const isGap = !DATA.comps[id];
  const b = await board(d.name + (isGap ? ' · proposed (gap)' : ''), d.purpose);
  if (extra) b.appendChild(extra);
  b.appendChild(cs);
  if (d.tokens) b.appendChild(await text('Tokens: ' + d.tokens.join(' · '), 'type/caption', 'color/text/secondary', { width: 1184 }));
  col.appendChild(b);
  return b;
}
const ON = ['color/action/on-primary'];
function spinner(color) { const e = figma.createEllipse(); e.resize(18, 18); e.fills = []; e.strokes = [paint(color)]; e.strokeWeight = 2; e.arcData = { startingAngle: 0, endingAngle: Math.PI * 1.5, innerRadius: 0.82 }; e.name = 'spinner'; return e; }

/* ---------------- 7. components · basics ---------------- */
async function buildBasics() {
  const p = await page('Components · Basics'); const col = column(p);
  // Button
  const BV = { Primary: ['color/action/primary', 'color/action/on-primary'], Tonal: ['color/action/secondary', 'color/action/on-secondary'], Outline: [null, 'color/text/primary'], Ghost: [null, 'color/action/on-secondary'], Destructive: ['color/status/danger', 'color/action/on-primary'] };
  const vs = [];
  const BTN_W = {};
  const mkBtn = async (variant, size, state) => {
    const c = comp(`Variant=${variant}, Size=${size}, State=${state}`, 'HORIZONTAL', 8, { align: 'CENTER', justify: 'CENTER' });
    const h = { Small: 36, Medium: 48, Large: 56 }[size]; c.resize(10, h); c.counterAxisSizingMode = 'FIXED'; c.primaryAxisSizingMode = 'AUTO';
    pad(c, 0, { Small: 16, Medium: 20, Large: 24 }[size]); if (size === 'Large') for (const f of ['paddingLeft', 'paddingRight']) c.setBoundVariable(f, ctx.num['space/squish/2xl/inline']); rad(c, 'md');
    let [bg, fg] = BV[variant];
    if (state === 'Disabled') { bg = 'color/surface/sunken'; fg = 'color/text/disabled'; }
    const fills = [];
    if (bg) fills.push(state === 'Hover' && variant === 'Primary' ? 'color/action/primary-hover' : state === 'Pressed' && variant === 'Primary' ? 'color/action/primary-pressed' : bg);
    if ((state === 'Hover' || state === 'Pressed') && variant !== 'Primary') fills.push(state === 'Hover' ? 'color/overlay/hover' : 'color/overlay/pressed');
    fill(c, ...fills);
    if (variant === 'Outline' && state !== 'Disabled') stroke(c, 'color/border/default');
    if (state === 'Focus') stroke(c, 'color/border/focus', 2, { align: 'OUTSIDE' });
    const ic = state === 'Loading' ? spinner(fg) : icon('plus', 18, fg); ic.name = state === 'Loading' ? 'spinner' : 'icon'; c.appendChild(ic);
    const t = await text(state === 'Loading' ? 'Saving…' : 'Add expense', size === 'Small' ? 'type/label-md' : 'type/label-lg', fg, { name: state === 'Loading' ? 'label-loading' : 'label' }); c.appendChild(t);
    // Loading keeps the default button's width so nothing shifts while saving. Measured without the optional icon (18px + 8px gap), which is hidden by default.
    if (state === 'Default') BTN_W[variant + size] = c.width - 26; else if (state === 'Loading' && BTN_W[variant + size]) c.minWidth = BTN_W[variant + size];
    return c;
  };
  for (const v of Object.keys(BV)) for (const st of ['Default', 'Hover', 'Focus', 'Pressed', 'Disabled', 'Loading']) vs.push(await mkBtn(v, 'Medium', st));
  for (const v of Object.keys(BV)) for (const s of ['Small', 'Large']) vs.push(await mkBtn(v, s, 'Default'));
  let cs = await setOf(vs, 'Button'); textProp(cs, 'Label', 'label', 'Add expense'); boolProp(cs, 'Show icon', 'icon', false);
  await compBoard(col, 'button', cs);

  // Icon button
  const ib = [];
  for (const style of ['Standard', 'Tonal', 'Toggle on']) for (const st of ['Default', 'Hover', 'Focus', 'Pressed', 'Disabled']) {
    const c = comp(`Style=${style}, State=${st}`, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(c, 48, 48);
    const bg = figma.createFrame(); bg.name = 'state-layer'; bg.resize(40, 40); rad(bg, 'full'); al(bg, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(bg, 40, 40);
    const f = [];
    if (style !== 'Standard' && st !== 'Disabled') f.push('color/action/secondary');
    if (st === 'Hover') f.push('color/overlay/hover'); if (st === 'Pressed') f.push('color/overlay/pressed');
    fill(bg, ...f); if (st === 'Focus') stroke(bg, 'color/border/focus', 2, { align: 'OUTSIDE' });
    const col2 = st === 'Disabled' ? 'color/text/disabled' : style === 'Standard' ? 'color/text/secondary' : 'color/action/on-secondary';
    const i = icon(style === 'Toggle on' ? 'eye-off' : 'eye', 24, col2); i.name = 'icon'; bg.appendChild(i); c.appendChild(bg); ib.push(c);
  }
  cs = await setOf(ib, 'Icon button'); await compBoard(col, 'icon-button', cs);

  // Text input
  const ti = [];
  for (const st of ['Default', 'Hover', 'Focus', 'Filled', 'Error', 'Disabled', 'Loading']) {
    const c = comp(`State=${st}`, 'VERTICAL', 6); fixedW(c, 300);
    const lab = await text('Merchant', 'type/label-md', st === 'Focus' ? 'color/action/on-secondary' : st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'label' });
    const box = frame('field', 'HORIZONTAL', 8, { align: 'CENTER' }); fixedH(box, 48); pad(box, 0, 16); rad(box, 'md'); fill(box, 'color/surface/sunken');
    if (st !== 'Disabled') stroke(box, st === 'Focus' ? 'color/border/focus' : st === 'Error' ? 'color/status/danger' : st === 'Hover' ? 'color/text/secondary' : 'color/border/default', st === 'Focus' || st === 'Error' ? 2 : 1);
    box.appendChild(icon('store', 20, 'color/text/secondary'));
    const val = await text(st === 'Default' ? 'Swiggy' : 'Blue Tokai', 'type/body-lg', st === 'Default' ? 'color/text/secondary' : st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'value' }); box.appendChild(val); val.layoutGrow = 1;
    if (st === 'Loading') box.appendChild(spinner('color/text/secondary'));
    add(c, lab, box); fillW(box);
    if (st === 'Error') { const e = frame('error', 'HORIZONTAL', 6, { align: 'CENTER' }); add(e, icon('circle-alert', 16, 'color/status/danger'), await text('Add a name so you can find this later', 'type/body-sm', 'color/status/danger', { name: 'helper' })); c.appendChild(e); }
    else c.appendChild(await text(st === 'Disabled' ? 'Imported from your bank' : 'As it appears on your statement', 'type/body-sm', 'color/text/secondary', { name: 'helper' }));
    ti.push(c);
  }
  cs = await setOf(ti, 'Text input'); textProp(cs, 'Label', 'label', 'Merchant'); textProp(cs, 'Value', 'value', 'Swiggy'); textProp(cs, 'Helper', 'helper', 'As it appears on your statement');
  await compBoard(col, 'text-input', cs);

  // Amount input
  const ai = [];
  for (const variant of ['Hero', 'Inline']) for (const st of ['Empty', 'Typing', 'Error', 'Locked']) {
    const c = comp(`Variant=${variant}, State=${st}`, 'VERTICAL', 8, { align: variant === 'Hero' ? 'CENTER' : 'MIN' }); fixedW(c, 300);
    const amt = st === 'Empty' ? '₹0' : st === 'Error' ? '₹0' : st === 'Locked' ? '₹22,000' : '₹1,24,500';
    if (variant === 'Hero') {
      const v = await text(amt, 'type/amount/hero', st === 'Empty' ? 'color/text/secondary' : 'color/text/primary', { name: 'amount' });
      c.appendChild(v);
      c.appendChild(await text(st === 'Error' ? 'Enter an amount above ₹0' : st === 'Locked' ? 'Matches your bank record' : 'Food and dining · ₹1,800 left', 'type/body-md', st === 'Error' ? 'color/status/danger' : 'color/text/secondary', { name: 'context' }));
    } else {
      c.appendChild(await text('Monthly limit', 'type/label-md', st === 'Locked' ? 'color/text/disabled' : 'color/text/primary'));
      const box = frame('field', 'HORIZONTAL', 8, { align: 'CENTER' }); fixedH(box, 48); pad(box, 0, 16); rad(box, 'md'); fill(box, 'color/surface/sunken');
      if (st !== 'Locked') stroke(box, st === 'Error' ? 'color/status/danger' : st === 'Typing' ? 'color/border/focus' : 'color/border/default', st === 'Error' || st === 'Typing' ? 2 : 1);
      const v = await text(amt, 'type/amount/md', st === 'Locked' ? 'color/text/disabled' : st === 'Empty' ? 'color/text/secondary' : 'color/text/primary', { name: 'amount' }); box.appendChild(v); v.layoutGrow = 1;
      if (st === 'Locked') box.appendChild(icon('lock', 18, 'color/text/disabled'));
      c.appendChild(box); fillW(box);
      c.appendChild(await text(st === 'Error' ? 'Enter an amount above ₹0' : 'Last month you spent ₹9,140', 'type/body-sm', st === 'Error' ? 'color/status/danger' : 'color/text/secondary', { name: 'context' }));
    }
    ai.push(c);
  }
  cs = await setOf(ai, 'Amount input'); textProp(cs, 'Amount', 'amount', '₹1,24,500'); textProp(cs, 'Context', 'context', 'Food and dining · ₹1,800 left');
  await compBoard(col, 'amount-input', cs);

  // Select
  const se = [];
  for (const st of ['Default', 'Open', 'Error', 'Disabled']) {
    const c = comp(`State=${st}`, 'VERTICAL', 6); fixedW(c, 300);
    c.appendChild(await text('Account', 'type/label-md', st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'label' }));
    const box = frame('field', 'HORIZONTAL', 8, { align: 'CENTER' }); fixedH(box, 48); pad(box, 0, 16); rad(box, 'md'); fill(box, 'color/surface/sunken');
    if (st !== 'Disabled') stroke(box, st === 'Open' ? 'color/border/focus' : st === 'Error' ? 'color/status/danger' : 'color/border/default', st === 'Default' ? 1 : 2);
    const v = await text(st === 'Error' ? 'Choose an account' : 'HDFC Savings ••4821', 'type/body-lg', st === 'Error' ? 'color/text/secondary' : st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'value' }); box.appendChild(v); v.layoutGrow = 1;
    box.appendChild(icon(st === 'Open' ? 'chevron-up' : 'chevron-down', 20, 'color/text/secondary'));
    c.appendChild(box); fillW(box);
    if (st === 'Open') {
      const m = frame('menu', 'VERTICAL', 0); fill(m, 'color/surface/raised'); rad(m, 'md'); stroke(m, 'color/border/subtle'); await fx(m, 'elevation/2'); pad(m, 4, 0);
      for (const [o, sel] of [['HDFC Savings ••4821', true], ['ICICI Salary ••0937', false], ['Cash', false], ['Add an account', false]]) { const r = frame(o, 'HORIZONTAL', 8, { align: 'CENTER' }); fixedH(r, 44); pad(r, 0, 16); add(r, await text(o, sel ? 'type/label-lg' : 'type/body-lg')); if (sel) { const sp3 = figma.createFrame(); sp3.fills = []; sp3.resize(1, 1); r.appendChild(sp3); sp3.layoutGrow = 1; r.appendChild(icon('check', 18, 'color/action/primary')); } m.appendChild(r); fillW(r); }
      c.appendChild(m); fillW(m);
    }
    if (st === 'Error') c.appendChild(await text('Choose where this money came from', 'type/body-sm', 'color/status/danger'));
    se.push(c);
  }
  cs = await setOf(se, 'Dropdown / select'); await compBoard(col, 'select', cs);

  // Checkbox, Radio, Toggle
  const box20 = (r) => { const b = figma.createFrame(); b.resize(20, 20); rad(b, r); b.name = 'control'; return b; };
  const cb = [];
  for (const val of ['Off', 'On', 'Mixed']) for (const st of ['Default', 'Disabled', 'Error']) {
    if (val !== 'Off' && st === 'Error') continue;
    const c = comp(`Value=${val}, State=${st}`, 'HORIZONTAL', 12, { align: 'CENTER' }); fixedH(c, 48);
    const b = box20('xs'); al(b, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(b, 20, 20);
    if (val === 'Off') { fill(b, st === 'Disabled' ? 'color/surface/sunken' : 'color/surface/default'); stroke(b, st === 'Error' ? 'color/status/danger' : st === 'Disabled' ? 'color/text/disabled' : 'color/border/default', 2); }
    else { fill(b, st === 'Disabled' ? 'color/text/disabled' : 'color/action/primary'); b.appendChild(val === 'On' ? icon('check', 16, 'color/action/on-primary') : Object.assign(rect(10, 2, 'color/action/on-primary', 'xs'), { name: 'dash' })); }
    add(c, b, await text('Food and dining', 'type/body-lg', st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'label' })); cb.push(c);
  }
  cs = await setOf(cb, 'Checkbox'); for (const vv of cs.children) if (vv.itemSpacing === 12) vv.setBoundVariable('itemSpacing', ctx.num['space/icon/control-to-label']); textProp(cs, 'Label', 'label', 'Food and dining'); await compBoard(col, 'checkbox', cs);
  const ra = [];
  for (const val of ['Off', 'On']) for (const st of ['Default', 'Disabled']) {
    const c = comp(`Selected=${val}, State=${st}`, 'HORIZONTAL', 12, { align: 'CENTER' }); fixedH(c, 48);
    const b = box20('full'); al(b, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(b, 20, 20); fill(b, 'color/surface/default');
    stroke(b, st === 'Disabled' ? 'color/text/disabled' : val === 'On' ? 'color/action/primary' : 'color/border/default', 2);
    if (val === 'On') b.appendChild(ellipse(10, st === 'Disabled' ? 'color/text/disabled' : 'color/action/primary'));
    add(c, b, await text('Round to the rupee', 'type/body-lg', st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'label' })); ra.push(c);
  }
  cs = await setOf(ra, 'Radio'); for (const vv of cs.children) if (vv.itemSpacing === 12) vv.setBoundVariable('itemSpacing', ctx.num['space/icon/control-to-label']); textProp(cs, 'Label', 'label', 'Round to the rupee'); await compBoard(col, 'radio', cs);
  const tg = [];
  for (const val of ['Off', 'On']) for (const st of ['Default', 'Disabled']) {
    const c = comp(`On=${val}, State=${st}`, 'HORIZONTAL', 24, { align: 'CENTER' }); fixed(c, 300, 48); c.primaryAxisAlignItems = 'SPACE_BETWEEN';
    const lab = await text('Budget alerts', 'type/body-lg', st === 'Disabled' ? 'color/text/disabled' : 'color/text/primary', { name: 'label' });
    const tr = figma.createFrame(); tr.name = 'track'; tr.resize(52, 32); rad(tr, 'full'); tr.layoutMode = 'HORIZONTAL'; tr.primaryAxisSizingMode = 'FIXED'; tr.counterAxisSizingMode = 'FIXED'; tr.counterAxisAlignItems = 'CENTER'; tr.primaryAxisAlignItems = val === 'On' ? 'MAX' : 'MIN'; sp(tr, 'paddingLeft', 4, 'inset'); sp(tr, 'paddingRight', 4, 'inset');
    if (val === 'On') { fill(tr, st === 'Disabled' ? 'color/text/disabled' : 'color/action/primary'); const th = ellipse(24, 'color/action/on-primary'); th.name = 'thumb'; tr.appendChild(th); }
    else { fill(tr, 'color/surface/sunken'); stroke(tr, st === 'Disabled' ? 'color/text/disabled' : 'color/border/default', 2); const th = ellipse(20, st === 'Disabled' ? 'color/text/disabled' : 'color/text/secondary'); th.name = 'thumb'; tr.appendChild(th); }
    add(c, lab, tr); tg.push(c);
  }
  cs = await setOf(tg, 'Toggle'); for (const vv of cs.children) if (vv.itemSpacing === 12) vv.setBoundVariable('itemSpacing', ctx.num['space/icon/control-to-label']); textProp(cs, 'Label', 'label', 'Budget alerts'); await compBoard(col, 'toggle', cs);

  // Segmented control, Tabs
  const sg = [];
  for (const selIdx of [0, 1, 2]) {
    const c = comp(`Selected=${['Week', 'Month', 'Year'][selIdx]}`, 'HORIZONTAL', 0); fill(c, 'color/surface/sunken'); rad(c, 'md'); pad(c, 4);
    for (const [i, l] of ['Week', 'Month', 'Year'].entries()) { const s = frame(l, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(s, 96, 34); rad(s, 'sm'); if (i === selIdx) { fill(s, 'color/surface/raised'); await fx(s, 'elevation/1'); } s.appendChild(await text(l, 'type/label-md', i === selIdx ? 'color/text/primary' : 'color/text/secondary')); c.appendChild(s); }
    sg.push(c);
  }
  cs = await setOf(sg, 'Segmented control'); await compBoard(col, 'segmented', cs);
  const tb = [];
  for (const selIdx of [0, 1, 2]) {
    const c = comp(`Selected=${['Overview', 'Transactions', 'History'][selIdx]}`, 'HORIZONTAL', 0); stroke(c, 'color/border/subtle'); c.strokeTopWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeBottomWeight = 1;
    for (const [i, l] of ['Overview', 'Transactions', 'History'].entries()) { const s = frame(l, 'VERTICAL', 0, { align: 'CENTER', justify: 'MAX' }); fixed(s, 130, 48); const tx = await text(l, 'type/label-lg', i === selIdx ? 'color/text/primary' : 'color/text/secondary'); s.appendChild(tx); const ind = rect(98, 3, i === selIdx ? 'color/action/primary' : null, 'xs'); ind.name = 'indicator'; sp(s, 'itemSpacing', 12); s.appendChild(ind); c.appendChild(s); s.layoutGrow = 1; }
    c.primaryAxisSizingMode = 'FIXED'; c.resize(390, c.height);
    tb.push(c);
  }
  cs = await setOf(tb, 'Tabs'); await compBoard(col, 'tabs', cs);

  // Chips and tags
  const ch = [];
  for (const [type, sel] of [['Filter', 'false'], ['Filter', 'true'], ['Choice', 'false'], ['Choice', 'true'], ['Input', 'false'], ['Tag', 'false']]) {
    const c = comp(`Type=${type}, Selected=${sel}`, 'HORIZONTAL', 6, { align: 'CENTER' });
    if (type === 'Tag') { fixedH(c, 24); pad(c, 0, 8); rad(c, 'sm'); fill(c, 'color/surface/sunken'); c.appendChild(icon('repeat', 12, 'color/text/secondary')); c.appendChild(await text('Recurring', 'type/label-sm', 'color/text/secondary', { name: 'label' })); }
    else {
      fixedH(c, 32); pad(c, 0, 12); rad(c, 'full');
      if (sel === 'true') fill(c, 'color/action/secondary'); else { fill(c, 'color/surface/default'); stroke(c, 'color/border/subtle'); }
      if (sel === 'true') c.appendChild(icon('check', 16, 'color/action/on-secondary'));
      else if (type === 'Filter') c.appendChild(ellipse(8, 'color/chart/1'));
      c.appendChild(await text(type === 'Choice' ? '₹500' : type === 'Input' ? 'Travel' : 'Food', 'type/label-md', sel === 'true' ? 'color/action/on-secondary' : 'color/text/primary', { name: 'label' }));
      if (type === 'Input') c.appendChild(icon('x', 14, 'color/text/secondary'));
    }
    ch.push(c);
  }
  cs = await setOf(ch, 'Chips and tags'); textProp(cs, 'Label', 'label', 'Food'); await compBoard(col, 'chip', cs);

  // Avatar
  const av = [];
  for (const type of ['Initials', 'Merchant']) for (const [s, d] of [['Small', 32], ['Medium', 40], ['Large', 56]]) {
    const c = comp(`Type=${type}, Size=${s}`, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(c, d, d); rad(c, type === 'Initials' ? 'full' : 'md');
    if (type === 'Initials') { fill(c, 'color/action/secondary'); c.appendChild(await text('IR', d > 40 ? 'type/title-sm' : d > 32 ? 'type/label-md' : 'type/label-sm', 'color/action/on-secondary', { name: 'initials' })); }
    else { fill(c, 'color/surface/sunken'); c.appendChild(icon('coffee', Math.round(d * 0.5), 'color/text/primary')); }
    av.push(c);
  }
  cs = await setOf(av, 'Avatar'); await compBoard(col, 'avatar', cs);

  // Badge
  const bd = [];
  for (const [type, bg, fg, ic, label] of [['Dot', 'color/status/danger', null, null, null], ['Count', 'color/status/danger', 'color/action/on-primary', null, '3'], ['Over', 'color/status/danger-bg', 'color/finance/over-budget', 'chevrons-up', 'Over'], ['Close', 'color/status/warning-bg', 'color/finance/near-limit', 'triangle-alert', 'Close'], ['Paid', 'color/status/success-bg', 'color/status/success', 'check', 'Paid']]) {
    const c = comp(`Type=${type}`, 'HORIZONTAL', 4, { align: 'CENTER', justify: 'CENTER' }); rad(c, 'full'); fill(c, bg);
    if (type === 'Dot') fixed(c, 8, 8); else { fixedH(c, 20); pad(c, 0, 6); if (ic) c.appendChild(icon(ic, 12, fg)); c.appendChild(await text(label, 'type/label-sm', fg, { name: 'label' })); }
    bd.push(c);
  }
  cs = await setOf(bd, 'Badge'); await compBoard(col, 'badge', cs);

  // Tooltip
  const tt = [];
  for (const type of ['Plain', 'Rich']) {
    const c = comp(`Type=${type}`, 'VERTICAL', 2); fill(c, 'color/surface/inverse'); rad(c, 'sm'); pad(c, 8, 12); await fx(c, 'elevation/2');
    if (type === 'Plain') c.appendChild(await text('Hide balances', 'type/body-sm', 'color/text/inverse', { name: 'label' }));
    else add(c, await text('September', 'type/body-sm', 'color/text/inverse'), await text('₹57,400 · ₹5,400 over', 'type/amount/sm', 'color/text/inverse', { name: 'label' }));
    tt.push(c);
  }
  cs = await setOf(tt, 'Tooltip'); await compBoard(col, 'tooltip', cs);
}

/* ---------------- 8. containers and feedback ---------------- */
async function txRow(iconName, title, sub, amount, amtColor = 'color/finance/expense', tagText, tagIcon, tagColor) {
  const r = frame('row', 'HORIZONTAL', 12, { align: 'CENTER' }); fixedH(r, 72); pad(r, 8, 16);
  const tile = frame('tile', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(tile, 40, 40); rad(tile, 'md'); fill(tile, 'color/surface/sunken'); tile.appendChild(icon(iconName, 20));
  const mid = frame('text', 'VERTICAL', 2); add(mid, await text(title, 'type/label-lg', 'color/text/primary', { name: 'title' }), await text(sub, 'type/body-sm', 'color/text/secondary', { name: 'subtitle' }));
  const right = frame('trailing', 'VERTICAL', 4, { align: 'MAX' }); right.appendChild(await text(amount, 'type/amount/md', amtColor, { name: 'amount', align: 'RIGHT' }));
  if (tagText) { const tg = frame('tag', 'HORIZONTAL', 4, { align: 'CENTER' }); fixedH(tg, 24); pad(tg, 0, 8); rad(tg, 'sm'); fill(tg, 'color/surface/sunken'); add(tg, icon(tagIcon, 12, tagColor || 'color/text/secondary'), await text(tagText, 'type/label-sm', tagColor || 'color/text/secondary')); right.appendChild(tg); }
  add(r, tile, mid, right); mid.layoutGrow = 1;
  return r;
}
async function buildContainers() {
  const p = await page('Components · Containers and feedback'); const col = column(p);
  // Card
  const cd = [];
  for (const type of ['Static', 'Interactive', 'Outlined']) {
    const c = comp(`Type=${type}`, 'VERTICAL', 12); fixedW(c, 320); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised');
    if (type === 'Outlined') stroke(c, 'color/border/subtle'); else await fx(c, type === 'Interactive' ? 'elevation/2' : 'elevation/1');
    const h = frame('header', 'HORIZONTAL', 8, { align: 'CENTER' }); const t = await text(type === 'Interactive' ? 'Budgets' : 'This week', 'type/title-sm', 'color/text/primary', { name: 'title' }); h.appendChild(t); t.layoutGrow = 1; if (type === 'Interactive') h.appendChild(icon('chevron-right', 20, 'color/text/secondary'));
    c.appendChild(h); fillW(h);
    c.appendChild(await text('You spent ₹2,100 less on food than last week.', 'type/body-md', 'color/text/secondary', { width: 280, name: 'body' }));
    cd.push(c);
  }
  let cs = await setOf(cd, 'Card'); textProp(cs, 'Title', 'title', 'This week'); textProp(cs, 'Body', 'body', 'You spent ₹2,100 less on food than last week.'); await compBoard(col, 'card', cs);
  // List item
  const li = [];
  for (const lines of ['One', 'Two']) for (const trail of ['Chevron', 'Toggle', 'Value']) {
    const c = comp(`Lines=${lines}, Trailing=${trail}`, 'HORIZONTAL', 12, { align: 'CENTER' }); fixed(c, 360, lines === 'One' ? 56 : 72); pad(c, 8, 16); fill(c, 'color/surface/default');
    const tile = frame('leading', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(tile, 40, 40); rad(tile, 'md'); fill(tile, 'color/surface/sunken'); tile.appendChild(icon('landmark', 20));
    const mid = frame('text', 'VERTICAL', 2); mid.appendChild(await text('HDFC Savings', 'type/label-lg', 'color/text/primary', { name: 'title' })); if (lines === 'Two') mid.appendChild(await text('••4821 · synced 5 min ago', 'type/body-sm', 'color/text/secondary', { name: 'subtitle' }));
    add(c, tile, mid); mid.layoutGrow = 1;
    if (trail === 'Chevron') c.appendChild(icon('chevron-right', 20, 'color/text/secondary'));
    if (trail === 'Value') c.appendChild(await text('₹1,24,500', 'type/amount/md'));
    if (trail === 'Toggle') { const tr = figma.createFrame(); tr.resize(52, 32); rad(tr, 'full'); fill(tr, 'color/action/primary'); tr.layoutMode = 'HORIZONTAL'; tr.primaryAxisSizingMode = 'FIXED'; tr.counterAxisSizingMode = 'FIXED'; tr.primaryAxisAlignItems = 'MAX'; tr.counterAxisAlignItems = 'CENTER'; sp(tr, 'paddingRight', 4, 'inset'); tr.appendChild(ellipse(24, 'color/action/on-primary')); c.appendChild(tr); }
    li.push(c);
  }
  cs = await setOf(li, 'List item'); textProp(cs, 'Title', 'title', 'HDFC Savings'); await compBoard(col, 'list-item', cs);
  // Bottom sheet
  {
    const c = comp('Type=Add expense', 'VERTICAL', 12, { align: 'CENTER' }); fixedW(c, 390); pad(c, 8, 24, 24); fill(c, 'color/surface/raised'); c.topLeftRadius = 24; c.topRightRadius = 24; ['topLeftRadius', 'topRightRadius'].forEach(k => c.setBoundVariable(k, ctx.num['radius/xl'])); await fx(c, 'elevation/3');
    c.appendChild(rect(32, 4, 'color/border/default', 'xs'));
    const h = frame('header', 'HORIZONTAL', 8, { align: 'CENTER' }); const t = await text('Add expense', 'type/title-md', 'color/text/primary', { name: 'title' }); h.appendChild(t); t.layoutGrow = 1; h.appendChild(icon('x', 24, 'color/text/primary')); c.appendChild(h); fillW(h);
    add(c, await text('₹386', 'type/amount/hero'), await text('₹1,414 left in Food after this', 'type/body-md'));
    const ft = frame('footer', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixedH(ft, 56); rad(ft, 'md'); fill(ft, 'color/action/primary'); ft.appendChild(await text('Add ₹386 expense', 'type/label-lg', 'color/action/on-primary')); c.appendChild(ft); fillW(ft);
    cs = await setOf([c], 'Bottom sheet', 520); textProp(cs, 'Title', 'title', 'Add expense'); await compBoard(col, 'bottom-sheet', cs);
  }
  // Modal
  const md = [];
  for (const type of ['Confirm', 'Destructive']) {
    const c = comp(`Type=${type}`, 'VERTICAL', 12); fixedW(c, 360); pad(c, 24); rad(c, 'xl'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/3');
    if (type === 'Destructive') { const ic = frame('icon', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(ic, 48, 48); rad(ic, 'full'); fill(ic, 'color/status/danger-bg'); ic.appendChild(icon('trash-2', 24, 'color/status/danger')); c.appendChild(ic); }
    add(c, await text(type === 'Destructive' ? 'Delete the Goa trip goal?' : 'Discard this expense?', 'type/title-md', 'color/text/primary', { width: 320, name: 'title' }), await text(type === 'Destructive' ? 'Your ₹38,000 stays in your account. Only the goal and its history are deleted. This can’t be undone.' : '₹386 at Swiggy won’t be saved.', 'type/body-md', 'color/text/secondary', { width: 320, name: 'body' }));
    const acts = frame('actions', 'VERTICAL', 8);
    for (const [l, prim] of [[type === 'Destructive' ? 'Delete goal' : 'Discard', true], [type === 'Destructive' ? 'Keep goal' : 'Keep editing', false]]) { const b = frame(l, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixedH(b, 48); rad(b, 'md'); if (prim) fill(b, type === 'Destructive' ? 'color/status/danger' : 'color/action/primary'); else stroke(b, 'color/border/default'); b.appendChild(await text(l, 'type/label-lg', prim ? 'color/action/on-primary' : 'color/text/primary')); acts.appendChild(b); fillW(b); }
    c.appendChild(acts); fillW(acts); md.push(c);
  }
  cs = await setOf(md, 'Modal dialog'); textProp(cs, 'Title', 'title', 'Delete the Goa trip goal?'); await compBoard(col, 'modal', cs);
  // Snackbar
  const sn = [];
  for (const type of ['Info', 'Action', 'Error']) {
    const c = comp(`Type=${type}`, 'HORIZONTAL', 12, { align: 'CENTER' }); fixed(c, 360, 48); pad(c, 0, 8, 0, 16); rad(c, 'md'); fill(c, 'color/surface/inverse'); await fx(c, 'elevation/2');
    if (type === 'Error') c.appendChild(icon('cloud-off', 20, 'color/text/inverse'));
    const t = await text(type === 'Info' ? 'Expense added' : type === 'Action' ? 'Transaction deleted' : 'Couldn’t sync', 'type/body-md', 'color/text/inverse', { name: 'message' }); c.appendChild(t); t.layoutGrow = 1;
    if (type !== 'Info') { const a = frame('action', 'HORIZONTAL', 0, { align: 'CENTER' }); fixedH(a, 40); pad(a, 0, 12); a.appendChild(await text(type === 'Action' ? 'Undo' : 'Retry', 'type/label-lg', 'color/action/on-inverse', { name: 'action-label' })); c.appendChild(a); }
    sn.push(c);
  }
  cs = await setOf(sn, 'Toast / snackbar'); textProp(cs, 'Message', 'message', 'Expense added'); await compBoard(col, 'snackbar', cs);
  // Inline alert
  const ia = [];
  for (const [type, k, ic, title, body] of [['Info', 'info', 'info', 'Salary usually lands on the 1st', 'Your month resets then.'], ['Success', 'success', 'circle-check', 'Bank connected', '142 transactions imported.'], ['Warning', 'warning', 'triangle-alert', 'Food is close to its limit', '₹1,800 left for 13 days, about ₹138 a day.'], ['Danger', 'danger', 'circle-alert', 'Couldn’t save this expense', 'It’s kept on your phone and will retry when you’re online.']]) {
    const c = comp(`Type=${type}`, 'HORIZONTAL', 12); fixedW(c, 360); pad(c, 12, 16); rad(c, 'md'); fill(c, `color/status/${k}-bg`);
    const tx = frame('text', 'VERTICAL', 2); add(tx, await text(title, 'type/label-lg', 'color/text/primary', { name: 'title' }), await text(body, 'type/body-md', 'color/text/primary', { width: 292, name: 'body' }));
    add(c, icon(ic, 20, `color/status/${k}`), tx); ia.push(c);
  }
  cs = await setOf(ia, 'Inline alert'); for (const vv of cs.children) if (vv.itemSpacing === 12) vv.setBoundVariable('itemSpacing', ctx.num['space/icon/control-to-label']); textProp(cs, 'Title', 'title', 'Food is close to its limit'); textProp(cs, 'Body', 'body', '₹1,800 left for 13 days.'); await compBoard(col, 'inline-alert', cs);
  // Banner
  const bn = [];
  for (const type of ['Neutral', 'Warning']) {
    const c = comp(`Type=${type}`, 'HORIZONTAL', 12, { align: 'CENTER' }); fixedW(c, 720); pad(c, 12, 16); fill(c, type === 'Neutral' ? 'color/surface/sunken' : 'color/status/warning-bg');
    c.appendChild(icon(type === 'Neutral' ? 'wifi-off' : 'link-2-off', 20, type === 'Neutral' ? 'color/text/primary' : 'color/status/warning'));
    const t = await text(type === 'Neutral' ? 'You’re offline. Changes will sync when you’re back.' : 'HDFC connection expired. New transactions aren’t coming in.', 'type/body-md', 'color/text/primary', { name: 'message' }); c.appendChild(t); t.layoutGrow = 1;
    if (type === 'Warning') { const b = frame('action', 'HORIZONTAL', 0, { align: 'CENTER' }); fixedH(b, 36); pad(b, 0, 16); rad(b, 'md'); fill(b, 'color/action/secondary'); b.appendChild(await text('Reconnect', 'type/label-md', 'color/action/on-secondary')); c.appendChild(b); }
    bn.push(c);
  }
  cs = await setOf(bn, 'Banner'); for (const vv of cs.children) if (vv.itemSpacing === 12) vv.setBoundVariable('itemSpacing', ctx.num['space/icon/control-to-label']); await compBoard(col, 'banner', cs);
  // Skeleton
  const sk = [];
  for (const type of ['Row', 'Line', 'Gauge']) {
    const c = comp(`Type=${type}`, type === 'Row' ? 'HORIZONTAL' : 'VERTICAL', 12, { align: type === 'Row' ? 'CENTER' : 'MIN' });
    if (type === 'Row') { fixed(c, 360, 72); pad(c, 0, 16); add(c, rect(40, 40, 'color/surface/sunken', 'md')); const m = frame('lines', 'VERTICAL', 8); add(m, rect(180, 14, 'color/surface/sunken', 'xs'), rect(120, 12, 'color/surface/sunken', 'xs')); c.appendChild(m); m.layoutGrow = 1; c.appendChild(rect(56, 16, 'color/surface/sunken', 'xs')); }
    if (type === 'Line') add(c, rect(280, 14, 'color/surface/sunken', 'xs'), rect(220, 14, 'color/surface/sunken', 'xs'), rect(160, 14, 'color/surface/sunken', 'xs'));
    if (type === 'Gauge') { pad(c, 16); fill(c, 'color/surface/raised'); rad(c, 'lg'); const g = figma.createFrame(); g.resize(268, 200); fill(g, 'color/surface/sunken'); rad(g, 'lg'); const l = dash(268); l.y = 32; g.appendChild(l); add(c, rect(140, 16, 'color/surface/sunken', 'xs'), g); }
    sk.push(c);
  }
  cs = await setOf(sk, 'Skeleton loader'); await compBoard(col, 'skeleton', cs);
  // Empty state
  const es = [];
  for (const [type, ic, h, b, btn, tone] of [['First use', 'receipt', 'Add your first expense', 'Track one thing you bought today. It takes about five seconds.', 'Add expense', 'brand'], ['No results', 'search-x', 'No transactions match', 'Try a different category or a longer date range.', 'Clear filters', 'tonal'], ['Cleared', 'calendar-check', 'No bills due this week', 'Next up: rent on 1 Nov.', null, 'success']]) {
    const c = comp(`Type=${type}`, 'VERTICAL', 12, { align: 'CENTER' }); fixedW(c, 340); pad(c, 40, 20); rad(c, 'lg'); fill(c, 'color/surface/default'); stroke(c, 'color/border/subtle');
    const big = frame('icon', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(big, 64, 64); rad(big, 'lg'); fill(big, tone === 'success' ? 'color/status/success-bg' : 'color/finance/headroom'); big.appendChild(icon(ic, 32, tone === 'success' ? 'color/status/success' : 'color/action/on-secondary'));
    add(c, big, await text(h, 'type/title-md', 'color/text/primary', { align: 'CENTER', name: 'title' }), await text(b, 'type/body-md', 'color/text/secondary', { width: 280, align: 'CENTER', name: 'body' }));
    if (btn) { const bb = frame('button', 'HORIZONTAL', 0, { align: 'CENTER' }); fixedH(bb, 48); pad(bb, 0, 20); rad(bb, 'md'); fill(bb, tone === 'brand' ? 'color/action/primary' : 'color/action/secondary'); bb.appendChild(await text(btn, 'type/label-lg', tone === 'brand' ? 'color/action/on-primary' : 'color/action/on-secondary')); c.appendChild(bb); }
    es.push(c);
  }
  cs = await setOf(es, 'Empty state'); textProp(cs, 'Title', 'title', 'Add your first expense'); await compBoard(col, 'empty-state', cs);
}

/* ---------------- 9. navigation ---------------- */
async function buildNavigation() {
  const p = await page('Components · Navigation'); const col = column(p);
  const items = [['house', 'Home'], ['arrow-left-right', 'Activity'], ['gauge', 'Budgets'], ['target', 'Goals']];
  const nv = [];
  for (const [, active] of items) {
    const c = comp(`Active=${active}`, 'HORIZONTAL', 0, { justify: 'SPACE_BETWEEN' }); fixed(c, 390, 80); pad(c, 8, 16, 16); fill(c, 'color/surface/default'); stroke(c, 'color/border/subtle'); c.strokeBottomWeight = 0; c.strokeLeftWeight = 0; c.strokeRightWeight = 0; c.strokeTopWeight = 1; c.primaryAxisAlignItems = 'SPACE_BETWEEN';
    for (const [ic, n] of items) { const on = n === active; const it = frame(n, 'VERTICAL', 4, { align: 'CENTER' }); fixedW(it, 72); const pill = frame('indicator', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(pill, 56, 32); rad(pill, 'full'); if (on) fill(pill, 'color/action/secondary'); pill.appendChild(icon(ic, 24, on ? 'color/action/on-secondary' : 'color/text/secondary')); add(it, pill, await text(n, 'type/label-sm', on ? 'color/text/primary' : 'color/text/secondary')); c.appendChild(it); }
    nv.push(c);
  }
  let cs = await setOf(nv, 'Bottom nav bar'); await compBoard(col, 'bottom-nav', cs);
  const ab = [];
  for (const type of ['Large', 'Compact', 'Contextual']) {
    const c = comp(`Type=${type}`, 'VERTICAL', 0); fixedW(c, 390); fill(c, type === 'Contextual' ? 'color/action/secondary' : 'color/surface/canvas');
    const row = frame('row', 'HORIZONTAL', 0, { align: 'CENTER' }); fixedH(row, 56); pad(row, 0, 4);
    const fg = type === 'Contextual' ? 'color/action/on-secondary' : 'color/text/primary';
    const ibtn = n => { const b = frame(n, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(b, 48, 48); b.appendChild(icon(n, 24, fg)); return b; };
    if (type !== 'Large') row.appendChild(ibtn(type === 'Contextual' ? 'x' : 'chevron-left'));
    const t = await text(type === 'Large' ? '' : type === 'Compact' ? 'Food and dining' : '3 selected', 'type/title-sm', fg, { name: 'title' }); row.appendChild(t); t.layoutGrow = 1;
    for (const n of type === 'Large' ? ['eye', 'ellipsis-vertical'] : type === 'Compact' ? ['pencil'] : ['tag', 'trash-2']) row.appendChild(ibtn(n));
    c.appendChild(row); fillW(row);
    if (type === 'Large') { const big = await text('Budgets', 'type/title-lg', 'color/text/primary', { name: 'large-title' }); const w = frame('large', 'HORIZONTAL', 0); pad(w, 4, 16, 12); w.appendChild(big); c.appendChild(w); }
    ab.push(c);
  }
  cs = await setOf(ab, 'Top app bar'); await compBoard(col, 'app-bar', cs);
  const bc = [];
  for (const type of ['Back', 'Close']) { const c = comp(`Type=${type}`, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(c, 48, 48); c.appendChild(icon(type === 'Back' ? 'chevron-left' : 'x', 24)); bc.push(c); }
  cs = await setOf(bc, 'Back and close patterns'); await compBoard(col, 'back-close', cs);
  const sr = [];
  for (const st of ['Empty', 'Focus', 'Filled']) {
    const c = comp(`State=${st}`, 'HORIZONTAL', 8, { align: 'CENTER' }); fixed(c, 360, 48); pad(c, 0, 8, 0, 16); rad(c, 'full'); fill(c, 'color/surface/sunken'); if (st === 'Focus') stroke(c, 'color/border/focus', 2);
    c.appendChild(icon('search', 20, 'color/text/secondary'));
    const t = await text(st === 'Filled' ? 'swiggy' : 'Search merchants, notes, amounts', 'type/body-lg', st === 'Filled' ? 'color/text/primary' : 'color/text/secondary', { name: 'query' }); c.appendChild(t); t.layoutGrow = 1;
    if (st === 'Filled') c.appendChild(icon('circle-x', 20, 'color/text/secondary'));
    sr.push(c);
  }
  cs = await setOf(sr, 'Search'); await compBoard(col, 'search', cs);
}

/* ---------------- 10. finance ---------------- */
async function buildFinance() {
  const p = await page('Components · Finance'); const col = column(p);
  // Balance card
  const bc = [];
  for (const [st, pct] of [['On track', 33550 / 52000], ['Near limit', 0.88], ['Over limit', 1.09], ['Hidden', 33550 / 52000], ['Empty', 0], ['Loading', 0]]) {
    const c = comp(`State=${st}`, 'VERTICAL', 12); fixedW(c, 340); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/1');
    const top = frame('header', 'HORIZONTAL', 8, { align: 'CENTER' }); const tt = await text('October · 13 days left', 'type/label-lg'); top.appendChild(tt); tt.layoutGrow = 1; if (st !== 'Empty' && st !== 'Loading') top.appendChild(icon(st === 'Hidden' ? 'eye-off' : 'eye', 22, 'color/text/secondary')); c.appendChild(top); fillW(top);
    if (st === 'Loading') { const g = figma.createFrame(); g.resize(308, 320); fill(g, 'color/surface/sunken'); rad(g, 'lg'); const l = dash(308); l.y = 51; g.appendChild(l); c.appendChild(g); c.appendChild(rect(180, 14, 'color/surface/sunken', 'xs')); }
    else if (st === 'Empty') { const g = await gaugeNode(308, 320, 0, { labels: false }); const t = await text('Set a monthly limit to see your headroom', 'type/body-lg', 'color/text/primary', { width: 260 }); t.x = 20; t.y = 70; g.appendChild(t); c.appendChild(g); const b = frame('button', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixedH(b, 48); rad(b, 'md'); fill(b, 'color/action/primary'); b.appendChild(await text('Set a limit', 'type/label-lg', 'color/action/on-primary')); c.appendChild(b); fillW(b); }
    else {
      const g = await gaugeNode(308, 320, pct);
      if (st === 'Hidden') for (const t of g.findAll(n => n.type === 'TEXT' && /₹/.test(n.characters))) t.characters = t.characters.replace(/[\d,]+/, '•••••');
      c.appendChild(g);
      const s = pct > 1 ? ['chevrons-up', '₹4,680 over · other budgets still have room', 'color/finance/over-budget'] : pct >= .8 ? ['triangle-alert', 'Close to limit · about ₹480 a day', 'color/finance/near-limit'] : ['circle-check', 'On track · about ₹1,419 a day', 'color/status/success'];
      const sl = frame('status', 'HORIZONTAL', 8, { align: 'CENTER' }); add(sl, icon(s[0], 18, s[2]), await text(s[1], 'type/label-md', s[2])); c.appendChild(sl);
    }
    bc.push(c);
  }
  for (const c of bc) for (const k of c.children) if (k.type === 'FRAME' && k.layoutMode === 'NONE') k.layoutSizingHorizontal = 'FILL';
  let cs = await setOf(bc, 'Balance card (clearance gauge)'); await compBoard(col, 'balance-card', cs);
  // Transaction row
  const tr = [];
  for (const [type, ic, t, s, a, col2, tg, ti, tc] of [['Expense', 'utensils', 'Swiggy', 'Food and dining · 1:42 pm', '−₹386'], ['Income', 'briefcase', 'Acme Ltd', 'Salary · Received', '+₹84,500', 'color/finance/income'], ['Saved', 'piggy-bank', 'Goa trip', 'Moved to goal', '₹5,000', 'color/finance/savings', 'Saved', 'target'], ['Pending', 'shopping-bag', 'Myntra', 'Shopping · 8:10 pm', '−₹1,899', 'color/text/secondary', 'Pending', 'clock'], ['Refund', 'rotate-ccw', 'Amazon', 'Refund · Shopping', '+₹499', 'color/finance/income', 'Refund', 'rotate-ccw'], ['Not synced', 'coffee', 'Blue Tokai', 'Food and dining · 9:05 am', '−₹280', 'color/finance/expense', 'Not synced', 'cloud-off', 'color/status/danger']]) {
    const c = comp(`Type=${type}`, 'HORIZONTAL', 0); fixedW(c, 390); fill(c, 'color/surface/default');
    const r = await txRow(ic, t, s, a, col2, tg, ti, tc); c.appendChild(r); fillW(r); tr.push(c);
  }
  cs = await setOf(tr, 'Transaction row'); textProp(cs, 'Merchant', 'title', 'Swiggy'); textProp(cs, 'Subtitle', 'subtitle', 'Food and dining · 1:42 pm'); textProp(cs, 'Amount', 'amount', '−₹386'); await compBoard(col, 'transaction-row', cs);
  // Category tile + picker
  const ct = [];
  for (const sel of ['false', 'true']) {
    const c = comp(`Selected=${sel}`, 'VERTICAL', 6, { align: 'CENTER' }); fixed(c, 80, 80); c.primaryAxisAlignItems = 'CENTER'; rad(c, 'md'); if (sel === 'true') { fill(c, 'color/action/secondary'); stroke(c, 'color/action/primary', 2); }
    const tile = frame('tile', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(tile, 40, 40); rad(tile, 'md'); fill(tile, 'color/surface/sunken'); const ic = icon('utensils', 20); ic.name = 'icon'; tile.appendChild(ic);
    add(c, tile, await text('Food', 'type/label-sm', 'color/text/primary', { name: 'label' })); ct.push(c);
  }
  cs = await setOf(ct, 'Category tile', 420); textProp(cs, 'Category', 'label', 'Food'); swapProp(cs, 'Icon', 'icon', 'utensils');
  const picker = frame('Category picker (composed from tiles)', 'HORIZONTAL', 8); picker.layoutWrap = 'WRAP'; sp(picker, 'counterAxisSpacing', 8); fixedW(picker, 352);
  const def = cs.children.find(v => v.name === 'Selected=false'), on = cs.children.find(v => v.name === 'Selected=true');
  const cats = [['utensils', 'Food'], ['shopping-basket', 'Groceries'], ['bus', 'Transport'], ['shopping-bag', 'Shopping'], ['house', 'Rent'], ['zap', 'Bills'], ['heart-pulse', 'Health'], ['clapperboard', 'Fun'], ['plane', 'Travel'], ['graduation-cap', 'Learning'], ['gift', 'Gifts'], ['plus', 'Create']];
  const props = Object.keys(cs.componentPropertyDefinitions);
  for (const [k, [ic, n]] of cats.entries()) { const inst = (k === 0 ? on : def).createInstance(); const set = {}; set[props.find(x => x.startsWith('Category'))] = n; set[props.find(x => x.startsWith('Icon'))] = ctx.icons[ic].id; inst.setProperties(set); picker.appendChild(inst); }
  await compBoard(col, 'category-picker', cs, picker);
  // Budget progress bar
  const bb = [];
  for (const [st, s, l] of [['Under', 2150, 4000], ['Near', 8200, 10000], ['Over', 6740, 6000], ['No limit', 1200, 0]]) {
    const c = comp(`State=${st}`, 'VERTICAL', 8); fixedW(c, 340);
    const h = frame('header', 'HORIZONTAL', 8); const n = await text(st === 'Over' ? 'Shopping' : st === 'Near' ? 'Food and dining' : st === 'Under' ? 'Transport' : 'Gifts', 'type/label-lg', 'color/text/primary', { name: 'category' }); h.appendChild(n); n.layoutGrow = 1; h.appendChild(await text(l ? `₹${inr(s)} of ₹${inr(l)}` : `₹${inr(s)} spent`, 'type/amount/sm')); c.appendChild(h); fillW(h);
    if (l) {
      const p2 = s / l; const W = 340, tw = st === 'Over' ? 300 : W; const track = figma.createFrame(); track.name = 'track'; track.resize(W, 12); fill(track, 'color/finance/headroom'); rad(track, 'xs'); track.clipsContent = false;
      const f = rect(Math.min(p2, 1.3) * tw, 12, st === 'Over' ? 'color/finance/over-fill' : st === 'Near' ? 'color/finance/near-fill' : 'color/finance/spent', 'xs'); f.name = 'fill'; f.constraints = { horizontal: 'SCALE', vertical: 'MIN' }; track.appendChild(f);
      const lim = figma.createLine(); lim.resize(22, 0); lim.rotation = -90; lim.x = tw - 1; lim.y = -5; lim.strokes = [paint('color/finance/clearance-line')]; lim.strokeWeight = 2; lim.dashPattern = [4, 2]; lim.name = 'clearance-line'; lim.constraints = { horizontal: 'SCALE', vertical: 'MIN' }; track.appendChild(lim);
      c.appendChild(track); track.layoutSizingHorizontal = 'FILL';
      const msg = st === 'Over' ? ['chevrons-up', `₹${inr(s - l)} over`, 'color/finance/over-budget'] : st === 'Near' ? ['triangle-alert', `Close to limit · ₹${inr(l - s)} left`, 'color/finance/near-limit'] : ['circle-check', `On track · ₹${inr(l - s)} left`, 'color/status/success'];
      const sl = frame('status', 'HORIZONTAL', 6, { align: 'CENTER' }); add(sl, icon(msg[0], 16, msg[2]), await text(msg[1], 'type/label-md', msg[2], { name: 'status' })); c.appendChild(sl);
    } else { const sl = frame('status', 'HORIZONTAL', 6, { align: 'CENTER' }); add(sl, icon('plus', 16, 'color/text/secondary'), await text('No limit set · Set limit', 'type/label-md', 'color/text/secondary', { name: 'status' })); c.appendChild(sl); }
    bb.push(c);
  }
  cs = await setOf(bb, 'Budget progress bar'); textProp(cs, 'Category', 'category', 'Food and dining'); await compBoard(col, 'budget-bar', cs);
  // Goal card
  const gc = [];
  for (const [st, nm, ic, saved, target, pct, proj] of [['In progress', 'Goa trip', 'tree-palm', 38000, 60000, .63, 'At ₹5,000 a month you’ll reach it by Feb 2027.'], ['Behind', 'Emergency fund', 'shield', 41000, 150000, .27, 'Add ₹2,000 more a month to make it by December, or move the date to March.'], ['Reached', 'New phone', 'party-popper', 45000, 45000, 1, 'Goal reached']]) {
    const c = comp(`State=${st}`, 'VERTICAL', 8); fixedW(c, 320); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/1');
    const h = frame('header', 'HORIZONTAL', 12, { align: 'CENTER' }); const tile = frame('tile', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(tile, 40, 40); rad(tile, 'md'); fill(tile, st === 'Reached' ? 'color/status/success-bg' : 'color/finance/headroom'); tile.appendChild(icon(ic, 20, st === 'Reached' ? 'color/status/success' : 'color/finance/savings'));
    add(h, tile, await text(nm, 'type/title-sm', 'color/text/primary', { name: 'name' })); c.appendChild(h);
    const am = frame('amount', 'HORIZONTAL', 6, { align: 'MAX' }); add(am, await text('₹' + inr(saved), 'type/amount/lg', 'color/finance/savings'), await text('of ₹' + inr(target), 'type/body-md', 'color/text/secondary')); c.appendChild(am);
    const track = figma.createFrame(); track.resize(288, 12); fill(track, 'color/finance/headroom'); rad(track, 'xs'); track.appendChild(rect(288 * pct, 12, 'color/finance/savings-fill', 'xs')); c.appendChild(track);
    c.appendChild(await text(proj, 'type/body-sm', st === 'Reached' ? 'color/status/success' : 'color/text/secondary', { width: 288 }));
    gc.push(c);
  }
  cs = await setOf(gc, 'Savings goal card'); textProp(cs, 'Name', 'name', 'Goa trip'); await compBoard(col, 'goal-card', cs);
  // Charts
  const chv = [];
  { // donut
    const c = comp('Type=Donut', 'VERTICAL', 16); fixedW(c, 360); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); stroke(c, 'color/border/subtle');
    c.appendChild(await text('Rent and food are 70% of October', 'type/title-sm', 'color/text/primary', { width: 328 }));
    const data = [['Rent', 22000, 'color/chart/1'], ['Food and dining', 12400, 'color/chart/2'], ['Shopping', 6740, 'color/chart/3'], ['Bills', 3860, 'color/chart/4'], ['Transport', 2150, 'color/chart/5'], ['Other', 1900, 'color/chart/other']];
    const total = data.reduce((a, d) => a + d[1], 0); const holder = figma.createFrame(); holder.name = 'donut'; holder.resize(160, 160); holder.fills = []; let a0 = -Math.PI / 2;
    for (const [n, v, col3] of data) { const a1 = a0 + v / total * Math.PI * 2; const e = figma.createEllipse(); e.resize(160, 160); e.arcData = { startingAngle: a0 + 0.02, endingAngle: a1 - 0.02, innerRadius: 0.64 }; fill(e, col3); e.name = n; holder.appendChild(e); a0 = a1; }
    const ctr = await text('₹' + inr(total), 'type/amount/sm'); ctr.x = 80 - ctr.width / 2; ctr.y = 72; holder.appendChild(ctr);
    c.appendChild(holder);
    const lg = frame('legend', 'VERTICAL', 6); for (const [n, v, col3] of data) { const r = frame(n, 'HORIZONTAL', 8, { align: 'CENTER' }); const nm = await text(n, 'type/body-sm'); add(r, rect(12, 12, col3, 'xs'), nm, await text(`₹${inr(v)} · ${Math.round(v / total * 100)}%`, 'type/amount/compact')); nm.layoutGrow = 1; lg.appendChild(r); fillW(r); } c.appendChild(lg); fillW(lg);
    chv.push(c);
  }
  { // bar: same data, scale and labels as the spec site
    const c = comp('Type=Bar', 'VERTICAL', 16); fixedW(c, 360); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); stroke(c, 'color/border/subtle');
    c.appendChild(await text('September went ₹5,400 over the limit', 'type/title-sm', 'color/text/primary', { width: 328 }));
    const plot = figma.createFrame(); plot.name = 'plot'; plot.resize(328, 200); plot.fills = []; const max = 60000, lim = 52000, H = 150, top = 8; const y = v => top + H - v / max * H;
    for (const v of [0, 20000, 40000, 60000]) { const g = rect(300, 1, 'color/border/subtle'); g.name = 'gridline'; g.x = 28; g.y = y(v); plot.appendChild(g); const t = await text(v / 1000 + 'k', 'type/caption', 'color/text/secondary'); t.textAlignHorizontal = 'RIGHT'; t.resize(24, t.height); t.x = 0; t.y = y(v) - 8; plot.appendChild(t); }
    const d = [['Jul', 46200], ['Aug', 51800], ['Sep', 57400], ['Oct', 33550]];
    for (const [i, [m, v]] of d.entries()) {
      const x = 44 + i * 72, bw = 48, cur = i === d.length - 1, over = v > lim;
      const b = rect(bw, top + H - y(v), cur ? 'color/action/primary' : 'color/finance/spent', 'xs'); b.name = m; b.x = x; b.y = y(v); plot.appendChild(b);
      if (over) { const o = rect(bw, y(lim) - y(v), 'color/finance/over-fill', 'xs'); o.name = m + ' over'; o.x = x; o.y = y(v); plot.appendChild(o); }
      const ml = await text(m, 'type/caption', 'color/text/secondary', { align: 'CENTER' }); ml.resize(bw + 16, ml.height); ml.x = x - 8; ml.y = top + H + 6; plot.appendChild(ml);
      const al = await text('₹' + (v / 1000).toFixed(1).replace(/\.0$/, '') + 'k', 'type/amount/compact', over ? 'color/finance/over-budget' : 'color/text/primary', { align: 'CENTER' }); al.resize(bw + 16, al.height); al.x = x - 8; al.y = top + H + 24; plot.appendChild(al);
    }
    const l = dash(300); l.x = 28; l.y = y(lim); plot.appendChild(l);
    c.appendChild(plot); chv.push(c);
  }
  { // line: cumulative spend, limit, today marker and dotted projection
    const c = comp('Type=Line', 'VERTICAL', 16); fixedW(c, 360); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); stroke(c, 'color/border/subtle');
    c.appendChild(await text('On pace to finish ₹9,600 under', 'type/title-sm', 'color/text/primary', { width: 328 }));
    const plot = figma.createFrame(); plot.name = 'plot'; plot.resize(328, 186); plot.fills = [];
    const pts = [0, 22000, 23400, 24100, 25300, 25800, 26900, 27400, 28800, 29100, 29600, 30400, 30900, 31400, 32000, 32400, 33000, 33200, 33550];
    const W = 300, X0 = 28, H = 150, top = 8, max = 60000, days = 31, today = 18, lim = 52000;
    const X = dd => X0 + dd / days * W, Y = v => top + H - v / max * H;
    const proj = 33550 + (33550 - 22000) / 17 * (days - today);
    for (const v of [0, 20000, 40000, 60000]) { const g = rect(W, 1, 'color/border/subtle'); g.name = 'gridline'; g.x = X0; g.y = Y(v); plot.appendChild(g); const t = await text(v / 1000 + 'k', 'type/caption', 'color/text/secondary'); t.textAlignHorizontal = 'RIGHT'; t.resize(24, t.height); t.x = 0; t.y = Y(v) - 8; plot.appendChild(t); }
    const l = dash(W); l.x = X0; l.y = Y(lim); plot.appendChild(l);
    const ll = await text('Limit ₹52,000', 'type/label-sm'); ll.x = X0 + W - ll.width; ll.y = Y(lim) - 20; plot.appendChild(ll);
    const v = figma.createVector(); v.vectorPaths = [{ windingRule: 'NONE', data: pts.map((p2, i) => `${i ? 'L' : 'M'} ${X(i).toFixed(1)} ${Y(p2).toFixed(1)}`).join(' ') }]; v.strokes = [paint('color/finance/spent')]; v.strokeWeight = 3; v.strokeJoin = 'ROUND'; v.fills = []; v.name = 'spend'; plot.appendChild(v);
    const pr = figma.createVector(); pr.vectorPaths = [{ windingRule: 'NONE', data: `M ${X(today).toFixed(1)} ${Y(33550).toFixed(1)} L ${X(days).toFixed(1)} ${Y(proj).toFixed(1)}` }]; pr.strokes = [paint('color/text/secondary')]; pr.strokeWeight = 2; pr.dashPattern = [2, 4]; pr.fills = []; pr.name = 'projection'; plot.appendChild(pr);
    const td = rect(2, H, 'color/action/primary'); td.name = 'today'; td.x = X(today) - 1; td.y = top; plot.appendChild(td);
    const dot = ellipse(10, 'color/action/primary'); dot.name = 'today point'; stroke(dot, 'color/surface/raised', 2, { align: 'OUTSIDE' }); dot.x = X(today) - 5; dot.y = Y(33550) - 5; plot.appendChild(dot);
    const tl = await text('Today', 'type/label-sm', 'color/action/primary', { align: 'CENTER' }); tl.resize(48, tl.height); tl.x = X(today) - 24; tl.y = top + H + 8; plot.appendChild(tl);
    const s1 = await text('1 Oct', 'type/caption', 'color/text/secondary'); s1.x = X0; s1.y = top + H + 8; plot.appendChild(s1);
    const s2 = await text('31 Oct', 'type/caption', 'color/text/secondary'); s2.x = X0 + W - s2.width; s2.y = top + H + 8; plot.appendChild(s2);
    c.appendChild(plot); chv.push(c);
  }
  cs = await setOf(chv, 'Spending charts'); await compBoard(col, 'charts', cs);
  // Date range
  const dr = [];
  { const c = comp('Type=Presets', 'VERTICAL', 0); fixedW(c, 280); pad(c, 8); rad(c, 'lg'); fill(c, 'color/surface/raised'); stroke(c, 'color/border/subtle');
    for (const [l, on] of [['This month', true], ['Last month', false], ['Last 3 months', false], ['This year', false], ['Custom', false]]) { const r = frame(l, 'HORIZONTAL', 8, { align: 'CENTER' }); fixedH(r, 48); pad(r, 0, 12); const t = await text(l, on ? 'type/label-lg' : 'type/body-lg'); r.appendChild(t); t.layoutGrow = 1; if (on) r.appendChild(icon('check', 20, 'color/action/primary')); if (l === 'Custom') r.appendChild(icon('chevron-right', 20, 'color/text/secondary')); c.appendChild(r); fillW(r); }
    dr.push(c); }
  { const c = comp('Type=Calendar', 'VERTICAL', 8); fixedW(c, 336); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); stroke(c, 'color/border/subtle');
    const h = frame('month', 'HORIZONTAL', 0, { align: 'CENTER' }); add(h, icon('chevron-left', 20)); const mt = await text('October 2026', 'type/label-lg', 'color/text/primary', { align: 'CENTER' }); h.appendChild(mt); mt.layoutGrow = 1; h.appendChild(icon('chevron-right', 20)); c.appendChild(h); fillW(h);
    const g = frame('grid', 'HORIZONTAL', 0); g.layoutWrap = 'WRAP'; fixedW(g, 304);
    for (const d of ['M', 'T', 'W', 'T', 'F', 'S', 'S']) { const cell = frame(d, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(cell, 43, 28); cell.appendChild(await text(d, 'type/label-sm', 'color/text/secondary')); g.appendChild(cell); }
    for (let i = -2; i <= 31; i++) { const cell = frame('d' + i, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(cell, 43, 40); if (i < 1) { g.appendChild(cell); continue; }
      const inR = i >= 6 && i <= 18; if (inR) fill(cell, 'color/finance/headroom');
      if (i === 6 || i === 18) { const dot = frame('sel', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(dot, 36, 36); rad(dot, 'full'); fill(dot, 'color/action/primary'); dot.appendChild(await text(String(i), 'type/label-md', 'color/action/on-primary')); cell.appendChild(dot); }
      else cell.appendChild(await text(String(i), 'type/body-sm', i > 18 ? 'color/text/disabled' : 'color/text/primary'));
      g.appendChild(cell); }
    c.appendChild(g); dr.push(c); }
  cs = await setOf(dr, 'Date range picker'); await compBoard(col, 'date-range', cs);
  // Keypad
  const key = [];
  for (const type of ['Digit', 'Delete']) { const c = comp(`Type=${type}`, 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(c, 96, 64); rad(c, 'md'); fill(c, 'color/surface/sunken'); if (type === 'Digit') c.appendChild(await text('1', 'type/amount/lg', 'color/text/primary', { name: 'digit' })); else c.appendChild(icon('delete', 26)); key.push(c); }
  const keySet = await setOf(key, 'Keypad key', 300); const dk = textProp(keySet, 'Digit', 'digit', '1');
  const kp = comp('Number keypad', 'VERTICAL', 12, { align: 'CENTER' }); fixedW(kp, 336); pad(kp, 16); rad(kp, 'xl'); fill(kp, 'color/surface/raised'); stroke(kp, 'color/border/subtle');
  add(kp, await text('₹1,24,500', 'type/amount/hero', 'color/text/primary', { name: 'amount' }), await text('Food and dining · ₹1,800 left', 'type/body-md', 'color/text/secondary'));
  const grid = frame('keys', 'HORIZONTAL', 8); grid.layoutWrap = 'WRAP'; sp(grid, 'counterAxisSpacing', 8); fixedW(grid, 304);
  const dig = keySet.children.find(v => v.name === 'Type=Digit'), del = keySet.children.find(v => v.name === 'Type=Delete');
  for (const k of ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'del']) { const i = (k === 'del' ? del : dig).createInstance(); if (k !== 'del') { const s = {}; s[dk] = k; i.setProperties(s); } grid.appendChild(i); }
  kp.appendChild(grid);
  const save = frame('primary', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixedH(save, 56); rad(save, 'md'); fill(save, 'color/action/primary'); save.appendChild(await text('Add expense', 'type/label-lg', 'color/action/on-primary')); kp.appendChild(save); fillW(save);
  kp.description = (DATA.comps.keypad || {}).purpose || '';
  await compBoard(col, 'keypad', keySet, kp);

  // Proposed gap components
  const gapCol = frame('Proposed', 'VERTICAL', 40);
  // Insight card
  { const c = comp('Insight card', 'HORIZONTAL', 12); fixedW(c, 360); pad(c, 16); rad(c, 'lg'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/1');
    const tile = frame('tile', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(tile, 40, 40); rad(tile, 'md'); fill(tile, 'color/action/secondary'); tile.appendChild(icon('utensils', 20, 'color/action/on-secondary'));
    const body = frame('body', 'VERTICAL', 10); body.appendChild(await text('₹2,100 less on food than this time in September', 'type/title-sm', 'color/text/primary', { width: 276, name: 'insight' }));
    for (const [m, w, v, col4] of [['October', 160, '₹8,200', 'color/chart/1'], ['September', 216, '₹10,300', 'color/finance/spent']]) { const r = frame(m, 'HORIZONTAL', 8, { align: 'CENTER' }); const ml = await text(m, 'type/body-sm', 'color/text/secondary'); ml.resize(70, ml.height); add(r, ml, rect(w * 0.7, 8, col4, 'xs'), await text(v, 'type/amount/sm')); body.appendChild(r); }
    add(c, tile, body); c.description = DATA.gaps['Insight card'] || ''; gapCol.appendChild(c); }
  // Bill row
  { const c = comp('Upcoming bill row', 'HORIZONTAL', 12, { align: 'CENTER' }); fixed(c, 390, 72); pad(c, 8, 16); fill(c, 'color/surface/default');
    const d = frame('date', 'VERTICAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(d, 44, 48); rad(d, 'md'); fill(d, 'color/surface/sunken'); add(d, await text('21', 'type/amount/md'), await text('Oct', 'type/label-sm', 'color/text/secondary'));
    const m = frame('text', 'VERTICAL', 2); add(m, await text('Netflix', 'type/label-lg', 'color/text/primary', { name: 'name' }), await text('Every month', 'type/body-sm', 'color/text/secondary'));
    const r = frame('trailing', 'VERTICAL', 4, { align: 'MAX' }); const tg = frame('due', 'HORIZONTAL', 4, { align: 'CENTER' }); fixedH(tg, 24); pad(tg, 0, 8); rad(tg, 'sm'); fill(tg, 'color/status/warning-bg'); add(tg, icon('clock', 12, 'color/status/warning'), await text('In 3 days', 'type/label-sm', 'color/status/warning'));
    add(r, await text('₹649', 'type/amount/md'), tg); add(c, d, m, r); m.layoutGrow = 1; c.description = DATA.gaps['Upcoming bill row'] || ''; gapCol.appendChild(c); }
  // Sync status
  { const c = comp('Sync status line', 'HORIZONTAL', 6, { align: 'CENTER' }); fixed(c, 360, 48); c.appendChild(icon('history', 16, 'color/text/secondary')); const t = await text('Updated 5 min ago', 'type/body-sm', 'color/text/secondary', { name: 'status' }); c.appendChild(t); t.layoutGrow = 1; const b = frame('refresh', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fixed(b, 48, 48); b.appendChild(icon('refresh-cw', 20, 'color/text/secondary')); c.appendChild(b); c.description = DATA.gaps['Sync status line'] || ''; gapCol.appendChild(c); }
  // Period summary
  { const c = comp('Period summary', 'VERTICAL', 0); fixedW(c, 358); rad(c, 'lg'); fill(c, 'color/surface/raised'); await fx(c, 'elevation/1'); c.clipsContent = true;
    const row = frame('cells', 'HORIZONTAL', 0); for (const [l, v, col5] of [['Spent', '₹33,550', 'color/text/primary'], ['Income', '+₹84,500', 'color/finance/income']]) { const cell = frame(l, 'VERTICAL', 2); pad(cell, 12, 16); fixedW(cell, 179); add(cell, await text(l, 'type/label-sm', 'color/text/secondary'), await text(v, 'type/amount/lg', col5)); row.appendChild(cell); }
    const cap = frame('caption', 'HORIZONTAL', 0); pad(cap, 8, 16); stroke(cap, 'color/border/subtle'); cap.strokeTopWeight = 1; cap.strokeBottomWeight = 0; cap.strokeLeftWeight = 0; cap.strokeRightWeight = 0; cap.appendChild(await text('All categories · 1–18 Oct', 'type/body-sm', 'color/text/secondary'));
    add(c, row, cap); fillW(cap); c.description = DATA.gaps['Period summary'] || ''; gapCol.appendChild(c); }
  const gb = await board('Proposed components (gaps found in Stage 5)', 'Needed by the proof screens and specified like Stage 2 components. Built from existing tokens only: no new colours, sizes or radii.');
  for (const c of [...gapCol.children]) {
    const item = frame(c.name, 'VERTICAL', 0); sp(item, 'itemSpacing', 8);
    const stage = frame('stage', 'VERTICAL', 0); fill(stage, 'color/surface/canvas'); rad(stage, 'lg'); stroke(stage, 'color/border/subtle', 1, { dash: [4, 4] }); pad(stage, 32); fixedW(stage, 1184);
    add(item, await text(c.name, 'type/title-sm'), await text(DATA.gaps[c.name] || '', 'type/body-md', 'color/text/secondary', { width: 1000 }));
    gapCol.appendChild(item); stage.appendChild(c); item.appendChild(stage);
  }
  gb.appendChild(gapCol); col.appendChild(gb);
}


/* ---------------- guidelines page: getting started, status, choosing, a11y, governance ---------------- */
async function buildGuidelines() {
  const p = await page('Guidelines');
  const col = column(p);
  const list = async (rows, w = 1100) => { const f = frame('list', 'VERTICAL', 12); for (const [h, d] of rows) { const r = frame(h, 'VERTICAL', 2); add(r, await text(h, 'type/label-lg'), await text(d, 'type/body-md', 'color/text/secondary', { width: w })); f.appendChild(r); } return f; };
  const G = DATA.guides, V = DATA.gov;
  { const b = await board('Getting started', 'Headroom v' + V.version + '. Five steps each for designers and developers.');
    const two = frame('two', 'HORIZONTAL', 48);
    const d1 = frame('designers', 'VERTICAL', 16); add(d1, await text('For designers', 'type/title-sm'), await list(G.start.designers, 520));
    const d2 = frame('developers', 'VERTICAL', 16); add(d2, await text('For developers', 'type/title-sm'), await list(G.start.developers, 520));
    add(two, d1, d2); b.appendChild(two); col.appendChild(b); }
  { const b = await board('Component status', 'Proposed → Beta → Stable → Deprecated. Stable changes only through governance.');
    const life = frame('lifecycle', 'HORIZONTAL', 16);
    const tone = { Stable: ['color/status/success-bg', 'color/status/success'], Beta: ['color/status/info-bg', 'color/status/info'], Proposed: ['color/status/warning-bg', 'color/status/warning'], Deprecated: ['color/status/danger-bg', 'color/status/danger'] };
    const pill = async st => { const t = frame(st, 'HORIZONTAL', 0); fill(t, tone[st][0]); rad(t, 'full'); pad(t, 2, 8); t.appendChild(await text(st, 'type/label-sm', tone[st][1])); return t; };
    for (const [st, d] of G.lifecycle) { const c = frame(st, 'VERTICAL', 8); fill(c, 'color/surface/canvas'); rad(c, 'md'); pad(c, 16); fixedW(c, 280); add(c, await pill(st), await text(d, 'type/body-sm', 'color/text/secondary', { width: 248 })); life.appendChild(c); }
    { const mh = Math.max(...life.children.map(k => k.height)); for (const k of life.children) { k.primaryAxisSizingMode = 'FIXED'; k.resize(k.width, mh); } }
    b.appendChild(life);
    const PL = c => [['i', 'iOS'], ['a', 'Android'], ['w', 'Web']].filter(x => c.includes(x[0])).map(x => x[1]).join(' · ');
    const tbl = frame('table', 'VERTICAL', 0); fixedW(tbl, 1184);
    for (const [n, st, pl, note] of G.status) { const r = frame(n, 'HORIZONTAL', 16, { align: 'CENTER' }); fixedW(r, 1184); pad(r, 8, 0); stroke(r, 'color/border/subtle'); r.strokeTopWeight = 0; r.strokeLeftWeight = 0; r.strokeRightWeight = 0;
      add(r, await text(n, 'type/label-md', 'color/text/primary', { width: 260 }), await (async () => { const cell = frame('status', 'HORIZONTAL', 0); fixedW(cell, 104); cell.appendChild(await pill(st)); return cell; })(), await text(PL(pl), 'type/body-sm', 'color/text/secondary', { width: 200 }), await text(note || '—', 'type/body-sm', 'color/text/secondary', { width: 560 })); tbl.appendChild(r); }
    b.appendChild(tbl); col.appendChild(b); }
  for (const c of G.choosers) {
    const b = await board('Which component? · ' + c.title, c.intro);
    const two = frame('two', 'HORIZONTAL', 48);
    const steps = frame('steps', 'VERTICAL', 12); fixedW(steps, 600);
    let i = 1; for (const [q, a] of c.steps) { const r = frame('step', 'HORIZONTAL', 12); const n = frame('n', 'HORIZONTAL', 0, { align: 'CENTER', justify: 'CENTER' }); fill(n, 'color/surface/sunken'); rad(n, 'full'); fixed(n, 24, 24); n.appendChild(await text(String(i++), 'type/label-sm'));
      const t = frame('t', 'VERTICAL', 2); add(t, await text(q, 'type/body-md', 'color/text/secondary', { width: 540 }), await text('→ ' + a, 'type/label-md', 'color/action/on-secondary', { width: 540 })); add(r, n, t); steps.appendChild(r); }
    add(two, steps, await list(c.reference, 500)); b.appendChild(two); col.appendChild(b); }
  { const b = await board('Accessibility checklist', 'Check every new screen against this list before handoff.'); b.appendChild(await list(G.a11y)); col.appendChild(b); }
  { const b = await board('Governance', 'Version ' + V.version + '. Full text in docs/governance.md; history and migration maps in CHANGELOG.md.');
    add(b, await text('Naming', 'type/title-sm'), await list(V.naming), await text('Versioning', 'type/title-sm'), await list(V.semver.map(([a, w, e]) => [a, `${w} Example: ${e}`])),
      await text('Deprecation', 'type/title-sm'), await list(V.deprecation), await text('Contributing a change', 'type/title-sm'), await list(V.contribution));
    col.appendChild(b); }
}

/* ---------------- proof screens: four key screens built only from library instances ---------------- */
const setCache = {};
async function libNode(name, type = 'COMPONENT_SET') {
  const key = type + ':' + name; if (setCache[key]) return setCache[key];
  for (const pg of figma.root.children) { if (pg.name === 'Proof screens') continue; await pg.loadAsync(); const n = pg.findOne(x => x.type === type && x.name === name); if (n) return (setCache[key] = n); }
  throw new Error('Missing library ' + type.toLowerCase() + ': ' + name);
}
async function inst(setName, variant) {
  const set = await libNode(setName);
  const v = variant ? set.children.find(c => c.name === variant) : set.defaultVariant;
  if (!v) throw new Error(`Missing variant ${setName} / ${variant}`);
  return v.createInstance();
}
async function setProp(node, prefix, value, layer) { const k = Object.keys(node.componentProperties || {}).find(x => x.startsWith(prefix)); if (k) node.setProperties({ [k]: value }); else if (layer) await setText(node, value, layer); return node; }
async function replaceText(node, from, to) { for (const t of node.findAll(n => n.type === 'TEXT' && n.characters === from)) { if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName); t.characters = to; } return node; }
async function txInst(type, merchant, sub, amount, ic) { const i = await inst('Transaction row', 'Type=' + type); if (ic) { const cur = i.findOne(n => n.type === 'INSTANCE' && /^icon\//.test(n.name)); if (cur) { cur.swapComponent(ctx.icons[ic]); for (const v of cur.findAll(n => 'strokes' in n && n.strokes.length)) v.strokes = [paint('color/text/primary')]; } } await setProp(i, 'Merchant', merchant, 'title'); await setProp(i, 'Subtitle', sub, 'subtitle'); await setProp(i, 'Amount', amount, 'amount'); return i; }
async function single(name) { return (await libNode(name, 'COMPONENT')).createInstance(); }
async function setText(node, chars, name) {
  const t = node.findOne(n => n.type === 'TEXT' && (!name || n.name === name)); if (!t) return node;
  if (t.fontName !== figma.mixed) await figma.loadFontAsync(t.fontName);
  t.characters = chars; return node;
}
function bindAll(node, fields, token) { for (const f of fields) node.setBoundVariable(f, ctx.num[token]); }
function screenFrame(name) {
  const f = frame(name, 'VERTICAL', 0); fill(f, 'color/surface/canvas'); fixedW(f, 390); f.clipsContent = true; rad(f, 'xl');
  return f;
}
function body() {
  const b = frame('content', 'VERTICAL', 0);
  bindAll(b, ['paddingLeft', 'paddingRight'], 'space/layout/page-margin/compact');
  b.setBoundVariable('paddingTop', ctx.num['space/layout/screen-top/compact']);
  b.setBoundVariable('paddingBottom', ctx.num['space/layout/content-bottom/compact']);
  b.setBoundVariable('itemSpacing', ctx.num['space/layout/group/compact']);
  return b;
}
async function sectionHead(title, action) {
  const h = frame(title, 'HORIZONTAL', 8, { align: 'CENTER' }); const t = await text(title, 'type/title-sm'); h.appendChild(t); t.layoutGrow = 1;
  if (action) h.appendChild(await text(action, 'type/label-md', 'color/text/link'));
  return h;
}
function group(name, kids, token = 'space/text/section-heading-below') {
  const g = frame(name, 'VERTICAL', 0); g.setBoundVariable('itemSpacing', ctx.num[token]); for (const k of kids) if (k) g.appendChild(k); return g;
}
function listCard(name) { const c = frame(name, 'VERTICAL', 0); fill(c, 'color/surface/raised'); rad(c, 'lg'); c.clipsContent = true; stroke(c, 'color/border/subtle'); return c; }
async function annotate(screen, title, job) {
  const wrap = frame(title, 'VERTICAL', 0); wrap.setBoundVariable('itemSpacing', ctx.num['space/media/illustration-to-headline']);
  const head = frame('caption', 'VERTICAL', 0); head.setBoundVariable('itemSpacing', ctx.num['space/text/heading-to-body']);
  add(head, await text(title, 'type/title-md'), await text(job, 'type/body-md', 'color/text/secondary', { width: 390 }));
  add(wrap, head, screen); return wrap;
}

async function buildProof() {
  let homeRef;
  const p = await page('Proof screens');
  const row = frame('Screens', 'HORIZONTAL', 0); row.x = 120; row.y = 120; row.itemSpacing = 120; row.counterAxisAlignItems = 'MIN'; p.appendChild(row);
  const intro = await text('Four key screens built only from library instances and semantic tokens. Nothing here is detached or hand-coloured.', 'type/body-lg', 'color/text/secondary', { width: 820 });
  intro.x = 120; intro.y = 40; p.appendChild(intro);

  // 1. Home
  { const sc = screenFrame('Home dashboard');
    const bar = await inst('Top app bar', 'Type=Large'); await setText(bar, 'October', 'large-title'); sc.appendChild(bar); fillW(bar);
    const b = body();
    const bal = await inst('Balance card (clearance gauge)', 'State=On track'); b.appendChild(bal); fillW(bal);
    const sync = await single('Sync status line'); const ins = await single('Insight card');
    const top = group('summary', [sync, ins], 'space/text/title-to-subtitle'); b.appendChild(top); fillW(sync); fillW(ins);
    const bud = listCard('budgets'); bud.setBoundVariable('itemSpacing', ctx.num['space/stack/field-to-field']); pad(bud, 16);
    for (const [st, nm] of [['Over', 'Shopping'], ['Near', 'Food and dining'], ['Under', 'Transport']]) { const i = await inst('Budget progress bar', 'State=' + st); await setProp(i, 'Category', nm, 'category'); bud.appendChild(i); fillW(i); }
    b.appendChild(group('Budgets', [await sectionHead('Budgets closest to their limit', 'See all'), bud])); fillW(bud);
    const bills = listCard('bills'); const bill = await single('Upcoming bill row'); bills.appendChild(bill); fillW(bill);
    b.appendChild(group('Upcoming', [await sectionHead('Coming up', 'See all'), bills])); fillW(bills);
    const recent = listCard('recent'); for (const r of [['Expense', 'Swiggy', 'Food and dining · 1:42 pm', '−₹386'], ['Income', 'Acme Ltd', 'Salary · Received', '+₹84,500'], ['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket']]) { const i = await txInst(...r); recent.appendChild(i); fillW(i); }
    b.appendChild(group('Recent', [await sectionHead('Recent activity', 'See all'), recent])); fillW(recent);
    sc.appendChild(b); fillW(b);
    for (const k of b.children) if (k.type === 'FRAME' || k.type === 'INSTANCE') fillW(k);
    const nav = await inst('Bottom nav bar', 'Active=Home'); sc.appendChild(nav); fillW(nav);
    homeRef = sc;
    row.appendChild(await annotate(sc, 'Home dashboard', 'Answer “am I okay this month?” in one glance, then show what needs attention next.')); }

  // 2. Transactions
  { const sc = screenFrame('Transactions list');
    const bar = await inst('Top app bar', 'Type=Large'); await setText(bar, 'Activity', 'large-title'); sc.appendChild(bar); fillW(bar);
    const b = body();
    const search = await inst('Search', 'State=Empty'); b.appendChild(search); fillW(search);
    const chips = frame('filters', 'HORIZONTAL', 0); chips.layoutWrap = 'WRAP'; chips.setBoundVariable('itemSpacing', ctx.num['space/stack/control-inline']); chips.setBoundVariable('counterAxisSpacing', ctx.num['space/stack/control-inline']);
    for (const [v, l] of [['Type=Filter, Selected=true', 'October'], ['Type=Filter, Selected=false', 'Food'], ['Type=Filter, Selected=false', 'Shopping'], ['Type=Filter, Selected=false', 'Bills']]) chips.appendChild(await setText(await inst('Chips and tags', v), l));
    b.appendChild(group('search and filters', [chips], 'space/stack/control-inline'));
    const sum = await single('Period summary'); b.appendChild(sum); fillW(sum);
    const day = async (label, net, rows) => {
      const h = frame(label, 'HORIZONTAL', 8, { align: 'CENTER' }); const t = await text(label, 'type/label-md', 'color/text/secondary'); h.appendChild(t); t.layoutGrow = 1; h.appendChild(await text(net, 'type/amount/sm', 'color/text/secondary'));
      const card = listCard('rows'); for (const r of rows) { const i = await txInst(...r); card.appendChild(i); fillW(i); }
      const g = group(label, [h, card]); b.appendChild(g); fillW(card); fillW(h); };
    await day('Today', '−₹1,047', [['Expense', 'Swiggy', 'Food and dining · 1:42 pm', '−₹386'], ['Pending', 'Uber', 'Transport · Pending', '−₹212', 'bus'], ['Expense', 'Blinkit', 'Groceries · 9:10 am', '−₹449', 'shopping-basket']]);
    await day('Yesterday', '+₹80,799', [['Income', 'Acme Ltd', 'Salary · Received', '+₹84,500'], ['Saved', 'Goa trip', 'Moved to goal', '₹5,000'], ['Refund', 'Amazon', 'Shopping · Refund', '+₹1,299']]);
    sc.appendChild(b); fillW(b); for (const k of b.children) if (k.type === 'FRAME' || k.type === 'INSTANCE') fillW(k);
    const nav = await inst('Bottom nav bar', 'Active=Activity'); sc.appendChild(nav); fillW(nav);
    row.appendChild(await annotate(sc, 'Transactions list', 'Find, scan and fix transactions quickly, with totals that match the bank statement.')); }

  // 3. Budget detail
  { const sc = screenFrame('Budget detail');
    const bar = await inst('Top app bar', 'Type=Compact'); await setText(bar, 'Food and dining', 'title'); sc.appendChild(bar); fillW(bar);
    const b = body();
    const hero = frame('room left', 'VERTICAL', 0); hero.setBoundVariable('itemSpacing', ctx.num['space/text/amount-to-caption']);
    add(hero, await text('₹1,800', 'type/amount/hero'), await text('left of your ₹10,000 limit · 13 days to go', 'type/body-md', 'color/text/secondary'));
    const bb = await inst('Budget progress bar', 'State=Near'); for (const n of bb.children) if (n.name === 'header' || n.name === 'status') n.visible = false;
    const top = frame('top', 'VERTICAL', 0); top.setBoundVariable('itemSpacing', ctx.num['space/media/amount-to-visual']); add(top, hero, bb); b.appendChild(top); fillW(bb);
    const al = await inst('Inline alert', 'Type=Warning'); b.appendChild(al); fillW(al);
    const tabs = await inst('Tabs', 'Selected=Overview'); b.appendChild(tabs); fillW(tabs);
    const line = await inst('Spending charts', 'Type=Line'); const barc = await inst('Spending charts', 'Type=Bar');
    const charts = group('charts', [line, barc], 'space/stack/card-to-card'); b.appendChild(charts); fillW(line); fillW(barc);
    const btn = await inst('Button', 'Variant=Tonal, Size=Large, State=Default'); await setText(btn, 'Adjust limit'); b.appendChild(btn); fillW(btn);
    sc.appendChild(b); fillW(b); for (const k of b.children) if (k.type === 'FRAME' || k.type === 'INSTANCE') if (k !== tabs) fillW(k);
    const nav = await inst('Bottom nav bar', 'Active=Budgets'); sc.appendChild(nav); fillW(nav);
    row.appendChild(await annotate(sc, 'Budget detail', 'Show one category’s month: how much room is left, whether the pace is sustainable, and what to adjust.')); }

  // 4. Add expense (bottom sheet over a dimmed Home)
  { const sc = figma.createFrame(); sc.name = 'Add expense'; sc.resize(390, 844); sc.clipsContent = true; rad(sc, 'xl'); fill(sc, 'color/surface/canvas');
    const bg = homeRef.clone(); bg.name = 'Home (behind sheet)'; sc.appendChild(bg); bg.x = 0; bg.y = 0;
    const scrim = rect(390, 844, 'color/overlay/scrim'); scrim.name = 'scrim'; sc.appendChild(scrim);
    const sheet = frame('sheet', 'VERTICAL', 0, { align: 'CENTER' }); fill(sheet, 'color/surface/raised'); await fx(sheet, 'elevation/3');
    ['topLeftRadius', 'topRightRadius'].forEach(k => sheet.setBoundVariable(k, ctx.num['radius/xl']));
    bindAll(sheet, ['paddingLeft', 'paddingRight', 'paddingBottom'], 'space/inset/xl'); sheet.setBoundVariable('paddingTop', ctx.num['space/squish/md/block']);
    sheet.setBoundVariable('itemSpacing', ctx.num['space/stack/field-to-field']);
    const handle = rect(32, 4, 'color/border/default', 'xs');
    const head = frame('header', 'HORIZONTAL', 8, { align: 'CENTER' }); const ht = await text('Add expense', 'type/title-md'); head.appendChild(ht); ht.layoutGrow = 1; head.appendChild(await inst('Back and close patterns', 'Type=Close'));
    const chips = frame('categories', 'HORIZONTAL', 0); chips.setBoundVariable('itemSpacing', ctx.num['space/stack/control-inline']);
    for (const [v, l] of [['Type=Choice, Selected=true', 'Food'], ['Type=Choice, Selected=false', 'Groceries'], ['Type=Choice, Selected=false', 'Transport'], ['Type=Choice, Selected=false', 'More']]) chips.appendChild(await setText(await inst('Chips and tags', v), l));
    const kp = await single('Number keypad'); kp.strokes = [];
    await replaceText(kp, '₹1,24,500', '₹386'); await replaceText(kp, 'Add expense', 'Add ₹386 expense');
    for (const t of kp.findAll(n => n.type === 'TEXT' && /left/.test(n.characters))) { await figma.loadFontAsync(t.fontName); t.characters = 'Food · ₹1,414 left after this'; }
    add(sheet, handle, head, chips, kp); fixedW(sheet, 390); fillW(head); fillW(kp);
    sc.appendChild(sheet); sheet.x = 0; sheet.y = 844 - sheet.height;
    row.appendChild(await annotate(sc, 'Add expense', 'Log an expense in three taps and see its consequence before saving.')); }
  for (const w of row.children) log.push(`screen ${w.name}: ${Math.round(w.children[1].width)}×${Math.round(w.children[1].height)}`);
  log.push('proof screens: 4');
}

/* ---------------- audit: overflow, unbound colours, off-scale numbers ---------------- */
async function auditFile() {
  const issues = { overflow: [], colour: [], text: [] };
  const inInstance = n => { for (let a = n.parent; a && a.type !== 'PAGE'; a = a.parent) if (a.type === 'INSTANCE') return true; return false; };
  const skipOverflow = n => /^(fill|clearance-line|today|spend|Rectangle|Line|Vector)$/.test(n.name) || n.type === 'LINE' || n.type === 'VECTOR' || n.type === 'ELLIPSE';
  for (const name of PAGE_NAMES) {
    const pg = figma.root.children.find(x => x.name === name); if (!pg) continue; await pg.loadAsync();
    for (const n of pg.findAll(() => true)) {
      if (inInstance(n) && name !== 'Proof screens') continue;
      const par = n.parent;
      if (par && par.type !== 'PAGE' && n.absoluteBoundingBox && par.absoluteBoundingBox && n.visible && !skipOverflow(n) && !(n.layoutPositioning === 'ABSOLUTE')) {
        const a = n.absoluteBoundingBox, b = par.absoluteBoundingBox, e = 0.5;
        if (a.x < b.x - e || a.y < b.y - e || a.x + a.width > b.x + b.width + e || a.y + a.height > b.y + b.height + e)
          if (!(par.layoutMode === 'NONE' && /plot|donut|gauge|clearance-gauge|headroom|spent|track|Add expense|Cover/.test(par.name)))
            issues.overflow.push(`${name} › ${par.name} › ${n.name} (${Math.round(a.width)}×${Math.round(a.height)} in ${Math.round(b.width)}×${Math.round(b.height)})`);
      }
      if ('fills' in n && Array.isArray(n.fills)) for (const f of n.fills) if (f.type === 'SOLID' && f.visible !== false && !(f.boundVariables && f.boundVariables.color)) issues.colour.push(`${name} › ${n.name}`);
      if ('strokes' in n && Array.isArray(n.strokes)) for (const f of n.strokes) if (f.type === 'SOLID' && f.visible !== false && !(f.boundVariables && f.boundVariables.color) && n.type !== 'VECTOR') issues.colour.push(`${name} › ${n.name} (stroke)`);
      if (n.type === 'TEXT' && !n.textStyleId && !/^Wordmark/.test(n.name)) issues.text.push(`${name} › ${n.name}`);
    }
  }
  const sample = a => a.slice(0, 12).join('\n  ') + (a.length > 12 ? `\n  … and ${a.length - 12} more` : '');
  log.push(`audit · overflow: ${issues.overflow.length}${issues.overflow.length ? '\n  ' + sample(issues.overflow) : ''}`);
  log.push(`audit · unbound colours: ${issues.colour.length}${issues.colour.length ? '\n  ' + sample(issues.colour) : ''}`);
  log.push(`audit · text without a text style: ${issues.text.length}${issues.text.length ? '\n  ' + sample(issues.text) : ''}`);
}

/* ---------------- review export (dev only): PNG of every board to a localhost receiver ---------------- */
const REVIEW = false; // set true (and run the receiver) to export every board as a PNG for review
async function exportBoards() {
  figma.showUI(`<script>onmessage=async e=>{const m=e.data.pluginMessage;if(!m||m.type!=='png')return;let err='';try{await fetch('http://localhost:8766/save?name='+encodeURIComponent(m.name),{method:'POST',body:new Uint8Array(m.bytes)})}catch(x){err=String(x)}parent.postMessage({pluginMessage:{type:'ack',id:m.id,err}},'*')}</script>`, { visible: false });
  const waits = {}; figma.ui.onmessage = m => { if (m && m.type === 'ack' && waits[m.id]) { waits[m.id](m.err); delete waits[m.id]; } };
  let id = 0, sent = 0, failed = 0;
  for (const [pi, name] of PAGE_NAMES.entries()) {
    const pg = figma.root.children.find(x => x.name === name); if (!pg) continue; await pg.loadAsync();
    let nodes = [];
    for (const top of pg.children) { if (top.type === 'FRAME' && (top.name === 'Column' || top.name === 'Screens')) nodes.push(...top.children); else if (top.type === 'FRAME') nodes.push(top); }
    for (const [i, n] of nodes.entries()) {
      const bytes = await n.exportAsync({ format: 'PNG', constraint: { type: 'SCALE', value: n.width > 1400 ? 1 : 1.25 } });
      const my = ++id; const done = new Promise(r => (waits[my] = r));
      figma.ui.postMessage({ type: 'png', id: my, name: `${String(pi).padStart(2, '0')}-${name}-${String(i).padStart(2, '0')}-${n.name}`, bytes });
      const err = await done; if (err) failed++; else sent++;
    }
  }
  log.push(`review export: ${sent} boards sent${failed ? `, ${failed} failed` : ''}`);
}
/* ---------------- run ---------------- */
function report(ok, msg) {
  const esc = t => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  figma.showUI(`<div style="font:13px/1.5 system-ui;padding:16px;color:${ok ? '#01692E' : '#98291D'}"><b>${ok ? 'Headroom built' : 'Headroom build failed'}</b><pre style="white-space:pre-wrap;color:#22282F">${esc(msg)}</pre><pre style="white-space:pre-wrap;color:#4E5862">${esc(log.join('\n'))}</pre></div>`, { width: 760, height: 640, title: 'Headroom DS Builder' });
}
(async () => {
  let step = 'start';
  try {
    const first = figma.root.children[0];
    if (first && first.name === 'Page 1' && !figma.root.children.find(x => x.name === 'Cover')) { await figma.setCurrentPageAsync(first); if (first.children.length === 0) first.name = 'Cover'; }
    step = 'variables'; await buildVariables();
    step = 'styles'; await buildStyles();
    step = 'icons'; await buildIcons();
    step = 'cover'; await buildCover();
    step = 'guidelines'; await buildGuidelines();
    step = 'foundations'; await buildFoundations();
    step = 'basics'; await buildBasics();
    step = 'containers'; await buildContainers();
    step = 'navigation'; await buildNavigation();
    step = 'finance'; await buildFinance();
    step = 'proof screens'; await buildProof();
    step = 'audit'; await auditFile();
    step = 'order pages';
    PAGE_NAMES.forEach((n, i) => { const p = figma.root.children.find(x => x.name === n); if (p) figma.root.insertChild(i, p); });
    let comps = 0;
    for (const n of PAGE_NAMES) { const p = figma.root.children.find(x => x.name === n); if (p) { await p.loadAsync(); comps += p.findAllWithCriteria({ types: ['COMPONENT_SET'] }).length; } }
    log.push(`component sets: ${comps}`);
    log.push(unbound.size ? `spacing not bound to a token: ${[...unbound].join(', ')}` : 'spacing: every padding and gap bound to a semantic token');
    if (REVIEW) { step = 'review export'; await exportBoards(); }
    const cover = figma.root.children.find(x => x.name === 'Cover'); if (cover) await figma.setCurrentPageAsync(cover);
    for (const pg of figma.root.children.filter(x => x.name === 'Page 1')) { await pg.loadAsync(); if (pg.children.length === 0 && figma.currentPage !== pg) { pg.remove(); log.push('removed empty Page 1'); } }
    report(true, 'All steps finished.');
  } catch (e) {
    report(false, `Step: ${step}\n${e && e.message ? e.message : String(e)}\n${e && e.stack ? e.stack.split('\n').slice(0, 6).join('\n') : ''}`);
  }
})();
