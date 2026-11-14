/* Fieldline — EE 3302 Signals & Systems (Oppenheim & Willsky) and EE 4310 Systems & Controls (Nise), section by section. */
'use strict';

/* ================= EE 3302 ================= */
CH.push({ id: 'ow1', course: '3302', title: 'Ch 1 · Signals and systems', blurb: 'Time shifts and scaling, even/odd parts, periodicity, energy vs power, and system properties.',
  learn: [
    Sec('1.1–1.2', 'Signal energy, power & transformations of the independent variable', `${EQ('E = ∫|x(t)|² dt &nbsp;&nbsp; P = lim (1/2T)∫₋ₜᵀ |x(t)|² dt')}<p>An <b>energy signal</b> has finite E (and P = 0), like a decaying pulse. A <b>power signal</b> has finite nonzero P (and E = ∞), like a sinusoid.</p><p>For y(t) = x(at − b): rewrite as x(a(t − b/a)): <b>scale first</b> by a, then <b>shift by b/a</b>.</p>
      ${TRICK('x(2t − 4) is shifted right by <b>2</b>, not 4. Factor out the coefficient of t first: x(2(t − 2)). And x(−t) flips about t = 0; x(−t + 3) = x(−(t − 3)) is a flip then a shift right by 3.')}`,
      () => { const a = R.pick([2, 3, -1, -2, .5]), b = R.int(-6, 6); return nm2(`A pulse x(t) is nonzero for 0 ≤ t ≤ 4. For y(t) = x(${a}t ${b < 0 ? '+ ' + -b : '− ' + b}), where does the pulse <b>start</b> (smaller endpoint)?`, Math.min(b / a, (4 + b) / a), '', [`y is nonzero when 0 ≤ ${a}t − ${b} ≤ 4`, `→ t between ${f3(b / a)} and ${f3((4 + b) / a)}`, `start = <b>${f3(Math.min(b / a, (4 + b) / a))}</b>`]); }),
    Sec('1.3–1.4', 'Exponentials, sinusoids, unit impulse & step', `<p>Periodicity: x(t) = x(t + T). cos(ω₀t) has period 2π/ω₀. A sum of periodic signals is periodic only if the ratio of their periods is <b>rational</b>; the fundamental period is the LCM.</p>${EQ('δ(t) = du/dt &nbsp;&nbsp; ∫x(t)δ(t − t₀)dt = x(t₀) (sifting)')}
      ${TRICK('Discrete-time sinusoids are periodic only if ω₀/(2π) is rational: cos(n/4) is NOT periodic, but cos(πn/4) is (N = 8). This trips up everyone used to continuous time.')}`,
      () => { const p = R.pick([[2, 3], [3, 4], [4, 6], [2, 5], [6, 9]]); const T1 = 2 * Math.PI / p[0], T2 = 2 * Math.PI / p[1]; const g2 = (a, b) => b ? g2(b, a % b) : a; const w0 = g2(p[0], p[1]); return nm2(`What is the fundamental period of x(t) = cos(${p[0]}t) + sin(${p[1]}t)? (in units of π)`, 2 / w0, 'π', [`periods: 2π/${p[0]} and 2π/${p[1]}`, `fundamental frequency = gcd(${p[0]}, ${p[1]}) = ${w0} rad/s`, `T = 2π/${w0} = <b>${f3(2 / w0)}π</b>`]); void T1; void T2; }),
    Sec('1.6', 'Basic system properties', `<ul><li><b>Memoryless:</b> y(t) depends only on x at the same t.</li><li><b>Causal:</b> depends only on present and past inputs.</li><li><b>Stable (BIBO):</b> bounded input → bounded output.</li><li><b>Time-invariant:</b> a shifted input gives an equally shifted output.</li><li><b>Linear:</b> superposition (additivity + homogeneity).</li></ul>
      ${TRICK('Quick tests: any constant added (y = x + 2) breaks linearity. Any t multiplying x (y = t·x(t)) breaks time-invariance. x(−t) or x(t + 1) breaks causality. x(2t) is NOT time-invariant.')}`,
      () => { const s = R.pick([['y(t) = x(t) + 3', 'not linear'], ['y(t) = t·x(t)', 'not time-invariant'], ['y(t) = x(t + 1)', 'not causal'], ['y(t) = x²(t)', 'not linear'], ['y[n] = Σ x[k] for k ≤ n', 'not stable'], ['y(t) = x(2t)', 'not time-invariant'], ['y(t) = e^{x(t)}', 'not linear']]); return mcFrom(`Which property does <b>${s[0]}</b> fail?`, s[1], ['not linear', 'not time-invariant', 'not causal', 'not stable'], [s[1] === 'not linear' ? 'scale the input by 2: the output doesn\'t double' : s[1] === 'not time-invariant' ? 'shift the input: the output isn\'t the same shift of the old output' : s[1] === 'not causal' ? 'needs a future input value' : 'a bounded step input makes it grow without bound (an accumulator)', `→ <b>${s[1]}</b>`]); }),
  ] });

