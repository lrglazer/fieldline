/* Fieldline — circuit lab: modified nodal analysis with animated current, KCL inspector and KVL loop walks. */
'use strict';
const SI = (x, u) => { if (!isFinite(x)) return '∞ ' + u; const a = Math.abs(x); if (a < 1e-12) return '0 ' + u; const P = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'μ'], [1e-9, 'n']]; for (const [m, p] of P) if (a >= m * .9995) return `${+(x / m).toPrecision(3)} ${p}${u}`; return `${+(x / 1e-9).toPrecision(3)} n${u}`; };

function solveLin(A, b) { const n = b.length; for (let c = 0; c < n; c++) { let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r; [A[c], A[p]] = [A[p], A[c]];[b[c], b[p]] = [b[p], b[c]]; const d = A[c][c] || 1e-30; for (let r = c + 1; r < n; r++) { const f = A[r][c] / d; if (!f) continue; for (let k = c; k < n; k++) A[r][k] -= f * A[c][k]; b[r] -= f * b[c]; } } const x = Array(n).fill(0); for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k]; x[r] = s / (A[r][r] || 1e-30); } return x; }

/* presets: nodes on a 9 × 5 grid; element a → b. V: a = −, b = +. I: pushes current a → b. */
const CIRCUITS = {
  ohm: { name: 'Ohm\'s law', note: 'One source, one resistor. Drag R or V and watch the current (the dots) respond: I = V/R.',
    nodes: { A: [1, 4], B: [1, 1], C: [7, 1], D: [7, 4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 9], ['w', 'w', 'B', 'C'], ['R1', 'R', 'C', 'D', 1000], ['w', 'w', 'D', 'A']], loops: [['Loop', ['A', 'B', 'C', 'D', 'A']]] },
  series: { name: 'Series & KVL', note: 'Three resistors in series share ONE current. Walk the loop: the drops across R1, R2, R3 add up to exactly the 12 V the battery gives.',
    nodes: { A: [1, 4], B: [1, 1], C: [4, 1], D: [7, 1], E: [7, 4], F: [4, 4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 12], ['R1', 'R', 'B', 'C', 1000], ['w', 'w', 'C', 'D'], ['R2', 'R', 'D', 'E', 2000], ['R3', 'R', 'E', 'F', 3000], ['w', 'w', 'F', 'A']], loops: [['Main loop', ['A', 'B', 'C', 'D', 'E', 'F', 'A']]] },
  parallel: { name: 'Parallel & KCL', note: 'Three branches share the same voltage. Tap the top rail: current in from the battery = the sum of the three branch currents out.',
    nodes: { A: [1, 4], B: [1, 1], C: [3, 1], D: [5, 1], E: [7, 1], F: [3, 4], G: [5, 4], H: [7, 4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 9], ['w', 'w', 'B', 'C'], ['w', 'w', 'C', 'D'], ['w', 'w', 'D', 'E'], ['R1', 'R', 'C', 'F', 1000], ['R2', 'R', 'D', 'G', 2000], ['R3', 'R', 'E', 'H', 4500], ['w', 'w', 'H', 'G'], ['w', 'w', 'G', 'F'], ['w', 'w', 'F', 'A']],
    loops: [['Loop through R1', ['A', 'B', 'C', 'F', 'A']], ['Loop R1 → R2', ['F', 'C', 'D', 'G', 'F']]], kcl: 'C' },
  twoloop: { name: 'Two sources (KCL + KVL)', note: 'The classic exam circuit. Tap the middle node for KCL, then walk each window for KVL. Swap V2 above V1 and watch R2\'s current reverse.',
    nodes: { A: [1, 4], B: [1, 1], C: [4, 1], D: [4, 4], E: [7.6, 1], H: [7.6, 4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 10], ['R1', 'R', 'B', 'C', 2000], ['R2', 'R', 'C', 'D', 4000], ['R3', 'R', 'E', 'C', 1000], ['V2', 'V', 'H', 'E', 5], ['w', 'w', 'D', 'A'], ['w', 'w', 'H', 'D']],
    loops: [['Left window', ['A', 'B', 'C', 'D', 'A']], ['Right window', ['D', 'C', 'E', 'H', 'D']], ['Outer loop', ['A', 'B', 'C', 'E', 'H', 'D', 'A']]], kcl: 'C' },
  divider: { name: 'Voltage divider + load', note: 'V_out = V·R2/(R1 + R2) only with nothing attached. Close the switch to add a load and watch V_out sag: the load is in parallel with R2.',
    nodes: { A: [1, 4], B: [1, 1], C: [4, 1], O: [4, 2.5], F: [4, 4], G: [5.6, 2.5], J: [7.2, 2.5], K: [7.2, 4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 12], ['w', 'w', 'B', 'C'], ['R1', 'R', 'C', 'O', 1000], ['R2', 'R', 'O', 'F', 1000], ['w', 'w', 'F', 'A'], ['w', 'w', 'O', 'G'], ['S1', 'S', 'G', 'J', 0], ['RL', 'R', 'J', 'K', 1000], ['w', 'w', 'K', 'F']], loops: [['Divider loop', ['A', 'B', 'C', 'O', 'F', 'A']]], kcl: 'O', probe: 'O' },
  bridge: { name: 'Wheatstone bridge', note: 'When R1/R3 = R2/R4 the bridge is balanced: both middle nodes sit at the same voltage and NO current crosses R5. Drag R4 to find balance.',
    nodes: { A: [1, 4.4], B: [1, .6], P: [4.5, .6], L: [2.8, 2.5], R: [6.2, 2.5], Q: [4.5, 4.4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 10], ['w', 'w', 'B', 'P'], ['R1', 'R', 'P', 'L', 1000], ['R2', 'R', 'P', 'R', 2000], ['R3', 'R', 'L', 'Q', 1000], ['R4', 'R', 'R', 'Q', 1500], ['R5', 'R', 'L', 'R', 500], ['w', 'w', 'Q', 'A']], loops: [['Left half', ['Q', 'A', 'B', 'P', 'L', 'Q']], ['Bridge loop', ['P', 'L', 'R', 'P']]], kcl: 'L' },
  bulbs: { name: 'Bulb brightness', note: 'B1 carries ALL the current, so it\'s brightest. Open S1: the total resistance goes up, B1 dims and B2 gets brighter. A classic conceptual question.',
    nodes: { A: [1, 4], B: [1, 1], C: [3.5, 1], D: [5, 1], E: [7.5, 1], F: [5, 4], G: [7.5, 2.5], H: [7.5, 4] }, ground: 'A',
    els: [['V1', 'V', 'A', 'B', 12], ['B1', 'B', 'B', 'C', 10], ['w', 'w', 'C', 'D'], ['B2', 'B', 'D', 'F', 10], ['w', 'w', 'D', 'E'], ['S1', 'S', 'E', 'G', 1], ['B3', 'B', 'G', 'H', 10], ['w', 'w', 'H', 'F'], ['w', 'w', 'F', 'A']], loops: [['Loop through B2', ['A', 'B', 'C', 'D', 'F', 'A']]], kcl: 'D' },
  rc: { name: 'RC charging', note: 'Close S1: the capacitor charges with τ = RC = 1 s (63% after one τ, ~99% after 5τ). Current is biggest at t = 0 and dies away. Then close S2 to discharge it.',
    nodes: { A: [1, 4], B: [1, 1], C: [2.6, 1], D: [5.4, 1], E: [5.4, 4], G: [7.6, 1], J: [7.6, 2.5], K: [7.6, 4] }, ground: 'A', dt: 1,
    els: [['V1', 'V', 'A', 'B', 10], ['S1', 'S', 'B', 'C', 0], ['R1', 'R', 'C', 'D', 10000], ['C1', 'C', 'D', 'E', 100e-6], ['w', 'w', 'E', 'A'], ['w', 'w', 'D', 'G'], ['S2', 'S', 'G', 'J', 0], ['R2', 'R', 'J', 'K', 5000], ['w', 'w', 'K', 'E']], loops: [['Charging loop', ['A', 'B', 'C', 'D', 'E', 'A']]], scope: ['C1', 'R1'] },
  rl: { name: 'RL current build-up', note: 'An inductor fights changes in current. Close S1: the current ramps up with τ = L/R = 10 ms (shown slowed down 100×). At t = 0 the inductor acts like an open circuit; at t = ∞, like a wire.',
    nodes: { A: [1, 4], B: [1, 1], C: [2.6, 1], D: [5.4, 1], E: [5.4, 4], G: [7.6, 1], K: [7.6, 4] }, ground: 'A', dt: .01,
    els: [['V1', 'V', 'A', 'B', 10], ['S1', 'S', 'B', 'C', 0], ['R1', 'R', 'C', 'D', 100], ['L1', 'L', 'D', 'E', 1], ['w', 'w', 'E', 'A'], ['w', 'w', 'D', 'G'], ['R2', 'R', 'G', 'K', 2000], ['w', 'w', 'K', 'E']], loops: [['Loop', ['A', 'B', 'C', 'D', 'E', 'A']]], scope: ['L1', 'R1'] },
  isrc: { name: 'Current source & divider', note: 'A current source forces 6 mA no matter what. It splits between the branches in INVERSE proportion to resistance: the smaller R gets more current.',
    nodes: { A: [1, 4], B: [1, 1], C: [4, 1], D: [7, 1], F: [4, 4], G: [7, 4] }, ground: 'A',
    els: [['I1', 'I', 'A', 'B', .006], ['w', 'w', 'B', 'C'], ['w', 'w', 'C', 'D'], ['R1', 'R', 'C', 'F', 1000], ['R2', 'R', 'D', 'G', 2000], ['w', 'w', 'G', 'F'], ['w', 'w', 'F', 'A']], loops: [['Window', ['F', 'C', 'D', 'G', 'F']]], kcl: 'C' },
};

