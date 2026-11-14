/* Fieldline — figure kit: captioned figures, step-through animated explanations, live schematics, field lines, FBDs, graphs. */
'use strict';
const K = 'var(--ink)', OR = 'var(--acc)', BL = 'var(--acc2)', RD = 'var(--bad)', MU = 'var(--muted)', GR = '#1E8A55', PA = 'var(--panel)';
const FIG = (svg, cap) => `<figure class="fig"><div class="fb">${svg}</div>${cap ? `<figcaption><span class="fn"></span>${cap}</figcaption>` : ''}</figure>`;
const SVG = (w, h, inner, extra = '') => `<svg viewBox="0 0 ${w} ${h}" width="${w}" xmlns="http://www.w3.org/2000/svg" ${extra}>${inner}</svg>`;
const ln = (x1, y1, x2, y2, col = K, w = 2, x = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:${col};stroke-width:${w};stroke-linecap:round" ${x}/>`;
const svgSub = s => String(s).replace(/([A-Za-zθφτωΦ0-9′])_\{?([A-Za-z0-9,∞]+)\}?/g, '$1<tspan baseline-shift="sub" font-size="72%">$2</tspan>');
const tx = (x, y, s, o = {}) => (s = svgSub(s), `<text x="${x}" y="${y}" text-anchor="${o.a || 'middle'}" style="fill:${o.c || K};font:${o.it ? 'italic ' : ''}${o.w || 400} ${o.s || 16}px ${o.f || 'Source Serif 4, Georgia, serif'}" ${o.x || ''}>${s}</text>`);
const arr = (x1, y1, x2, y2, col = K, w = 2.4, lab, lo = {}) => { const a = Math.atan2(y2 - y1, x2 - x1), hl = 11 + w * 1.5, hw = 5 + w; const bx = x2 - hl * Math.cos(a), by = y2 - hl * Math.sin(a); let s = ln(x1, y1, bx, by, col, w, lo.x || '') + `<polygon points="${x2},${y2} ${bx - hw * Math.sin(a)},${by + hw * Math.cos(a)} ${bx + hw * Math.sin(a)},${by - hw * Math.cos(a)}" style="fill:${col}" ${lo.x || ''}/>`; if (lab) { const d = lo.d ?? 16, lx = x2 + d * Math.cos(a + (lo.side ?? 0)), ly = y2 + d * Math.sin(a + (lo.side ?? 0)) + 5; s += tx(lo.lx ?? lx, lo.ly ?? ly, lab, { c: col, it: true, s: lo.s || 17, w: 600 }); } return s; };
const circ = (x, y, r, fill = PA, col = K, w = 2) => `<circle cx="${x}" cy="${y}" r="${r}" style="fill:${fill};stroke:${col};stroke-width:${w}"/>`;
const pth = (d, col = K, w = 2, fill = 'none', x = '') => `<path d="${d}" style="fill:${fill};stroke:${col};stroke-width:${w};stroke-linejoin:round;stroke-linecap:round" ${x}/>`;

/* step-through figure: frames = [[svg, text], …] */
let SFID = 0;
const STEPFIG = (title, frames) => { const id = 'sf' + (++SFID); return `<div class="stepfig" id="${id}"><div class="sfh"><span>▸ ${title}</span><span class="sfdots">${frames.map((_, k) => `<i class="${k ? '' : 'on'}"></i>`).join('')}</span></div><div class="sfstage">${frames.map((f, k) => `<div class="sfr ${k ? '' : 'on'}">${f[0]}</div>`).join('')}</div><div class="sft">${frames[0][1]}</div><div class="pnav" style="padding:0 12px 12px;margin:0"><button class="btn sm sfp">← back</button><button class="btn sm sfa">▶ play all</button><button class="btn pri sm sfn">next step →</button></div><script type="text/plain" class="sfdata">${encodeURIComponent(JSON.stringify(frames.map(f => f[1])))}</script></div>`; };
function initFigs(root) { $$('.stepfig', root).forEach(el => { const txt = JSON.parse(decodeURIComponent($('.sfdata', el).textContent)); const fr = $$('.sfr', el), dots = $$('.sfdots i', el); let k = 0, timer = null;
  const show = n => { k = Math.max(0, Math.min(fr.length - 1, n)); fr.forEach((f, i) => f.classList.toggle('on', i === k)); dots.forEach((d, i) => d.classList.toggle('on', i <= k)); $('.sft', el).innerHTML = txt[k]; $('.sfn', el).disabled = k === fr.length - 1; $('.sfp', el).disabled = k === 0; };
  $('.sfn', el).onclick = () => { clearInterval(timer); show(k + 1); }; $('.sfp', el).onclick = () => { clearInterval(timer); show(k - 1); };
  $('.sfa', el).onclick = () => { clearInterval(timer); show(0); timer = setInterval(() => { if (!el.isConnected || k >= fr.length - 1) return clearInterval(timer); show(k + 1); }, 2600); }; show(0); }); }

/* live schematic: solves the circuit (circuitEngine) and animates current along every branch */
function SCH(def, o = {}) {
  const E = circuitEngine(def); E.step(0); const cell = o.cell || 70, xs = Object.values(def.nodes).map(p => p[0]), ys = Object.values(def.nodes).map(p => p[1]);
  const x0 = Math.min(...xs) - .9, y0 = Math.min(...ys) - .7, W = (Math.max(...xs) - x0 + .9) * cell, H = (Math.max(...ys) - y0 + .8) * cell; const P = n => [(def.nodes[n][0] - x0) * cell, (def.nodes[n][1] - y0) * cell];
  const imax = Math.max(1e-9, ...E.els.map(e => Math.abs(e.i))); let s = '', fl = '', lb = '';
  E.els.forEach(e => { const [x1, y1] = P(e.a), [x2, y2] = P(e.b), L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI, mx = (x1 + x2) / 2, my = (y1 + y2) / 2, hf = 22;
    const lead = g => ln(-L / 2, 0, -g, 0, K, 2.4) + ln(g, 0, L / 2, 0, K, 2.4);
    let sym = '';
    if (e.t === 'w') sym = ln(-L / 2, 0, L / 2, 0, K, 2.4);
    else if (e.t === 'R') sym = lead(hf) + pth(`M${-hf} 0 ${[0, 1, 2, 3, 4, 5].map(k => `L${-hf + (k + .5) * hf / 3} ${k % 2 ? 8 : -8}`).join(' ')} L${hf} 0`, K, 2.4);
    else if (e.t === 'V') sym = lead(6) + ln(-6, -16, -6, 16, K, 2.6) + ln(6, -9, 6, 9, K, 5) + `<g transform="rotate(${-a} 0 0)">${tx(Math.abs(Math.sin(a * Math.PI / 180)) > .5 ? 18 : 12, Math.abs(Math.sin(a * Math.PI / 180)) > .5 ? -16 * Math.sign(Math.sin(a * Math.PI / 180)) + 5 : -18, '+', { w: 700, s: 15, f: 'IBM Plex Mono' })}</g>`;
    else if (e.t === 'I') sym = lead(16) + circ(0, 0, 16) + arr(-9, 0, 10, 0, K, 2);
    else if (e.t === 'C') sym = lead(5) + ln(-5, -14, -5, 14, K, 3.2) + ln(5, -14, 5, 14, K, 3.2);
    else if (e.t === 'L') sym = lead(hf) + pth(`M${-hf} 0 ` + [0, 1, 2, 3].map(k => `A${hf / 4} ${hf / 4} 0 0 1 ${-hf + (k + 1) * hf / 2} 0`).join(' '), K, 2.4);
    else if (e.t === 'S') sym = lead(15) + `<circle cx="-15" cy="0" r="3" style="fill:${K}"/><circle cx="15" cy="0" r="3" style="fill:${K}"/>` + ln(-15, 0, e.v ? 15 : 10, e.v ? 0 : -15, K, 2.6);
    else if (e.t === 'B') sym = lead(14) + circ(0, 0, 14, Math.abs(e.i) > imax * .05 ? '#FFE48A' : PA) + ln(-9, -9, 9, 9) + ln(-9, 9, 9, -9);
    s += `<g transform="translate(${mx} ${my}) rotate(${a})">${sym}</g>`;
    if (Math.abs(e.i) > imax * 1e-3 && e.t !== 'C' && !(e.t === 'S' && !e.v)) { const sp = (1.6 * imax / Math.abs(e.i)).toFixed(2); fl += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="flow ${e.i < 0 ? 'rev' : ''}" style="--sp:${Math.min(sp, 6)}s;stroke:#F2B32A;stroke-width:5"/>`; }
    if (o.labels !== false && e.t !== 'w') { const vert = Math.abs(x2 - x1) < Math.abs(y2 - y1); const val = { R: SI(e.v, 'Ω'), V: SI(e.v, 'V'), I: SI(e.v, 'A'), C: SI(e.v, 'F'), L: SI(e.v, 'H'), B: e.n, S: e.n }[e.t]; const lx = vert ? mx + (mx > W / 2 ? -30 : 30) : mx, ly = vert ? my + 5 : my + (my > H / 2 ? 34 : -22); const anc = vert ? (mx > W / 2 ? 'end' : 'start') : 'middle';
      lb += tx(lx, ly, `<tspan style="font-weight:700">${e.n}</tspan>${e.t === 'B' || e.t === 'S' ? '' : ' = ' + val}`, { a: anc, s: 14, f: 'IBM Plex Sans Condensed, sans-serif' }); if (o.currents) lb += tx(lx, ly + 16, `${o.currents === 'v' ? SI(Math.abs(E.nodeV[e.a] - E.nodeV[e.b]), 'V') : SI(Math.abs(e.i), 'A')}`, { a: anc, s: 13, c: o.currents === 'v' ? BL : '#C2541B', f: 'IBM Plex Mono' }); } });
  E.ids.forEach(n => { const [x, y] = P(n), dg = E.els.filter(e => e.a === n || e.b === n).length; if (dg > 2) s += `<circle cx="${x}" cy="${y}" r="4.5" style="fill:${K}"/>`; if (o.nodeLabels && o.nodeLabels[n]) s += tx(x + (o.nodeLabels[n][1] || 0), y + (o.nodeLabels[n][2] || -12), o.nodeLabels[n][0], { c: BL, w: 700, it: true, s: 16 }); if (n === def.ground && o.ground !== false) s += ln(x, y, x, y + 12) + ln(x - 11, y + 12, x + 11, y + 12) + ln(x - 7, y + 17, x + 7, y + 17) + ln(x - 3, y + 22, x + 3, y + 22); });
  return SVG(Math.round(W), Math.round(H), fl + s + lb + (o.extra || ''), `style="max-width:${Math.round(W)}px"`);
}

/* electric field lines (numerical streamlines) + optional equipotentials */
function fieldFig(Q, o = {}) { const W = o.w || 520, H = o.h || 320, E = (x, y) => { let ex = 0, ey = 0; for (const q of Q) { const dx = x - q.x, dy = y - q.y, r2 = dx * dx + dy * dy + 30, r = Math.sqrt(r2); ex += q.q * dx / (r2 * r); ey += q.q * dy / (r2 * r); } return [ex, ey]; };
  const V = (x, y) => Q.reduce((s, q) => s + q.q / Math.sqrt((x - q.x) ** 2 + (y - q.y) ** 2 + 30), 0);
  let s = ''; const src = Q.some(q => q.q > 0) ? Q.filter(q => q.q > 0) : Q; const n = o.n || 16;
  if (o.equi) { const lv = o.equi;
    const step = 6, cols = Math.ceil(W / step) + 1, rows = Math.ceil(H / step) + 1, F = []; for (let j = 0; j < rows; j++) { F.push([]); for (let i = 0; i < cols; i++) F[j].push(V(i * step, j * step)); }
    lv.forEach(v0 => { let d = ''; for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) { const c = [F[j][i], F[j][i + 1], F[j + 1][i + 1], F[j + 1][i]], P0 = [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]], pts = []; for (let e = 0; e < 4; e++) { const a = c[e], b = c[(e + 1) % 4]; if ((a - v0) * (b - v0) < 0) { const t = (v0 - a) / (b - a), A = P0[e], B = P0[(e + 1) % 4]; pts.push([(A[0] + (B[0] - A[0]) * t) * step, (A[1] + (B[1] - A[1]) * t) * step]); } } if (pts.length >= 2) d += `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}L${pts[1][0].toFixed(1)} ${pts[1][1].toFixed(1)}`; } s += pth(d, BL, 1.3, 'none', 'stroke-dasharray="5 4" opacity=".75"'); }); }
  src.forEach(q => { for (let k = 0; k < n; k++) { const th = 2 * Math.PI * (k + .5) / n; let x = q.x + 14 * Math.cos(th), y = q.y + 14 * Math.sin(th); const dir = q.q > 0 ? 1 : -1; let d = `M${x.toFixed(1)} ${y.toFixed(1)}`, mid = null, len = 0; for (let st = 0; st < 900; st++) { const [ex, ey] = E(x, y), m = Math.hypot(ex, ey) || 1e-9; const nx = x + dir * 3 * ex / m, ny = y + dir * 3 * ey / m; len += 3; if (len > 60 && !mid) mid = [x, y, nx, ny]; x = nx; y = ny; d += `L${x.toFixed(1)} ${y.toFixed(1)}`; if (x < -20 || x > W + 20 || y < -20 || y > H + 20) break; if (Q.some(p => p !== q && Math.hypot(x - p.x, y - p.y) < 12)) break; } s += pth(d, K, 1.4, 'none', 'opacity=".8"'); if (mid) { const [x1, y1, x2, y2] = dir > 0 ? mid : [mid[2], mid[3], mid[0], mid[1]]; const a = Math.atan2(y2 - y1, x2 - x1); s += `<polygon points="${x2 + 6 * Math.cos(a)},${y2 + 6 * Math.sin(a)} ${x2 - 5 * Math.cos(a) - 4 * Math.sin(a)},${y2 - 5 * Math.sin(a) + 4 * Math.cos(a)} ${x2 - 5 * Math.cos(a) + 4 * Math.sin(a)},${y2 - 5 * Math.sin(a) - 4 * Math.cos(a)}" style="fill:${K}"/>`; } } });
  Q.forEach(q => { s += circ(q.x, q.y, 13, q.q > 0 ? '#E8742C' : '#2E6BE6', K, 2) + tx(q.x, q.y + 6, q.q > 0 ? '+' : '−', { c: '#fff', w: 700, s: 20, f: 'IBM Plex Mono' }); });
  return SVG(W, H, s, `style="max-width:${W}px"`); }

/* simple x–y plot */
function plotFig(fns, o = {}) { const W = o.w || 520, H = o.h || 260, m = { l: 48, r: 16, t: 16, b: 38 }, [xa, xb] = o.x, [ya, yb] = o.y, X = x => m.l + (x - xa) / (xb - xa) * (W - m.l - m.r), Y = y => H - m.b - (y - ya) / (yb - ya) * (H - m.t - m.b); let s = '';
  (o.gx || []).forEach(v => s += ln(X(v), Y(ya), X(v), Y(yb), 'var(--line)', 1) + tx(X(v), H - m.b + 18, o.gxl ? o.gxl(v) : v, { s: 13, c: MU }));
  (o.gy || []).forEach(v => s += ln(X(xa), Y(v), X(xb), Y(v), 'var(--line)', 1) + tx(m.l - 8, Y(v) + 5, o.gyl ? o.gyl(v) : v, { s: 13, c: MU, a: 'end' }));
  s += arr(X(xa), Y(Math.max(ya, 0)), X(xb) + 6, Y(Math.max(ya, 0)), K, 1.6) + arr(X(xa), Y(ya), X(xa), Y(yb) - 6, K, 1.6) + tx(X(xb) - 4, Y(Math.max(ya, 0)) + 30, o.xl || 't', { it: true, s: 16, a: 'end' }) + tx(X(xa) + 10, Y(yb) + 6, o.yl || '', { it: true, s: 16, a: 'start' });
  (o.fill || []).forEach(f => { let d = `M${X(f.a)} ${Y(0)}`; for (let k = 0; k <= 80; k++) { const x = f.a + (f.b - f.a) * k / 80; d += `L${X(x).toFixed(1)} ${Y(f.f(x)).toFixed(1)}`; } d += `L${X(f.b)} ${Y(0)}Z`; s += pth(d, 'none', 0, f.c || 'rgba(232,116,44,.18)'); });
  fns.forEach(f => { let d = ''; for (let k = 0; k <= 200; k++) { const x = xa + (xb - xa) * k / 200, y = f.f(x); if (!isFinite(y)) continue; d += `${d ? 'L' : 'M'}${X(x).toFixed(1)} ${Y(Math.max(ya - 1e9, Math.min(yb + 1e9, y))).toFixed(1)}`; } s += pth(d, f.c || OR, f.w || 2.6, 'none', f.dash ? `stroke-dasharray="${f.dash}"` : (o.draw ? 'class="draw"' : '')); if (f.lab) s += tx(X(f.lab[0]), Y(f.lab[1]), f.lab[2], { c: f.c || OR, it: true, w: 600, s: 15, a: 'start' }); });
  (o.marks || []).forEach(p => s += `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="4.5" style="fill:${p[3] || K}"/>` + (p[2] ? tx(X(p[0]) + (p[4] || 8), Y(p[1]) - 8, p[2], { s: 14, a: 'start', c: p[3] || K }) : ''));
  (o.vlines || []).forEach(v => s += ln(X(v[0]), Y(ya), X(v[0]), Y(v[1]), MU, 1.2, 'stroke-dasharray="4 4"'));
  return SVG(W, H, s, `style="max-width:${W}px"`); }

/* block on an incline / FBD helper. forces: [angleDeg (math, y up), length, label, color] */
function fbdFig(o = {}) { const W = o.w || 520, H = o.h || 300; let s = ''; const th = (o.incline || 0) * Math.PI / 180, cx = o.cx || W / 2, cy = o.cy || H / 2 + 20;
  if (o.incline != null && o.ground !== false) { const Cx = cx + 22 * Math.sin(th), Cy = cy + 22 * Math.cos(th), Ax = Cx - 210 * Math.cos(th), Ay = Cy + 210 * Math.sin(th), Bx = Cx + 190 * Math.cos(th), By = Cy - 190 * Math.sin(th);
    s += pth(`M${Ax} ${Ay} L${Bx} ${By} L${Bx} ${Ay} Z`, K, 2, 'var(--panel2)'); if (o.incline) s += pth(`M${Ax + 55} ${Ay} A55 55 0 0 0 ${Ax + 55 * Math.cos(th)} ${Ay - 55 * Math.sin(th)}`, K, 1.5) + tx(Ax + 72, Ay - 8, 'θ', { it: true }); }
  if (o.block !== false) s += `<g transform="translate(${cx} ${cy}) rotate(${-o.incline || 0})"><rect x="-34" y="-22" width="68" height="44" rx="3" style="fill:${o.dim ? 'var(--panel2)' : '#F6D9C2'};stroke:${K};stroke-width:2"/>${o.m ? tx(0, 6, o.m, { it: true, w: 600 }) : ''}</g>`;
  if (o.dot) s += `<circle cx="${cx}" cy="${cy}" r="5" style="fill:${K}"/>`;
  (o.forces || []).forEach(f => { const a = f[0] * Math.PI / 180; s += arr(cx, cy, cx + f[1] * Math.cos(a), cy - f[1] * Math.sin(a), f[3] || OR, 3, f[2], { d: 20, s: 18 }); });
  (o.axes || []).forEach(ax => { const a = ax[0] * Math.PI / 180; s += arr(cx, cy, cx + 90 * Math.cos(a), cy - 90 * Math.sin(a), MU, 1.4, ax[1], { d: 14, s: 15, x: 'stroke-dasharray="5 4"' }); });
  return SVG(W, H, s + (o.extra || ''), `style="max-width:${W}px"`); }

/* inject figures and labs into existing sections */
const addFig = (chId, sec, html, where = 'p1') => { const c = chById(chId); if (!c) return; const L = c.learn.find(l => l.sec === sec || (l.sec || '').startsWith(sec)); if (!L) return; if (where === 'start') L.body = html + L.body; else if (where === 'end') L.body += html; else { const k = L.body.indexOf('</p>'); L.body = k < 0 ? html + L.body : L.body.slice(0, k + 4) + html + L.body.slice(k + 4); } };
const addLab = (chId, sec, viz, vizOpts, first) => { const c = chById(chId); if (!c) return; const L = c.learn.find(l => (l.sec || '').startsWith(sec)); if (!L) return; if (!L.viz) { L.viz = viz; L.vizOpts = vizOpts; } else if (first) { (L.more = L.more || []).unshift([L.viz, L.vizOpts]); L.viz = viz; L.vizOpts = vizOpts; } else (L.more = L.more || []).push([viz, vizOpts]); };

/* typeset x_sub and x^{sup} in lesson text (text nodes only; skips code, svg, inputs) */
function typeset(root) { const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('pre,code,svg,script,textarea,input,.sfdata,button') ? NodeFilter.FILTER_REJECT : /[_^]/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT });
  const list = []; while (w.nextNode()) list.push(w.currentNode);
  list.forEach(n => { const e = s => s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); let h = e(n.nodeValue);
    h = h.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>').replace(/\^\(([^)]+)\)/g, '<sup>$1</sup>').replace(/\^([−\-]?[A-Za-z0-9.]+)/g, '<sup>$1</sup>')
      .replace(/([A-Za-zΑ-ωθφτμεσωΦ0-9)′*])_\{([^}]+)\}/g, '$1<sub>$2</sub>').replace(/([A-Za-zΑ-ωθφτμεσωΦ0-9)′*])_([A-Za-z0-9∞⁺]+)/g, '$1<sub>$2</sub>');
    if (h !== e(n.nodeValue)) { const sp = document.createElement('span'); sp.innerHTML = h; n.replaceWith(sp); } }); }