CH.push({ id: 'ow2', course: '3302', title: 'Ch 2 · LTI systems & convolution', blurb: 'Impulse response, the convolution sum and integral, and reading properties off h(t).',
  learn: [
    Sec('2.1–2.2', 'Convolution sum and integral', `${EQ('y[n] = Σ x[k]h[n − k] &nbsp;&nbsp; y(t) = ∫x(τ)h(t − τ)dτ')}<p>An LTI system is completely described by its impulse response h. Recipe: <b>flip</b> h, <b>slide</b> it by t, <b>multiply</b> by x, <b>integrate</b>.</p>
      ${TRICK('Length rule for finite discrete signals: if x has N₁ samples and h has N₂, y has N₁ + N₂ − 1. Start index = sum of start indices. Tabulating (the "multiplication table" method) is the fastest way by hand.')}
      ${TRICK('rect * rect = triangle (or trapezoid if widths differ); anything * δ(t − t₀) = that thing shifted by t₀.')}`,
      () => { const x = [R.int(-2, 3), R.int(-2, 3), R.int(-2, 3)], h = [R.int(-2, 3), R.int(-2, 3)]; const y = Array(4).fill(0); x.forEach((a, i) => h.forEach((b, j) => y[i + j] += a * b)); const k = R.int(0, 3); return nm2(`x[n] = {${x.join(', ')}} for n = 0, 1, 2 and h[n] = {${h.join(', ')}} for n = 0, 1. Find y[${k}] = (x * h)[${k}].`, y[k], '', [`y[n] = Σ x[k]h[n − k]`, `y = {${y.join(', ')}}`, `y[${k}] = <b>${y[k]}</b>`], 0); }, 'convolve'),
    Sec('2.3', 'Properties of LTI systems from h', `<ul><li>Memoryless ⇔ h(t) = Kδ(t).</li><li>Causal ⇔ h(t) = 0 for t &lt; 0.</li><li>Stable ⇔ ∫|h(t)|dt &lt; ∞.</li><li>Cascade: h₁ * h₂ (order doesn't matter). Parallel: h₁ + h₂.</li></ul>
      ${TRICK('e^{at}u(t) is stable only for a &lt; 0. u(t) itself (an integrator) is NOT stable: a bounded step in gives a ramp out.')}`,
      () => { const h = R.pick([['e^{−2t}u(t)', 'causal and stable'], ['e^{2t}u(t)', 'causal, not stable'], ['e^{−|t|}', 'stable, not causal'], ['u(t)', 'causal, not stable'], ['δ(t − 1)', 'causal and stable'], ['e^{3t}u(−t)', 'stable, not causal']]); return mcFrom(`An LTI system has h(t) = <b>${h[0]}</b>. It is…`, h[1], ['causal and stable', 'causal, not stable', 'stable, not causal', 'neither'], ['causal ⇔ h = 0 for t < 0; stable ⇔ ∫|h| < ∞', `→ <b>${h[1]}</b>`]); }),
  ] });