function circuitEngine(def) {
  const ids = Object.keys(def.nodes);
  const els = def.els.map(([n, t, a, b, v], k) => ({ n: t === 'w' ? 'w' + k : n, t, a, b, v: v ?? 0, i: 0, vp: 0, ip: 0 }));
  // electrical nets: nodes joined by wires
  const par = {}; ids.forEach(i => par[i] = i); const f = x => par[x] === x ? x : (par[x] = f(par[x]));
  els.filter(e => e.t === 'w').forEach(e => par[f(e.a)] = f(e.b));
  const net = {}; ids.forEach(i => net[i] = f(i));
  const nodeV = {}; let t = 0;
  const step = dt => {
    const unk = ids.filter(i => i !== def.ground), ix = {}; unk.forEach((u, k) => ix[u] = k);
    const vs = els.filter(e => e.t === 'V'), N = unk.length + vs.length; const A = Array.from({ length: N }, () => Array(N).fill(0)), b = Array(N).fill(0);
    const G = (a, c, g) => { const p = ix[a], q = ix[c]; if (p != null) A[p][p] += g; if (q != null) A[q][q] += g; if (p != null && q != null) { A[p][q] -= g; A[q][p] -= g; } };
    const J = (a, c, I) => { if (ix[a] != null) b[ix[a]] -= I; if (ix[c] != null) b[ix[c]] += I; }; // current I leaving a, entering c
    unk.forEach(u => A[ix[u]][ix[u]] += 1e-9);
    els.forEach(e => { if (e.t === 'w') G(e.a, e.b, 1e4); else if (e.t === 'R' || e.t === 'B') G(e.a, e.b, 1 / Math.max(e.v, 1e-6)); else if (e.t === 'S') { if (e.v) G(e.a, e.b, 1e4); }
      else if (e.t === 'I') J(e.a, e.b, e.v);
      else if (e.t === 'C') { if (dt) { const g = e.v / dt; G(e.a, e.b, g); J(e.a, e.b, -g * e.vp); } else G(e.a, e.b, 1e-9); }
      else if (e.t === 'L') { if (dt) { const g = dt / e.v; G(e.a, e.b, g); J(e.a, e.b, e.ip); } else G(e.a, e.b, 1e4); } });
    vs.forEach((e, k) => { const r = unk.length + k; if (ix[e.a] != null) { A[ix[e.a]][r] += 1; A[r][ix[e.a]] -= 1; } if (ix[e.b] != null) { A[ix[e.b]][r] -= 1; A[r][ix[e.b]] += 1; } b[r] = e.v; });
    const x = solveLin(A, b); ids.forEach(i => nodeV[i] = i === def.ground ? 0 : x[ix[i]]);
    const vab = e => nodeV[e.a] - nodeV[e.b];
    els.forEach(e => { const v = vab(e); if (e.t === 'w') e.i = v * 1e4; else if (e.t === 'R' || e.t === 'B') e.i = v / Math.max(e.v, 1e-6); else if (e.t === 'S') e.i = e.v ? v * 1e4 : 0; else if (e.t === 'I') e.i = e.v;
      else if (e.t === 'C') { e.i = dt ? e.v / dt * (v - e.vp) : 0; e.vp = v; } else if (e.t === 'L') { e.i = dt ? e.ip + dt / e.v * v : v * 1e4; e.ip = e.i; } });
    vs.forEach((e, k) => e.i = x[unk.length + k]);
    t += dt || 0;
  };
  const reset = () => { els.forEach(e => { e.vp = 0; e.ip = 0; e.i = 0; }); t = 0; };
  return { ids, els, net, nodeV, step, reset, get t() { return t; } };
}

