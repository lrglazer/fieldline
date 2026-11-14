/* Fieldline — app engine: state, routing, lessons, practice, exams, visualizer gallery. */
'use strict';
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const main = $('#main');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const R = {
  int: (a, b) => a + Math.floor(Math.random() * (b - a + 1)), pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  sample: (a, n) => R.shuffle(a).slice(0, n), real: (a, b, d = 2) => +(a + Math.random() * (b - a)).toFixed(d),
};
const sig = (x, n = 3) => { if (!isFinite(x)) return String(x); if (x === 0) return '0'; const v = +x.toPrecision(n); return Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3 ? v.toExponential(n - 1) : String(v); };
const code = (s, lang = '') => `<pre class="code ${lang}"><code>${hl(s)}</code></pre>`;
function hl(s) { // tiny syntax highlighter (Java/C/Python-ish)
  return esc(s).replace(/(\/\/[^\n]*|#[^\n{]*$)/gm, '<i class="cm">$1</i>')
    .replace(/\b(int|double|float|char|boolean|void|String|return|if|else|for|while|do|new|class|public|private|static|final|null|true|false|this|extends|implements|interface|abstract|struct|def|in|range|print|switch|case|break|continue|try|catch|throw|throws|import|void|long|unsigned|const|auto|lambda|let|fun|val|var|SELECT|FROM|WHERE|JOIN|ON|GROUP BY|HAVING|ORDER BY|INSERT|INTO|VALUES|UPDATE|SET|DELETE|COUNT|SUM|AVG|MAX|MIN|AS|AND|OR|NOT|DISTINCT|PRIMARY KEY|FOREIGN KEY|REFERENCES|CREATE TABLE)\b/g, '<b class="kw">$1</b>')
    .replace(/(&quot;[^&]*?&quot;|'[^'\n]?')/g, '<i class="st">$1</i>')
    .replace(/\b(\d+(\.\d+)?)\b/g, '<i class="nu">$1</i>');
}
const TRICK = s => `<div class="trick"><b>⚡ exam trick</b> ${s}</div>`;
const mc = (prompt, options, answer, steps, extra = {}) => ({ type: 'mc', prompt, options, answer, steps, ...extra });
function mcFrom(prompt, correct, wrongs, steps, extra) { correct = String(correct); const opts = R.shuffle([correct, ...R.shuffle([...new Set(wrongs.map(String))].filter(w => w !== correct)).slice(0, 3)]); return mc(prompt, opts, opts.indexOf(correct), steps, extra); }
const numQ = (prompt, value, unit, steps, extra = {}) => ({ type: 'num', prompt, value, unit, tol: extra.tol ?? 0.005, steps, ...extra });
const textQ = (prompt, answer, steps, extra = {}) => ({ type: 'text', prompt, answerText: answer, check: extra.check || (v => norm(v) === norm(answer)), steps, ...extra });
const norm = s => String(s).toLowerCase().replace(/\s+/g, '').replace(/[,\[\]{}()]/g, ' ').replace(/\s+/g, ',').replace(/^,|,$/g, '');
function parseNum(s) { s = String(s).trim().replace(/,/g, ''); if (/^0b[01]+$/i.test(s)) return parseInt(s.slice(2), 2); if (/^0x[0-9a-f]+$/i.test(s)) return parseInt(s, 16); const m = s.match(/^[-+]?\d*\.?\d+(e[-+]?\d+)?/i); return m ? parseFloat(m[0]) : NaN; }

/* ---------- courses: UT Dallas BS Computer Science core (2026 catalog) ---------- */
const COURSES = [
  { id: '2325', code: 'PHYS 2325', name: 'Mechanics', color: '#FFB547', book: 'Young & Freedman, University Physics' },
  { id: '2326', code: 'PHYS 2326', name: 'Electromagnetism & Waves', color: '#4FD1FF', book: 'Young & Freedman, University Physics' },
  { id: '3301', code: 'EE 3301', name: 'Electrical Network Analysis', color: '#7CFF8A', book: 'Alexander & Sadiku, Fundamentals of Electric Circuits' },
  { id: '3302', code: 'EE 3302', name: 'Signals & Systems', color: '#FF7AB6', book: 'Oppenheim & Willsky, Signals and Systems' },
  { id: '3310', code: 'EE 3310/3311', name: 'Electronic Devices & Circuits', color: '#C49BFF', book: 'Sedra & Smith, Microelectronic Circuits' },
  { id: '4301', code: 'EE 4301', name: 'Electromagnetic Engineering', color: '#5BE3C8', book: 'Ulaby, Fundamentals of Applied Electromagnetics' },
  { id: '4310', code: 'EE 4310', name: 'Systems & Controls', color: '#FF9466', book: 'Nise, Control Systems Engineering' },
];
const CH = []; // chapters pushed by content files
const VIZ = []; // visualizers: {id, title, icon, blurb, mount(box)}
const chById = id => CH.find(c => c.id === id);

/* ---------- saved progress ---------- */
const KEY = 'fieldline-v1';
const S = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } })();
S.xp ??= 0; S.ch ??= {}; S.miss ??= []; S.days ??= {}; S.exams ??= [];
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } };
const today = () => new Date().toISOString().slice(0, 10);
const chState = id => S.ch[id] ??= { att: 0, ok: 0, recent: [] };
const mastery = id => { const r = chState(id).recent; return r.length ? Math.round(r.filter(Boolean).length / Math.max(r.length, 8) * 100) : 0; };
function record(id, ok, q) { const st = chState(id); st.att++; if (ok) st.ok++; st.recent.push(!!ok); if (st.recent.length > 10) st.recent.shift(); S.days[today()] = (S.days[today()] || 0) + 1;
  if (ok) S.xp += 10; else { S.miss.unshift({ ch: id, t: Date.now() }); S.miss = S.miss.slice(0, 60); } save(); renderTop(); }