CH.push({ id: 'ow3', course: '3302', title: 'Ch 3–4 · Fourier series & transform', blurb: 'Fourier series coefficients, Parseval, the CTFT and its properties.',
  learn: [
    Sec('3.3', 'Fourier series of periodic signals', `${EQ('x(t) = Σ aₖ e^{jkω₀t} &nbsp;&nbsp; aₖ = (1/T)∫_T x(t)e^{−jkω₀t}dt')}<p>a₀ is the DC (average) value. For real x, a₋ₖ = aₖ*. Even signals have real aₖ; odd signals have imaginary aₖ.</p>
      ${TRICK('Read coefficients off directly with Euler: cos(ω₀t) = ½e^{jω₀t} + ½e^{−jω₀t} → a₁ = a₋₁ = ½. sin(ω₀t) gives a₁ = 1/(2j), a₋₁ = −1/(2j). No integrals needed for sums of sinusoids.')}`,
      () => { const A = R.int(1, 8), B = R.int(1, 8), C = R.int(0, 5); return nm2(`x(t) = ${C} + ${A} cos(ω₀t) + ${B} cos(3ω₀t). What is a₃ (the k = 3 coefficient)?`, B / 2, '', ['cos θ = (e^{jθ} + e^{−jθ})/2', `${B} cos(3ω₀t) → a₃ = a₋₃ = ${B}/2`, `a₃ = <b>${B / 2}</b>`]); }, 'fourier'),
    Sec('3.5 / 4.3', 'Parseval\'s relation & Fourier transform properties', `${EQ('(1/T)∫|x|²dt = Σ|aₖ|² &nbsp;&nbsp; X(jω) = ∫x(t)e^{−jωt}dt')}<p>Key pairs/properties: e^{−at}u(t) ↔ 1/(a + jω); rect of width T ↔ T sinc; time shift → multiply by e^{−jωt₀}; convolution ↔ multiplication; time scaling x(at) ↔ (1/|a|)X(jω/a).</p>
      ${TRICK('Squeeze in time → stretch in frequency (x(2t) has twice the bandwidth). A short pulse has a wide spectrum, which is why sharp edges need lots of bandwidth.')}`,
      () => { const a = R.int(1, 9), w = R.int(0, 12); return nm2(`For x(t) = e^{−${a}t}u(t), what is |X(jω)| at ω = ${w} rad/s?`, 1 / Math.hypot(a, w), '', [`X(jω) = 1/(${a} + jω)`, `|X| = 1/√(${a}² + ${w}²)`, `= <b>${f3(1 / Math.hypot(a, w))}</b>`]); }),
  ] });

CH.push({ id: 'ow7', course: '3302', title: 'Ch 7, 9 · Sampling & the Laplace transform', blurb: 'Nyquist rate, aliasing, Laplace transforms, ROC and transfer functions.',
  learn: [
    Sec('7.1–7.3', 'Sampling theorem & aliasing', `${EQ('f_s > 2f_max (Nyquist rate = 2f_max)')}<p>Sampling below the Nyquist rate folds high frequencies onto low ones (aliasing): a tone at f appears at |f − k·f_s| for the integer k that lands it in [0, f_s/2].</p>
      ${TRICK('For a product or square of signals, the bandwidth <b>adds</b>: x²(t) has twice the max frequency of x(t), so its Nyquist rate doubles. cos²(ωt) has a component at 2ω.')}`,
      () => { const fs = R.pick([1000, 8000, 44100, 500]), f = Math.round(fs * R.real(.55, 1.4, 2)); let a = f % fs; if (a > fs / 2) a = fs - a; return nm2(`A ${f} Hz tone is sampled at ${fs} Hz. At what frequency does it appear (alias) after reconstruction?`, a, 'Hz', [`f_s/2 = ${fs / 2} Hz; the tone is above it`, `fold: |${f} − k·${fs}| into [0, ${fs / 2}]`, `→ <b>${a} Hz</b>`], .001); }),
    Sec('9.1–9.7', 'The Laplace transform & transfer functions', `${EQ('X(s) = ∫x(t)e^{−st}dt &nbsp;&nbsp; H(s) = Y(s)/X(s)')}<p>Common pairs: u(t) ↔ 1/s, e^{−at}u(t) ↔ 1/(s + a), t·u(t) ↔ 1/s², sin(ω₀t)u(t) ↔ ω₀/(s² + ω₀²). Differentiation ↔ multiply by s.</p><p>Causal + stable LTI ⇔ all poles of H(s) in the <b>left half-plane</b> (Re s &lt; 0).</p>
      ${TRICK('Final value theorem: lim_{t→∞} x(t) = lim_{s→0} sX(s), but ONLY if the final value exists (all poles of sX(s) in the LHP). Applying it to an oscillating or growing signal gives a meaningless number.')}`,
      () => { const K = R.int(1, 20), a = R.int(1, 10), b = R.int(1, 10); return nm2(`Y(s) = ${K}/(s(s + ${a})(s + ${b})). What is y(∞)?`, K / (a * b), '', ['all poles of sY(s) are in the LHP, so FVT applies', `y(∞) = lim s·Y(s) as s → 0 = ${K}/(${a}·${b})`, `= <b>${f3(K / (a * b))}</b>`]); }),
  ] });