VIZ.push({ id: 'circuit', icon: '⚡', title: 'Circuit lab', color: '#E8742C', blurb: 'Live circuits with moving current. Tap a node for KCL, walk a loop for KVL, flip switches, drag values, and watch RC and RL circuits charge on a scope.',
  mount(box, opts = {}) {
    const keys = opts.only || Object.keys(CIRCUITS); let key = opts.preset && CIRCUITS[opts.preset] ? opts.preset : keys[0];
    const bar = document.createElement('div'); bar.className = 'clbar'; box.appendChild(bar);
    const wrap = document.createElement('div'); wrap.className = 'clwrap'; box.appendChild(wrap);
    const left = document.createElement('div'); left.className = 'clstage'; wrap.appendChild(left);
    const { c, g, w, h } = canvasBox(left, 720, 420);
    const scope = document.createElement('canvas'); scope.width = 1440; scope.height = 260; scope.className = 'clscope'; left.appendChild(scope); const sg = scope.getContext('2d'); sg.scale(2, 2);
    const side = document.createElement('div'); side.className = 'clside'; wrap.appendChild(side);
    let E, def, sel = null, walk = null, phase = {}, raf, last = 0, hist = [], electron = false, labels = true;
    const cell = 80, ox = 0, oy = 10, P = n => [ox + def.nodes[n][0] * cell, oy + def.nodes[n][1] * cell];
    const load = k => { key = k; def = CIRCUITS[k]; E = circuitEngine(def); phase = {}; sel = def.kcl ? { node: def.kcl } : null; walk = null; hist = []; scope.style.display = def.scope ? 'block' : 'none'; E.step(def.dt ? def.dt / 400 : 0);
      bar.innerHTML = keys.map(x => `<button class="clp ${x === key ? 'on' : ''}" data-k="${x}">${CIRCUITS[x].name}</button>`).join(''); $$('.clp', bar).forEach(b => b.onclick = () => load(b.dataset.k)); panel(); };
    const vmax = () => Math.max(1, ...E.els.filter(e => e.t === 'V').map(e => Math.abs(e.v)), ...Object.values(E.nodeV).map(Math.abs));
    const vcol = v => { const s = Math.max(-1, Math.min(1, v / vmax())); return s >= 0 ? `rgb(${Math.round(120 - 90 * s)},${Math.round(130 + 40 * s)},${Math.round(140 - 40 * s)})` : `rgb(${Math.round(120 + 90 * -s)},${Math.round(130 - 70 * -s)},${Math.round(140 - 80 * -s)})`; };
    const sym = (e, x1, y1, x2, y2) => { // draw the component symbol between two points; returns nothing
      const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, half = 26;
      const ink = css('--ink');
      g.save(); g.translate(mx, my); g.rotate(a);
      const lead = (ga, gb) => { g.strokeStyle = gradFor(e, -L / 2, L / 2); g.lineWidth = 3; g.beginPath(); g.moveTo(-L / 2, 0); g.lineTo(-ga, 0); g.moveTo(gb, 0); g.lineTo(L / 2, 0); g.stroke(); };
      const gradFor = (el, xa, xb) => { const gr = g.createLinearGradient(xa, 0, xb, 0); gr.addColorStop(0, vcol(E.nodeV[el.a])); gr.addColorStop(1, vcol(E.nodeV[el.b])); return gr; };
      g.lineWidth = 2.5; g.strokeStyle = ink; g.fillStyle = css('--panel'); g.lineJoin = 'round';
      if (e.t === 'R') { lead(half, half); g.strokeStyle = gradFor(e, -half, half); g.lineWidth = 2.8; g.beginPath(); g.moveTo(-half, 0); for (let k = 0; k < 6; k++) g.lineTo(-half + (k + .5) * (2 * half / 6), (k % 2 ? 1 : -1) * 9); g.lineTo(half, 0); g.stroke(); }
      else if (e.t === 'V') { lead(7, 7); g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-7, -18); g.lineTo(-7, 18); g.stroke(); g.lineWidth = 5; g.beginPath(); g.moveTo(7, -10); g.lineTo(7, 10); g.stroke(); g.rotate(-a); g.fillStyle = css('--muted'); g.font = '700 13px IBM Plex Mono'; const pp = [Math.cos(a) * 20 - Math.sin(a) * 0, Math.sin(a) * 20]; g.fillText('+', pp[0] + (Math.abs(Math.sin(a)) > .5 ? 14 : -4), pp[1] + (Math.abs(Math.sin(a)) > .5 ? 4 : -14)); }
      else if (e.t === 'I') { lead(18, 18); g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-10, 0); g.lineTo(9, 0); g.stroke(); g.beginPath(); g.moveTo(10, 0); g.lineTo(3, -6); g.lineTo(3, 6); g.closePath(); g.fillStyle = ink; g.fill(); }
      else if (e.t === 'C') { lead(6, 6); g.strokeStyle = ink; g.lineWidth = 3.5; g.beginPath(); g.moveTo(-6, -16); g.lineTo(-6, 16); g.moveTo(6, -16); g.lineTo(6, 16); g.stroke(); const q = Math.max(-1, Math.min(1, (E.nodeV[e.a] - E.nodeV[e.b]) / vmax())); if (Math.abs(q) > .02) { g.fillStyle = `rgba(232,116,44,${Math.abs(q) * .35})`; g.fillRect(-5, -16, 10, 32); } }
      else if (e.t === 'L') { lead(half, half); g.strokeStyle = gradFor(e, -half, half); g.lineWidth = 2.8; g.beginPath(); for (let k = 0; k < 4; k++) g.arc(-half + (k + .5) * (half / 2), 0, half / 4, Math.PI, 0); g.stroke(); }
      else if (e.t === 'S') { lead(18, 18); g.fillStyle = ink; g.beginPath(); g.arc(-18, 0, 3.5, 0, 7); g.arc(18, 0, 3.5, 0, 7); g.fill(); g.strokeStyle = ink; g.lineWidth = 3; g.beginPath(); g.moveTo(-18, 0); g.lineTo(e.v ? 18 : 12, e.v ? 0 : -18); g.stroke(); }
      else if (e.t === 'B') { lead(16, 16); const p = Math.abs(e.i * e.i * e.v), pmax = Math.max(1e-9, ...E.els.filter(x => x.t === 'B').map(x => x.i * x.i * x.v)), br = Math.min(1, p / pmax) * Math.min(1, p / .5 + .15); if (br > .02) { const gl = g.createRadialGradient(0, 0, 2, 0, 0, 46); gl.addColorStop(0, `rgba(255,214,90,${.9 * br})`); gl.addColorStop(1, 'rgba(255,214,90,0)'); g.fillStyle = gl; g.beginPath(); g.arc(0, 0, 46, 0, 7); g.fill(); } g.fillStyle = br > .02 ? `rgba(255,228,140,${.4 + .6 * br})` : css('--panel'); g.strokeStyle = ink; g.lineWidth = 2.5; g.beginPath(); g.arc(0, 0, 16, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-11, -11); g.lineTo(11, 11); g.moveTo(-11, 11); g.lineTo(11, -11); g.stroke(); }
      g.restore();
    };
    const draw = now => {
      if (!c.isConnected) return; const dtR = Math.min(.05, (now - (last || now)) / 1000); last = now;
      if (def.dt) { const sub = 30, dt = dtR * def.dt / sub; for (let k = 0; k < sub; k++) E.step(dt); hist.push([E.t, ...def.scope.map(n => { const e = E.els.find(x => x.n === n); return [E.nodeV[e.a] - E.nodeV[e.b], e.i]; })]); if (hist.length > 600) hist.shift(); drawScope(); }
      g.clearRect(0, 0, w, h); g.fillStyle = css('--grid'); for (let x = 40; x < w; x += 40) for (let y = 30; y < h; y += 40) g.fillRect(x - 1, y - 1, 2, 2);
      const imax = Math.max(1e-6, ...E.els.map(e => Math.abs(e.i)));
      // highlight selected net / walk path
      if (sel && sel.node) { const nn = E.net[sel.node]; g.strokeStyle = 'rgba(232,116,44,.28)'; g.lineWidth = 14; g.lineCap = 'round'; E.els.filter(e => e.t === 'w' && E.net[e.a] === nn).forEach(e => { const [x1, y1] = P(e.a), [x2, y2] = P(e.b); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }); E.ids.filter(i => E.net[i] === nn).forEach(i => { const [x, y] = P(i); g.fillStyle = 'rgba(232,116,44,.28)'; g.beginPath(); g.arc(x, y, 9, 0, 7); g.fill(); }); }
      if (walk) { g.strokeStyle = 'rgba(46,107,230,.25)'; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); const path = walk.path; const [sx, sy] = P(path[0]); g.moveTo(sx, sy); for (let k = 1; k <= Math.min(walk.seg + 1, path.length - 1); k++) { const [x1, y1] = P(path[k - 1]), [x2, y2] = P(path[k]); const f = k === walk.seg + 1 ? walk.f : 1; g.lineTo(x1 + (x2 - x1) * f, y1 + (y2 - y1) * f); } g.stroke(); }
      E.els.forEach(e => { const [x1, y1] = P(e.a), [x2, y2] = P(e.b); if (e.t === 'w') { const gr = g.createLinearGradient(x1, y1, x2, y2); gr.addColorStop(0, vcol(E.nodeV[e.a])); gr.addColorStop(1, vcol(E.nodeV[e.b])); g.strokeStyle = gr; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } else sym(e, x1, y1, x2, y2);
        if (sel && sel.el === e.n) { g.strokeStyle = 'rgba(232,116,44,.6)'; g.lineWidth = 2; g.setLineDash([5, 4]); const mx = (x1 + x2) / 2, my = (y1 + y2) / 2; g.strokeRect(mx - 36, my - 36, 72, 72); g.setLineDash([]); } });
      // moving charge
      E.els.forEach(e => { if (Math.abs(e.i) < imax * 2e-3) return; const [x1, y1] = P(e.a), [x2, y2] = P(e.b), L = Math.hypot(x2 - x1, y2 - y1), sp = 18; const sgn = electron ? -1 : 1; const speed = sgn * e.i / imax * 70; phase[e.n] = ((phase[e.n] || 0) + speed * dtR) % sp; g.fillStyle = electron ? '#3D7BF0' : '#F2B32A'; for (let s = (phase[e.n] + sp) % sp; s < L; s += sp) { const fx = x1 + (x2 - x1) * s / L, fy = y1 + (y2 - y1) * s / L; g.beginPath(); g.arc(fx, fy, 3.2, 0, 7); g.fill(); } });
      // nodes
      E.ids.forEach(i => { const [x, y] = P(i); const deg = E.els.filter(e => e.a === i || e.b === i).length; if (deg > 2 || i === def.probe) { g.fillStyle = css('--ink'); g.beginPath(); g.arc(x, y, 4.5, 0, 7); g.fill(); } if (i === def.ground) { g.strokeStyle = css('--ink'); g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 14); g.moveTo(x - 12, y + 14); g.lineTo(x + 12, y + 14); g.moveTo(x - 7, y + 19); g.lineTo(x + 7, y + 19); g.moveTo(x - 3, y + 24); g.lineTo(x + 3, y + 24); g.stroke(); } });
      if (def.probe) { const [x, y] = P(def.probe); g.fillStyle = '#2E6BE6'; g.font = '700 13px IBM Plex Mono'; g.fillText(`V_out = ${SI(E.nodeV[def.probe], 'V')}`, x + 10, y - 8); }
      // labels
      if (labels) E.els.forEach(e => { if (e.t === 'w') return; const [x1, y1] = P(e.a), [x2, y2] = P(e.b), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, vert = Math.abs(x2 - x1) < Math.abs(y2 - y1); const val = e.t === 'R' || e.t === 'B' ? SI(e.v, 'Ω') : e.t === 'V' ? SI(e.v, 'V') : e.t === 'I' ? SI(e.v, 'A') : e.t === 'C' ? SI(e.v, 'F') : e.t === 'L' ? SI(e.v, 'H') : e.v ? 'closed' : 'open'; const right = vert && mx > w / 2, lx = vert ? mx + (right ? -26 : 30) : mx - 44, ly = vert ? my - 6 : my + (my > h / 2 ? 34 : -56); g.textAlign = right ? 'right' : 'left';
        g.fillStyle = css('--ink'); g.font = '700 17px "IBM Plex Sans Condensed", sans-serif'; g.fillText(`${e.n}  ${val}`, lx, ly); g.font = '600 14px "IBM Plex Mono", monospace'; g.fillStyle = '#C2541B'; if (e.t !== 'S' || e.v) g.fillText(`I = ${SI(Math.abs(e.i), 'A')}`, lx, ly + 18); if (e.t !== 'V' && e.t !== 'S') { g.fillStyle = '#2E6BE6'; g.fillText(`ΔV = ${SI(Math.abs(E.nodeV[e.a] - E.nodeV[e.b]), 'V')}`, lx, ly + 35); } g.textAlign = 'left'; });
      if (walk) stepWalk(dtR);
      raf = requestAnimationFrame(draw);
    };
    const drawScope = () => { const W = 720, H = 130; sg.clearRect(0, 0, W, H); sg.fillStyle = '#0E1A17'; sg.fillRect(0, 0, W, H); sg.strokeStyle = 'rgba(140,255,200,.12)'; sg.lineWidth = 1; for (let x = 0; x <= W; x += 60) { sg.beginPath(); sg.moveTo(x, 0); sg.lineTo(x, H); sg.stroke(); } for (let y = 0; y <= H; y += 26) { sg.beginPath(); sg.moveTo(0, y); sg.lineTo(W, y); sg.stroke(); }
      if (!hist.length) return; const vM = Math.max(1e-9, ...hist.map(r => Math.abs(r[1][0]))), iM = Math.max(1e-12, ...hist.map(r => Math.abs(r[2][1]))); const tr = (col, f) => { sg.strokeStyle = col; sg.lineWidth = 2; sg.beginPath(); hist.forEach((r, k) => { const x = W - (hist.length - k), y = H - 8 - f(r) * (H - 20); k ? sg.lineTo(x, y) : sg.moveTo(x, y); }); sg.stroke(); };
      tr('#F2B32A', r => Math.abs(r[1][0]) / Math.max(vM, vmax() * .5)); tr('#5BC8FF', r => Math.abs(r[2][1]) / iM); const lr = hist[hist.length - 1];
      sg.font = '600 12px IBM Plex Mono'; sg.fillStyle = '#F2B32A'; sg.fillText(`v(${def.scope[0]}) = ${SI(Math.abs(lr[1][0]), 'V')}`, 10, 16); sg.fillStyle = '#5BC8FF'; sg.fillText(`i(${def.scope[1]}) = ${SI(Math.abs(lr[2][1]), 'A')}`, 190, 16); sg.fillStyle = 'rgba(200,255,230,.7)'; sg.fillText(`t = ${E.t.toFixed(def.dt < .1 ? 4 : 2)} s`, W - 110, 16); };
    const nearest = (x, y) => { let best = null, bd = 22; E.ids.forEach(i => { const [nx, ny] = P(i), d = Math.hypot(x - nx, y - ny); if (d < bd) { bd = d; best = { node: i }; } }); if (best) return best; let be = null; bd = 40; E.els.forEach(e => { const [x1, y1] = P(e.a), [x2, y2] = P(e.b), L2 = (x2 - x1) ** 2 + (y2 - y1) ** 2, t = Math.max(0, Math.min(1, ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / L2)), d = Math.hypot(x - x1 - t * (x2 - x1), y - y1 - t * (y2 - y1)); if (d < bd) { bd = d; be = e; } }); if (!be) return null; return be.t === 'w' ? { node: be.a } : { el: be.n }; };
    c.onclick = ev => { const r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * w, y = (ev.clientY - r.top) / r.height * h; const hit = nearest(x, y); if (!hit) return; if (hit.el) { const e = E.els.find(z => z.n === hit.el); if (e.t === 'S' && sel && sel.el === e.n) { e.v = e.v ? 0 : 1; if (!def.dt) E.step(0); } sel = hit; } else sel = hit; walk = null; panel(); };
    const loopRows = () => (def.loops || []).map((l, k) => `<button class="btn sm" data-loop="${k}">▶ walk: ${l[0]}</button>`).join('');
    function panel() {
      let h2 = `<p class="clnote">${def.note}</p>`;
      if (sel && sel.node) { const nn = E.net[sel.node]; const touch = E.els.filter(e => e.t !== 'w' && (E.net[e.a] === nn || E.net[e.b] === nn)); let sin = 0; const rows = touch.map(e => { const out = E.net[e.a] === nn ? e.i : -e.i; sin += -out; return `<tr><td>${e.n}</td><td>${out < 0 ? '<b class="kin">into node</b>' : '<b class="kout">out of node</b>'}</td><td>${SI(Math.abs(out), 'A')}</td></tr>`; });
        const ins = touch.reduce((s, e) => { const out = E.net[e.a] === nn ? e.i : -e.i; return s + (out < 0 ? -out : 0); }, 0), outs = touch.reduce((s, e) => { const out = E.net[e.a] === nn ? e.i : -e.i; return s + (out > 0 ? out : 0); }, 0);
        h2 += `<h4>KCL at this node <small>V = ${SI(E.nodeV[sel.node], 'V')}</small></h4><table class="t cl">${rows.join('')}</table><div class="kcl"><span>in: <b>${SI(ins, 'A')}</b></span><span>out: <b>${SI(outs, 'A')}</b></span><span class="${Math.abs(sin) < 1e-4 * ins + 1e-9 ? 'ok' : ''}">Σ in − out = <b>${SI(Math.abs(sin) < 1e-4 * ins + 1e-9 ? 0 : sin, 'A')}</b>${Math.abs(sin) < 1e-4 * ins + 1e-9 ? ' ✓' : ''}</span></div><p class="clhint">Charge can't pile up at a node, so whatever flows in must flow out.</p>`; }
      else if (sel && sel.el) { const e = E.els.find(z => z.n === sel.el); const vab = E.nodeV[e.a] - E.nodeV[e.b];
        const sl = e.t === 'R' || e.t === 'B' ? `<input type="range" id="clv" min="0" max="600" value="${Math.round(100 * Math.log10(e.v))}">` : e.t === 'V' ? `<input type="range" id="clv" min="-24" max="24" step=".5" value="${e.v}">` : e.t === 'I' ? `<input type="range" id="clv" min="-20" max="20" step=".5" value="${e.v * 1000}">` : e.t === 'C' ? `<input type="range" id="clv" min="0" max="300" value="${Math.round(100 * Math.log10(e.v * 1e6))}">` : e.t === 'L' ? `<input type="range" id="clv" min="0" max="300" value="${Math.round(100 * Math.log10(e.v * 1e3))}">` : `<button class="btn pri sm" id="cltog">${e.v ? 'open' : 'close'} ${e.n}</button>`;
        h2 += `<h4>${e.n} <small>${{ R: 'resistor', B: 'light bulb', V: 'voltage source', I: 'current source', C: 'capacitor', L: 'inductor', S: 'switch' }[e.t]}</small></h4><div class="clslider">${sl}<b id="clvl"></b></div><table class="t cl"><tr><td>current</td><td>${SI(Math.abs(e.i), 'A')}</td></tr>${e.t !== 'S' ? `<tr><td>voltage across</td><td>${SI(Math.abs(vab), 'V')}</td></tr>` : ''}${e.t === 'R' || e.t === 'B' ? `<tr><td>check V = IR</td><td>${SI(Math.abs(e.i), 'A')} × ${SI(e.v, 'Ω')} = ${SI(Math.abs(e.i * e.v), 'V')}</td></tr><tr><td>power P = I²R</td><td>${SI(e.i * e.i * e.v, 'W')}</td></tr>` : ''}${e.t === 'V' ? `<tr><td>power ${e.i * e.v >= 0 ? 'delivered' : 'absorbed'}</td><td>${SI(Math.abs(e.i * e.v), 'W')}</td></tr>` : ''}${e.t === 'C' ? `<tr><td>stored energy ½CV²</td><td>${SI(.5 * e.v * vab * vab, 'J')}</td></tr>` : ''}</table>`; }
      h2 += `<h4>KVL</h4><div class="clloops">${loopRows()}</div><div id="clwalk"></div><div class="clopts"><label><input type="checkbox" id="clel" ${electron ? 'checked' : ''}> show electron flow</label><label><input type="checkbox" id="cllb" ${labels ? 'checked' : ''}> labels</label>${def.dt ? '<button class="btn sm" id="clrs">↺ reset time</button>' : ''}</div><p class="clhint">Tap any wire or junction for KCL. Tap a part to change it. Tap a switch twice to flip it.</p>`;
      side.innerHTML = h2;
      const s = $('#clv', side); if (s) { const e = E.els.find(z => z.n === sel.el); const upd = () => { const v = +s.value; e.v = e.t === 'R' || e.t === 'B' ? Math.round(10 ** (v / 100) * 100) / 100 : e.t === 'V' ? v : e.t === 'I' ? v / 1000 : e.t === 'C' ? 10 ** (v / 100) * 1e-6 : 10 ** (v / 100) * 1e-3; $('#clvl', side).textContent = e.t === 'R' || e.t === 'B' ? SI(e.v, 'Ω') : e.t === 'V' ? SI(e.v, 'V') : e.t === 'I' ? SI(e.v, 'A') : e.t === 'C' ? SI(e.v, 'F') : SI(e.v, 'H'); if (!def.dt) E.step(0); }; s.oninput = upd; s.onchange = () => panel(); upd(); }
      const tg = $('#cltog', side); if (tg) tg.onclick = () => { const e = E.els.find(z => z.n === sel.el); e.v = e.v ? 0 : 1; if (!def.dt) E.step(0); panel(); };
      $$('[data-loop]', side).forEach(b => b.onclick = () => { const L = def.loops[+b.dataset.loop]; walk = { name: L[0], path: L[1], seg: 0, f: 0, sum: 0, rows: [] }; sel = null; renderWalk(); });
      $('#clel', side).onchange = ev => { electron = ev.target.checked; }; $('#cllb', side).onchange = ev => { labels = ev.target.checked; };
      const rs = $('#clrs', side); if (rs) rs.onclick = () => { E.reset(); hist = []; E.step(def.dt / 400); };
    }
    const elBetween = (p, q) => E.els.find(e => (e.a === p && e.b === q) || (e.a === q && e.b === p));
    function stepWalk(dt) { const path = walk.path; if (walk.seg >= path.length - 1) return; walk.f += dt / .7; if (walk.f >= 1) { const p = path[walk.seg], q = path[walk.seg + 1], e = elBetween(p, q), dv = E.nodeV[q] - E.nodeV[p]; if (e && e.t !== 'w') { walk.sum += dv; walk.rows.push([e.n, dv, e.t]); } walk.seg++; walk.f = 0; renderWalk(); } }
    function renderWalk() { const d = $('#clwalk', side); if (!d || !walk) return; const done = walk.seg >= walk.path.length - 1; d.innerHTML = `<div class="walk"><b>${walk.name}</b> — going ${walk.path.join(' → ')}<table class="t cl">${walk.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1] >= 0 ? '<b class="kin">rise</b>' : '<b class="kout">drop</b>'}</td><td>${r[1] >= 0 ? '+' : '−'}${SI(Math.abs(r[1]), 'V')}</td></tr>`).join('')}</table><div class="kcl"><span class="${done && Math.abs(walk.sum) < 1e-3 ? 'ok' : ''}">Σ ΔV = <b>${(Math.abs(walk.sum) < 5e-4 ? 0 : walk.sum).toFixed(3)} V</b>${done ? ' ✓ back where we started, so the total must be 0' : ''}</span></div></div>`; }
    load(key); raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  } });