function streak() { let n = 0; const d = new Date(); for (; ;) { const k = d.toISOString().slice(0, 10); if (S.days[k]) { n++; d.setDate(d.getDate() - 1); } else if (n === 0 && k === today()) d.setDate(d.getDate() - 1); else break; } return n; }
const level = () => 1 + Math.floor(S.xp / 250);
function renderTop() { $('#xp').textContent = S.xp; $('#lvl').textContent = level(); $('#streak').textContent = streak(); $('#lvlbar').style.width = (S.xp % 250) / 2.5 + '%'; }
const bar = (p, c) => `<span class="mbar" style="--c:${c}"><i style="width:${p}%"></i></span>`;

function renderNav() {
  const cur = location.hash || '#/';
  let h = [['#/', '⌂', 'home'], ['#/exam', '▶', 'exam simulator'], ['#/viz', '∿', 'simulations'], ['#/review', '↺', 'mistake review']].map(([href, i, t]) => `<a href="${href}" class="nl ${cur === href || (href !== '#/' && cur.startsWith(href)) ? 'on' : ''}"><span class="ni">${i}</span>${t}${t === 'mistake review' && S.miss.length ? `<b class="badge">${Math.min(99, S.miss.length)}</b>` : ''}</a>`).join('');
  for (const co of COURSES) { const chs = CH.filter(c => c.course === co.id); if (!chs.length) continue; const open = chs.some(c => cur.startsWith('#/c/' + c.id));
    h += `<details class="ng" ${open ? 'open' : ''}><summary style="--c:${co.color}"><span class="dot"></span>${co.code} <small>${co.name}</small></summary>${chs.map(c => `<a href="#/c/${c.id}" class="nl ch ${cur.startsWith('#/c/' + c.id) ? 'on' : ''}"><span class="fn">${c.title}</span>${bar(mastery(c.id), co.color)}</a>`).join('')}</details>`; }
  $('#nav').innerHTML = h;
}

/* ---------- router ---------- */
let cleanup = null;
function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const p = location.hash.replace(/^#\/?/, '').split('/'); document.body.classList.remove('menu-open'); scrollTo(0, 0);
  if (p[0] === 'c' && chById(p[1])) viewChapter(chById(p[1]), p[2] || 'learn');
  else if (p[0] === 'exam') viewExam(p[1]);
  else if (p[0] === 'viz') viewViz(p[1]);
  else if (p[0] === 'review') viewReview();
  else if (p[0] === 'course' && COURSES.find(c => c.id === p[1])) viewCourse(p[1]);
  else viewHome();
  renderNav(); renderTop(); main.focus({ preventScroll: true });
}
addEventListener('hashchange', route);