/* ================= EE 4310 ================= */
CH.push({ id: 'ns2', course: '4310', title: 'Ch 2, 5 · Transfer functions & block diagrams', blurb: 'Modeling, transfer functions, block-diagram reduction and the feedback formula.',
  learn: [
    Sec('2.3 / 5.2', 'Transfer functions & block-diagram reduction', `${EQ('series: G₁G₂ &nbsp;&nbsp; parallel: G₁ ± G₂ &nbsp;&nbsp; negative feedback: T(s) = G/(1 + GH)')}<p>Moving a pickoff point or summing junction across a block requires adding that block (or its inverse) to the moved branch.</p>
      ${TRICK('Positive feedback flips the sign: G/(1 − GH). Unity feedback means H = 1, so T = G/(1 + G). Most exam block diagrams collapse with just these three rules applied from the inside out.')}`,
      () => { const K = R.int(1, 50), a = R.int(1, 10), h = R.pick([1, 2, .5]); return nm2(`G(s) = ${K}/(s + ${a}) with negative feedback H = ${h}. DC gain of the closed loop T(0)?`, K / (a + K * h), '', [`T = G/(1 + GH) = ${K}/(s + ${a} + ${K * h})`, `T(0) = ${K}/(${a} + ${K * h}) = <b>${f3(K / (a + K * h))}</b>`]); }),
  ] });

CH.push({ id: 'ns4', course: '4310', title: 'Ch 4 · Time response', blurb: 'Poles and zeros, first-order τ, second-order ζ and ωₙ, overshoot, peak and settling time.',
  learn: [
    Sec('4.3', 'First-order systems', `${EQ('G(s) = a/(s + a) &nbsp;&nbsp; τ = 1/a &nbsp;&nbsp; T_r = 2.2/a &nbsp;&nbsp; T_s = 4/a')}
      ${TRICK('The pole location IS the speed: a pole at s = −5 means τ = 0.2 s and settling in 0.8 s. Poles farther left are faster.')}`,
      () => { const a = R.int(1, 20); return nm2(`G(s) = ${a}/(s + ${a}). 2% settling time?`, 4 / a, 's', ['T_s = 4/a', `= 4/${a} = <b>${f3(4 / a)} s</b>`]); }, 'step2'),
    Sec('4.5–4.6', 'Second-order systems', `${EQ('G(s) = ωₙ²/(s² + 2ζωₙs + ωₙ²)')}${EQ('%OS = 100·e^{−ζπ/√(1−ζ²)} &nbsp; T_p = π/(ωₙ√(1−ζ²)) &nbsp; T_s ≈ 4/(ζωₙ)')}
      ${TRICK('Read ζ and ωₙ straight off the denominator: s² + 4s + 25 → ωₙ² = 25 (ωₙ = 5), 2ζωₙ = 4 (ζ = 0.4). Percent overshoot depends <b>only</b> on ζ.')}
      ${TRICK('Poles at −σ ± jω_d: settling time depends on the real part σ = ζωₙ, peak time on the imaginary part ω_d, and overshoot on the angle (radial lines of constant ζ).')}`,
      () => { const wn = R.int(2, 12), z = R.pick([.2, .3, .4, .5, .6, .7]); const b = 2 * z * wn, c = wn * wn, OS = 100 * Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)); return nm2(`G(s) = ${c}/(s² + ${f3(b)}s + ${c}). Percent overshoot?`, OS, '%', [`ωₙ = √${c} = ${wn}, 2ζωₙ = ${f3(b)} → ζ = ${z}`, `%OS = 100e^{−ζπ/√(1−ζ²)}`, `= <b>${f3(OS)}%</b>`]); }, 'step2'),
  ] });