/* ---------- home ---------- */
function viewHome() {
  const total = CH.length ? Math.round(CH.reduce((s, c) => s + mastery(c.id), 0) / CH.length) : 0, next = CH.find(c => mastery(c.id) < 80) || CH[0];
  main.innerHTML = `<section class="hero"><div class="hero-txt"><div class="kick">∮ physics & electrical engineering, one idea at a time</div><h1>See the field.<br>Solve the circuit.<br><span class="grad">Ace the exam.</span></h1>
    <p>Mechanics and E&amp;M through circuits, signals, electronics, electromagnetics and controls, built around the UT Dallas physics and EE core. Each topic is a short lesson with the exam tricks built in, a worked example, and endless fresh problems. Plus live simulations you can poke at.</p>
    <div class="cta"><a class="btn pri" href="#/c/${next.id}">${S.xp ? 'resume' : 'start'}: ${next.title} →</a><a class="btn" href="#/viz">∿ open the simulations</a></div></div>
    <div class="scope" aria-hidden="true"><canvas id="scopeC" width="520" height="300"></canvas><div class="scopelbl"><span>CH1 2V/div</span><span>CH2 1V/div</span><span>5ms/div</span></div></div></section>
    <section class="stats"><div class="stat"><b>${CH.length}</b><span>topics</span></div><div class="stat"><b>${COURSES.filter(co => CH.some(c => c.course === co.id)).length}</b><span>UTD courses</span></div><div class="stat"><b>${VIZ.length}</b><span>simulations</span></div><div class="stat"><b>${total}%</b><span>mastered</span></div><div class="stat"><b>${S.xp}</b><span>XP</span></div></section>
    ${COURSES.map(co => { const chs = CH.filter(c => c.course === co.id); if (!chs.length) return ''; const m = Math.round(chs.reduce((s, c) => s + mastery(c.id), 0) / chs.length);
      return `<section class="course" style="--c:${co.color}"><div class="course-h"><div><span class="code-tag">${co.code}</span><h2>${co.name}</h2><p class="book">📘 ${co.book}</p></div><div class="cm"><b>${m}%</b>${bar(m, co.color)}<a class="btn sm" href="#/exam/${co.id}">exam →</a></div></div>
        <div class="cgrid">${chs.map((c, i) => `<a class="card ${mastery(c.id) >= 80 ? 'done' : ''}" href="#/c/${c.id}" style="animation-delay:${i * 40}ms"><span class="file">${c.file}</span><b>${c.title}</b><small>${c.blurb}</small>${bar(mastery(c.id), co.color)}</a>`).join('')}</div></section>`; }).join('')}`;
  const cv = $('#scopeC'), g = cv.getContext('2d'); let ph = 0; const draw = () => { if (!cv.isConnected) return; const W = cv.width, H = cv.height; g.clearRect(0, 0, W, H); g.strokeStyle = 'rgba(120,255,200,.10)'; g.lineWidth = 1; for (let x = 0; x <= W; x += W / 10) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (let y = 0; y <= H; y += H / 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const tr = (f, col, w) => { g.strokeStyle = col; g.lineWidth = w; g.shadowColor = col; g.shadowBlur = 12; g.beginPath(); for (let x = 0; x <= W; x += 2) { const y = H / 2 - f(x / W * 4 * Math.PI + ph) * H * .32; x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.shadowBlur = 0; };
    tr(t => Math.sin(t), '#FFB547', 2.4); tr(t => 4 / Math.PI * (Math.sin(t) + Math.sin(3 * t) / 3 + Math.sin(5 * t) / 5 + Math.sin(7 * t) / 7) * .78, '#4FD1FF', 2); ph += .025; requestAnimationFrame(draw); }; draw();
}
function viewCourse(id) { location.hash = '#/'; }

/* ---------- chapter ---------- */
function viewChapter(c, tab) {
  const co = COURSES.find(x => x.id === c.course);
  main.innerHTML = `<header class="chhead" style="--c:${co.color}"><div class="crumb"><a href="#/">home</a> / ${co.code} / <b>${c.title}</b></div><h1>${c.title}</h1><p class="blurb">${c.blurb}</p>
    <div class="chmeta"><span>${co.code} · ${co.name}</span><span>mastery ${mastery(c.id)}%</span>${bar(mastery(c.id), co.color)}</div>
    <nav class="tabs">${[['learn', '01 learn'], ['watch', '02 worked example'], ['do', '03 your turn']].map(([k, l]) => `<a class="${tab === k ? 'on' : ''}" href="#/c/${c.id}/${k}">${l}</a>`).join('')}</nav></header><div id="body"></div>`;
  const body = $('#body');
  if (tab === 'watch') watchView(c, body); else if (tab === 'do') practiceView(c, body); else learnView(c, body);
}
function learnView(c, body) {
  let i = 0;
  const draw = () => { if (cleanup) { cleanup(); cleanup = null; } const L = c.learn[i];
    body.innerHTML = `<div class="toc">${c.learn.map((x, k) => `<button class="tocb ${k === i ? 'on' : ''}" data-k="${k}"><span>${x.sec || k + 1}</span>${x.h}</button>`).join('')}</div>
      <article class="page"><div class="pg">section ${L.sec || i + 1} · ${i + 1} of ${c.learn.length}</div><h2>${L.h}</h2>${L.body}<div id="wbox"></div>${L.gen ? '<div class="secq"><div class="secqh"><b>✎ try it: section ' + (L.sec || i + 1) + '</b><button class="btn sm" id="sqn">↻ new problem</button></div><div id="sqb"></div></div>' : ''}
      <div class="pnav">${i ? '<button class="btn" id="prev">← back</button>' : '<span></span>'}${i < c.learn.length - 1 ? `<button class="btn pri" id="next">next: ${c.learn[i + 1].sec || ''} ${c.learn[i + 1].h} →</button>` : `<a class="btn pri" href="#/c/${c.id}/do">chapter practice →</a>`}</div></article>`;
    if (L.viz) { const v = VIZ.find(x => x.id === L.viz); if (v) { const b = $('#wbox'); b.className = 'widget'; b.innerHTML = `<div class="wh">∿ ${v.title}</div><div class="wb"></div>`; cleanup = v.mount($('.wb', b), L.vizOpts) || null; } }
    if (L.gen) { const run = async () => { const q = L.gen(); q.ch = c.id; const box = $('#sqb'); box.innerHTML = qHTML(q); const r = await grade(q, box); record(c.id, r.ok, q); if (r.ok) pop('+10 XP'); showResult(q, r, box); }; run(); $('#sqn').onclick = run; }
    $$('.tocb').forEach(x => x.onclick = () => { i = +x.dataset.k; draw(); scrollTo(0, 0); });
    $('#prev') && ($('#prev').onclick = () => { i--; draw(); scrollTo(0, 0); }); $('#next') && ($('#next').onclick = () => { i++; draw(); scrollTo(0, 0); }); };
  draw();
}
const newQ = c => { const gens = c.learn.filter(l => l.gen).map(l => l.gen); const q = c.gen ? c.gen() : R.pick(gens)(); q.ch = c.id; return q; };
function qHTML(q, o = {}) {
  let a = '';
  if (q.type === 'mc') a = `<div class="opts">${q.options.map((x, k) => `<button class="opt" data-k="${k}"><span class="key">${'ABCDEF'[k]}</span><span>${x}</span></button>`).join('')}</div>`;
  else a = `<form class="ans"><input id="inp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${q.placeholder || (q.type === 'num' ? 'answer' : 'type your answer')}" aria-label="Your answer">${q.unit ? `<span class="unit">${q.unit}</span>` : ''}<button class="btn pri" type="submit">submit ⏎</button></form>`;
  return `<div class="q"><div class="prompt">${q.prompt}</div>${q.visual ? `<div class="vis">${q.visual}</div>` : ''}${o.noAnswer ? '' : a}<div class="fb" id="fb" aria-live="polite"></div></div>`;
}
function grade(q, root) {
  return new Promise(res => {
    if (q.type === 'mc') $$('.opt', root).forEach(b => b.onclick = () => res({ ok: +b.dataset.k === q.answer, given: +b.dataset.k }));
    else $('form', root).onsubmit = e => { e.preventDefault(); const v = $('#inp', root).value; if (!v.trim()) return;
      if (q.type === 'num') { const x = parseNum(v); if (isNaN(x)) { $('#inp', root).classList.add('bad'); return; } res({ ok: q.abs != null ? Math.abs(x - q.value) <= q.abs : Math.abs(x - q.value) <= Math.max(Math.abs(q.value) * q.tol, 1e-9), given: v }); }
      else res({ ok: !!q.check(v), given: v }); };
  });
}
function showResult(q, r, root) {
  $$('.opt,input,button[type=submit]', root).forEach(e => e.disabled = true);
  if (q.type === 'mc') $$('.opt', root).forEach(b => { const k = +b.dataset.k; if (k === q.answer) b.classList.add('right'); else if (k === r.given) b.classList.add('wrong'); });
  const ans = q.type === 'num' ? `${sig(q.value, 4)} ${q.unit || ''}` : q.type === 'text' ? q.answerText : '';
  const pg = $('.page', root); if (pg) { pg.classList.remove('shake', 'glow'); void pg.offsetWidth; pg.classList.add(r.ok ? 'glow' : 'shake'); }
  $('#fb', root).innerHTML = `<div class="verdict ${r.ok ? 'ok' : 'no'}">${r.ok ? R.pick(['✓ correct', '✓ nailed it', '✓ that\'s it', '✓ exactly']) : '✗ not quite'}${!r.ok && ans ? ` <span>answer: <b>${ans}</b></span>` : ''}</div><div class="how"><b>how to solve it</b><ol>${q.steps.map(s => `<li>${s}</li>`).join('')}</ol></div>`;
}
function watchView(c, body) {
  const q = newQ(c); let k = 0; const shown = q.type === 'mc' ? q.options[q.answer] : q.type === 'num' ? `${sig(q.value, 4)} ${q.unit || ''}` : q.answerText;
  body.innerHTML = `<article class="page watch"><div class="pg">worked example</div>${qHTML(q, { noAnswer: true })}<ol class="wsteps" id="ws"></ol><div class="pnav"><button class="btn" id="another">↻ another</button><button class="btn pri" id="step">step 1 →</button></div></article>`;
  const next = () => { if (k < q.steps.length) { const li = document.createElement('li'); li.innerHTML = q.steps[k++]; $('#ws').appendChild(li); }
    if (k >= q.steps.length) { if (!$('#final')) $('#ws').insertAdjacentHTML('afterend', `<div class="final" id="final">answer: <b>${shown}</b></div>`); $('#step').outerHTML = `<a class="btn pri" href="#/c/${c.id}/do">your turn →</a>`; } else $('#step').textContent = `step ${k + 1} →`; };
  $('#step').onclick = next; $('#another').onclick = () => watchView(c, body);
}
function practiceView(c, body) {
  const N = 5; let n = 0, right = 0;
  const one = async () => {
    if (n >= N) return finish(); const q = newQ(c);
    body.innerHTML = `<article class="page do"><div class="prog"><span class="pg">problem ${n + 1}/${N}</span><span class="pbar"><i style="width:${n / N * 100}%"></i></span><span class="score">✓ ${right}</span></div>${qHTML(q)}<div class="pnav" id="after" hidden><span></span><button class="btn pri" id="nextq">${n + 1 < N ? 'next →' : 'results →'}</button></div></article>`;
    const inp = $('#inp'); inp && inp.focus();
    const r = await grade(q, body); if (r.ok) { right++; pop('+10 XP'); } record(c.id, r.ok, q); showResult(q, r, body); $('#after').hidden = false; n++; $('#nextq').onclick = one; $('#nextq').focus();
  };
  const finish = () => { const m = mastery(c.id); body.innerHTML = `<article class="page result"><div class="big">${right === N ? '🏆' : right >= 3 ? '🎉' : '💪'}</div><h2>${right}/${N} passed</h2><p>mastery: <b>${m}%</b>${m >= 80 ? ' · mastered ★' : ' · hit 80% over your last 10 to master it'}</p><div class="cta"><button class="btn pri" id="again">5 more</button><a class="btn" href="#/c/${c.id}/learn">re-read the lesson</a></div></article>`; if (right === N) confetti(); $('#again').onclick = () => practiceView(c, body); };
  one();
}

/* ---------- exam simulator ---------- */
function viewExam(cid) {
  if (!cid) { main.innerHTML = `<header class="chhead"><h1>▶ exam simulator</h1><p class="blurb">A timed, mixed exam built from fresh problems. No hints until you submit. You get a score and a list of weak spots.</p></header>
      <div class="cgrid exams">${COURSES.filter(co => CH.some(c => c.course === co.id)).map(co => `<a class="card" href="#/exam/${co.id}" style="--c:${co.color}"><span class="file">${co.code}</span><b>${co.name}</b><small>${CH.filter(c => c.course === co.id).length} topics · 12 problems · 30 min</small></a>`).join('')}
      <a class="card" href="#/exam/all"><span class="file">FINAL</span><b>Everything</b><small>20 problems from every course · 50 min</small></a></div>`; return; }
  const pool = cid === 'all' ? CH : CH.filter(c => c.course === cid), N = cid === 'all' ? 20 : 12, mins = cid === 'all' ? 50 : 30;
  const qs = [...Array(N)].map((_, i) => newQ(pool[i % pool.length])); R.shuffle(qs); const ans = Array(N).fill(null); let i = 0, end = Date.now() + mins * 60000;
  const tick = setInterval(() => { const t = Math.max(0, end - Date.now()); const el = $('#timer'); if (!el) return clearInterval(tick); el.textContent = `${Math.floor(t / 60000)}:${String(Math.floor(t / 1000) % 60).padStart(2, '0')}`; if (!t) { clearInterval(tick); submit(); } }, 500);
  cleanup = () => clearInterval(tick);
  const draw = () => { const q = qs[i];
    main.innerHTML = `<header class="chhead exhead"><h1>${cid === 'all' ? 'final exam' : COURSES.find(c => c.id === cid).code + ' exam'}</h1><div class="exbar"><span>⏱ <b id="timer">${mins}:00</b></span><div class="dots">${qs.map((_, k) => `<button class="dt ${k === i ? 'cur' : ''} ${ans[k] != null ? 'on' : ''}" data-k="${k}">${k + 1}</button>`).join('')}</div><button class="btn pri" id="sub">submit exam</button></div></header>
      <article class="page do"><div class="pg">problem ${i + 1}/${N} · ${chById(q.ch).title}</div>${qHTML(q)}<div class="pnav"><button class="btn" id="pv" ${i ? '' : 'disabled'}>← prev</button><button class="btn pri" id="nx">${i < N - 1 ? 'save & next →' : 'save'}</button></div></article>`;
    if (q.type === 'mc' && ans[i] != null) $$('.opt')[ans[i]].classList.add('picked'); else if (ans[i] != null && $('#inp')) $('#inp').value = ans[i];
    $$('.opt').forEach(b => b.onclick = () => { ans[i] = +b.dataset.k; $$('.opt').forEach(x => x.classList.toggle('picked', x === b)); });
    const keep = () => { if (q.type !== 'mc' && $('#inp').value.trim()) ans[i] = $('#inp').value; };
    $('form') && ($('form').onsubmit = e => { e.preventDefault(); keep(); if (i < N - 1) { i++; draw(); } });
    $('#nx').onclick = () => { keep(); if (i < N - 1) { i++; draw(); } else draw(); }; $('#pv').onclick = () => { keep(); i--; draw(); };
    $$('.dt').forEach(b => b.onclick = () => { keep(); i = +b.dataset.k; draw(); }); $('#sub').onclick = () => { keep(); if (confirmSubmit()) submit(); }; };
  const confirmSubmit = () => ans.filter(a => a == null).length === 0 || window.confirm(`${ans.filter(a => a == null).length} unanswered. Submit anyway?`);
  const submit = () => { clearInterval(tick); const res = qs.map((q, k) => { const a = ans[k]; if (a == null) return false; if (q.type === 'mc') return a === q.answer; if (q.type === 'num') { const x = parseNum(a); return q.abs != null ? Math.abs(x - q.value) <= q.abs : Math.abs(x - q.value) <= Math.max(Math.abs(q.value) * q.tol, 1e-9); } return !!q.check(a); });
    res.forEach((ok, k) => record(qs[k].ch, ok, qs[k])); const sc = Math.round(res.filter(Boolean).length / N * 100); S.exams.unshift({ cid, sc, t: Date.now() }); save();
    const weak = {}; res.forEach((ok, k) => { if (!ok) weak[qs[k].ch] = (weak[qs[k].ch] || 0) + 1; });
    main.innerHTML = `<article class="page result"><div class="big">${sc >= 90 ? '🏆' : sc >= 70 ? '🎉' : '📚'}</div><h2>${sc}%</h2><p>${res.filter(Boolean).length} of ${N} correct</p>${Object.keys(weak).length ? `<h3>weak spots</h3><div class="weak">${Object.entries(weak).sort((a, b) => b[1] - a[1]).map(([id, n]) => `<a class="btn" href="#/c/${id}/learn">${chById(id).title} · ${n} missed</a>`).join('')}</div>` : '<p>No weak spots. Fully charged. ⚡</p>'}
      <div class="review">${qs.map((q, k) => `<details><summary class="${res[k] ? 'ok' : 'no'}">${res[k] ? '✓' : '✗'} ${k + 1}. ${chById(q.ch).title}</summary>${q.prompt}${q.visual || ''}<p><b>answer:</b> ${q.type === 'mc' ? q.options[q.answer] : q.type === 'num' ? sig(q.value, 4) + ' ' + (q.unit || '') : q.answerText}</p><ol>${q.steps.map(s => `<li>${s}</li>`).join('')}</ol></details>`).join('')}</div>
      <div class="cta"><a class="btn pri" href="#/exam/${cid}" onclick="setTimeout(route)">retake with new problems</a><a class="btn" href="#/exam">all exams</a></div></article>`; if (sc >= 90) confetti(); };
  draw();
}
function viewReview() {
  const ids = [...new Set(S.miss.map(m => m.ch))].filter(chById);
  main.innerHTML = `<header class="chhead"><h1>↺ mistake review</h1><p class="blurb">Topics you've missed recently. Clear them with fresh problems.</p></header>${ids.length ? `<div class="cgrid">${ids.map(id => { const c = chById(id), co = COURSES.find(x => x.id === c.course); return `<a class="card" href="#/c/${id}/do" style="--c:${co.color}"><span class="file">${c.file}</span><b>${c.title}</b><small>${S.miss.filter(m => m.ch === id).length} recent misses · ${co.code}</small></a>`; }).join('')}</div>` : '<article class="page result"><div class="big">✨</div><h2>No mistakes logged</h2><p>Go solve something.</p></article>'}`;
}
function viewViz(id) {
  const v = VIZ.find(x => x.id === id);
  if (!v) { main.innerHTML = `<header class="chhead"><h1>∿ simulations</h1><p class="blurb">Interactive models of the ideas that are hard to see in a textbook. Poke at them.</p></header><div class="cgrid">${VIZ.map(x => `<a class="card viz" href="#/viz/${x.id}" style="--c:${x.color || '#7CFFB2'}"><span class="vi">${x.icon}</span><b>${x.title}</b><small>${x.blurb}</small></a>`).join('')}</div>`; return; }
  main.innerHTML = `<header class="chhead" style="--c:${v.color || '#7CFFB2'}"><div class="crumb"><a href="#/viz">∿ simulations</a> / <b>${v.id}</b></div><h1>${v.icon} ${v.title}</h1><p class="blurb">${v.blurb}</p></header><article class="page widget big"><div class="wb"></div></article>`;
  cleanup = v.mount($('.wb')) || null;
}

/* ---------- fx ---------- */
function pop(t) { const p = document.createElement('div'); p.className = 'xp-pop'; p.textContent = t; document.body.appendChild(p); setTimeout(() => p.remove(), 1100); }
function confetti() { const c = document.createElement('div'); c.className = 'confetti'; c.innerHTML = [...Array(60)].map(() => `<i style="left:${Math.random() * 100}%;background:${R.pick(['#FFB547', '#4FD1FF', '#7CFF8A', '#FF7AB6', '#C49BFF'])};animation-delay:${Math.random() * .4}s;transform:rotate(${Math.random() * 360}deg)">${R.pick(['Ω', 'V', 'μ', 'ε', '∮'])}</i>`).join(''); document.body.appendChild(c); setTimeout(() => c.remove(), 2600); }
function boot() {
  const th = localStorage.getItem('fl-theme'); if (th) document.documentElement.dataset.theme = th;
  $('#themeBtn').onclick = () => { const t = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'; document.documentElement.dataset.theme = t; localStorage.setItem('fl-theme', t); };
  $('#menuBtn').onclick = () => document.body.classList.toggle('menu-open');
  CH.sort((a, b) => COURSES.findIndex(x => x.id === a.course) - COURSES.findIndex(x => x.id === b.course));
  CH.forEach(c => c.file = '§ ' + (CH.filter(x => x.course === c.course).indexOf(c) + 1));
  route();
}