CH.push({ id: 'ns6', course: '4310', title: 'Ch 6–7 · Stability & steady-state error', blurb: 'The Routh–Hurwitz table, system type and static error constants.',
  learn: [
    Sec('6.2–6.4', 'Routh–Hurwitz criterion', `<p>Build the table from the characteristic polynomial's coefficients. The number of <b>sign changes</b> in the first column = number of right-half-plane poles. Stable ⇔ no sign changes.</p>${EQ('for s³ + a₂s² + a₁s + a₀: stable ⇔ all aᵢ > 0 and a₂a₁ > a₀')}
      ${TRICK('Any missing or negative coefficient means unstable (or marginal) immediately, no table needed. For third order, memorize a₂a₁ > a₀: it answers "range of K for stability" in one line.')}`,
      () => { const a2 = R.int(2, 10), a1 = R.int(2, 15); return nm2(`Closed-loop characteristic equation: s³ + ${a2}s² + ${a1}s + K = 0. Largest K for stability?`, a2 * a1, '', ['third order: need a₂a₁ > a₀ and all positive', `${a2}·${a1} > K`, `K < <b>${a2 * a1}</b> (at K = ${a2 * a1} it oscillates at ω = √${a1})`], 0); }),
    Sec('7.3–7.5', 'Steady-state error & system type', `<p>For unity feedback, system <b>type</b> = number of pure integrators (poles at s = 0) in G(s).</p><table class="t"><tr><th>input</th><th>type 0</th><th>type 1</th><th>type 2</th></tr><tr><td>step</td><td>1/(1 + K_p)</td><td>0</td><td>0</td></tr><tr><td>ramp</td><td>∞</td><td>1/K_v</td><td>0</td></tr><tr><td>parabola</td><td>∞</td><td>∞</td><td>1/K_a</td></tr></table>${EQ('K_p = lim G(s), K_v = lim sG(s), K_a = lim s²G(s) (s → 0)')}
      ${TRICK('Check closed-loop stability <b>first</b>. Steady-state error formulas give a number even for unstable systems, and that number is meaningless.')}`,
      () => { const K = R.int(2, 100), a = R.int(1, 10), b = R.int(1, 10); return nm2(`Unity feedback with G(s) = ${K}/(s(s + ${a})(s + ${b})) (assume stable). Steady-state error to a unit ramp?`, a * b / K, '', ['type 1 → finite ramp error 1/K_v', `K_v = lim sG(s) = ${K}/(${a}·${b}) = ${f3(K / (a * b))}`, `e_ss = 1/K_v = <b>${f3(a * b / K)}</b>`]); }),
  ] });

CH.push({ id: 'ns10', course: '4310', title: 'Ch 8, 10 · Root locus & frequency response', blurb: 'Root-locus rules, Bode plots, gain and phase margins.',
  learn: [
    Sec('8.4', 'Root-locus sketching rules', `<ul><li>Starts at open-loop <b>poles</b> (K = 0), ends at <b>zeros</b> (K → ∞) or at infinity.</li><li>On the real axis, it exists to the <b>left of an odd number</b> of real poles + zeros.</li><li>Asymptotes: angles (2k + 1)180°/(P − Z), centered at σ = (Σpoles − Σzeros)/(P − Z).</li></ul>
      ${TRICK('Count first: P − Z branches go to infinity. With 3 poles and no zeros, the asymptotes are at ±60° and 180°, so the locus always crosses into the right half-plane for large enough K.')}`,
      () => { const p = [0, -R.int(1, 5), -R.int(6, 12)]; const z = R.pick([[], [-R.int(2, 8)]]); const n = p.length - z.length, sig = (p.reduce((a, b) => a + b, 0) - z.reduce((a, b) => a + b, 0)) / n; return nm2(`Open-loop poles at ${p.join(', ')}${z.length ? ` and a zero at ${z[0]}` : ' (no zeros)'}. Where do the asymptotes intersect the real axis?`, sig, '', [`P − Z = ${n}`, `σ = (Σpoles − Σzeros)/(P − Z) = (${p.reduce((a, b) => a + b, 0)} − (${z.reduce((a, b) => a + b, 0)}))/${n}`, `= <b>${f3(sig)}</b>`]); }),
    Sec('10.2–10.7', 'Bode plots, gain margin and phase margin', `<p>Each pole: −20 dB/decade after its corner and −90° total phase. Each zero: +20 dB/decade and +90°.</p><p><b>Gain margin</b>: how much gain (dB) you can add before |GH| = 0 dB at the frequency where the phase is −180°. <b>Phase margin</b>: 180° + ∠GH at the frequency where |GH| = 0 dB.</p>
      ${TRICK('Phase margin ↔ damping: for a standard second-order system, ζ ≈ PM/100 (for PM below about 70°). PM = 45° → ζ ≈ 0.45 → about 20% overshoot.')}`,
      () => { const pm = R.int(20, 70); return nm2(`A unity-feedback system has a phase margin of ${pm}°. Using ζ ≈ PM/100, estimate its percent overshoot.`, 100 * Math.exp(-(pm / 100) * Math.PI / Math.sqrt(1 - (pm / 100) ** 2)), '%', [`ζ ≈ ${pm / 100}`, `%OS = 100e^{−ζπ/√(1−ζ²)}`, `≈ <b>${f3(100 * Math.exp(-(pm / 100) * Math.PI / Math.sqrt(1 - (pm / 100) ** 2)))}%</b>`]); }, 'bode'),
  ] });
