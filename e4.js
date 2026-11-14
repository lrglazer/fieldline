/* Fieldline — deeper EE: extra sections for Signals (Oppenheim), Electronics (Sedra & Smith), EM (Ulaby), Controls (Nise)
   and the later Circuits chapters (Alexander & Sadiku). Every section: equations, a figure, a worked example, tricks and a generator. */
'use strict';
(() => {
const pushSec = (id, ...secs) => { const c = chById(id); if (c) c.learn.push(...secs); };
const cplx = (re, im) => ({ re, im }), cmag = z => Math.hypot(z.re, z.im), cang = z => Math.atan2(z.im, z.re) * 180 / Math.PI;
const db = x => 20 * Math.log10(x);
const P = (fns, o) => plotFig(fns, o);

/* ===================== SIGNALS (Oppenheim & Willsky) ===================== */
pushSec('ow1',
  Sec('1.5', 'Even/odd parts and periodicity', `${EQ('x_e(t) = ½[x(t) + x(−t)] &nbsp;&nbsp; x_o(t) = ½[x(t) − x(−t)]')}<p>Every signal splits into an even and an odd part. A sum of periodic signals is periodic only if the ratio of periods is rational; the fundamental period is the least common multiple.</p>
    ${FIG(P([{ f: t => Math.cos(2 * t) + Math.sin(3 * t), c: OR }, { f: t => Math.cos(2 * t), c: BL, dash: '6 5' }, { f: t => Math.sin(3 * t), c: GR, dash: '3 4' }], { x: [-6.3, 6.3], y: [-2.2, 2.2], gx: [-2 * Math.PI, 0, 2 * Math.PI], gxl: v => v ? (v > 0 ? '2π' : '−2π') : '0', gy: [-2, 0, 2], xl: 't', yl: 'x(t)', draw: true }), 'cos 2t (period π) + sin 3t (period 2π/3): the sum repeats every LCM = 2π. The cosine is the even part, the sine the odd part.')}
    ${TRICK('Discrete time is pickier: cos(ω₀n) is periodic only if ω₀/2π is a rational number m/N, and then N (in lowest terms) is the period. cos(n/4) is NOT periodic.')}`,
    () => { const a = R.pick([2, 3, 4, 6]), b = R.pick([3, 5, 8, 9]); const g = (x, y) => y ? g(y, x % y) : x; const T1 = 2 / a, T2 = 2 / b; const L = 2 / g(a, b); return nm2(`Fundamental period of x(t) = cos(${a}πt) + sin(${b}πt)? (in seconds)`, L, 's', [`T₁ = 2π/${a}π = ${f3(T1)} s, T₂ = 2π/${b}π = ${f3(T2)} s`, `T = LCM = 2/gcd(${a}, ${b}) = <b>${f3(L)} s</b>`]); }),
);
pushSec('ow2',
  Sec('2.4', 'Graphical convolution, step by step', `${EQ('y(t) = ∫ x(τ) h(t − τ) dτ &nbsp;&nbsp; flip h, slide by t, multiply, integrate')}
    ${FIG(P([{ f: t => (t >= 0 && t <= 1 ? 1 : 0), c: BL, w: 2.2, lab: [.15, 1.12, 'x(t) = rect'] }, { f: t => (t >= 0 && t <= 1 ? t : t > 1 && t <= 2 ? 2 - t : 0), c: OR, lab: [1.1, .95, 'y = x * x (triangle)'] }], { x: [-.5, 2.6], y: [-.1, 1.3], gx: [0, 1, 2], gy: [0, 1], xl: 't', yl: '', draw: true }), 'A unit pulse convolved with itself is a triangle twice as wide: the overlap area grows linearly, then shrinks.')}
    ${EX('x(t) = u(t) − u(t − 2), h(t) = e^{−t}u(t). Find y(t) for 0 < t < 2.', ['overlap is 0 < τ < t', 'y = ∫₀ᵗ e^{−(t−τ)} dτ', '= 1 − e^{−t}'], '1 − e^{−t}')}
    ${TRICK('Width check: the output of convolution has length = sum of the input lengths (continuous time) or N₁ + N₂ − 1 samples (discrete). Start time = sum of start times.')}`,
    () => { const x = Array.from({ length: R.int(2, 3) }, () => R.int(1, 3)), h = Array.from({ length: R.int(2, 3) }, () => R.int(-1, 2)); const y = Array(x.length + h.length - 1).fill(0); x.forEach((a, i) => h.forEach((b, j) => y[i + j] += a * b)); const k = R.int(0, y.length - 1); return numQ(`x[n] = {${x.join(', ')}} and h[n] = {${h.join(', ')}}, both starting at n = 0. What is y[${k}] = (x * h)[${k}]?`, y[k], '', [`y[n] = Σ x[m] h[n − m]`, `full result y = {${y.join(', ')}}`, `y[${k}] = <b>${y[k]}</b>`], { abs: 0 }); }),
);
pushSec('ow3',
  Sec('4.4–4.6', 'Fourier transform pairs & properties', `<table class="t"><tr><th>x(t)</th><th>X(jω)</th></tr><tr><td>δ(t)</td><td>1</td></tr><tr><td>e^{−at}u(t)</td><td>1/(a + jω)</td></tr><tr><td>rect, width T</td><td>T·sinc: 2 sin(ωT/2)/ω</td></tr><tr><td>cos ω₀t</td><td>π[δ(ω − ω₀) + δ(ω + ω₀)]</td></tr><tr><td>x(t − t₀)</td><td>e^{−jωt₀}X(jω)</td></tr><tr><td>x(t) * h(t)</td><td>X(jω)H(jω)</td></tr><tr><td>dx/dt</td><td>jωX(jω)</td></tr></table>
    ${FIG(P([{ f: w => Math.abs(w) < 1e-6 ? 2 : 2 * Math.sin(w) / w, c: OR }], { x: [-15, 15], y: [-.6, 2.3], gx: [-2 * Math.PI, 0, 2 * Math.PI], gxl: v => v ? (v > 0 ? '2π/T' : '−2π/T') : '0', gy: [0, 2], xl: 'ω', yl: 'X(jω)', draw: true }), 'A rectangular pulse of width T transforms to a sinc with first zeros at ω = ±2π/T. Narrower pulse → wider spectrum.')}
    ${TRICK('Time–frequency duality: compress in time by a, stretch in frequency by a (and scale by 1/|a|). Short pulses need big bandwidth. That one sentence answers a lot of conceptual questions.')}`,
    () => { const a = R.pick([1, 2, 5, 10]), w = R.pick([1, 2, 5, 10, 20]); const m = 1 / Math.hypot(a, w); return nm2(`x(t) = e^{−${a}t}u(t). What is |X(jω)| at ω = ${w} rad/s?`, m, '', [`X(jω) = 1/(${a} + jω)`, `|X| = 1/√(${a}² + ${w}²)`, `= <b>${f3(m)}</b>`]); }),
);
CH.push({ id: 'ow5', course: '3302', title: 'Ch 5, 10 · Discrete-time Fourier & z-transform', blurb: 'The DTFT, the z-transform, ROC and stability, and difference equations to transfer functions.',
  learn: [
    Sec('5.1–5.3', 'The DTFT is periodic', `${EQ('X(e^{jω}) = Σ x[n] e^{−jωn} &nbsp;&nbsp; period 2π in ω')}${FIG(P([{ f: w => Math.abs(Math.sin(2.5 * w) / Math.sin(w / 2 + 1e-9)), c: OR }], { x: [-2 * Math.PI, 2 * Math.PI], y: [0, 5.5], gx: [-2 * Math.PI, -Math.PI, 0, Math.PI, 2 * Math.PI], gxl: v => ({ [-2 * Math.PI]: '−2π', [-Math.PI]: '−π', 0: '0', [Math.PI]: 'π', [2 * Math.PI]: '2π' })[v], gy: [0, 5], xl: 'ω', yl: '|X|', draw: true }), 'DTFT of a 5-sample pulse: the spectrum repeats every 2π. Low frequencies sit near ω = 0 and 2π; the highest frequency is ω = π.')}
      ${TRICK('In discrete time ω = π is the fastest possible oscillation: (−1)ⁿ. A filter that passes ω near π is a high-pass filter.')}`,
      () => { const N = R.pick([3, 4, 5, 8]); return numQ(`x[n] = 1 for n = 0 … ${N - 1} (zero elsewhere). What is X(e^{j0})?`, N, '', ['X(e^{j0}) = Σ x[n] (just add the samples)', `= <b>${N}</b>`], { abs: 0 }); }),
    Sec('10.1–10.7', 'z-transform, ROC and stability', `${EQ('X(z) = Σ x[n] z^{−n} &nbsp;&nbsp; aⁿu[n] ⟷ z/(z − a), |z| > |a|')}<p>A causal LTI system is <b>stable</b> if all poles of H(z) are <b>inside the unit circle</b>. The ROC of a causal signal is outside the outermost pole; stability requires the ROC to include |z| = 1.</p>
      ${EX('y[n] − 0.5y[n−1] = x[n]. Find H(z) and decide stability.', ['transform: Y(z)(1 − 0.5z⁻¹) = X(z)', 'H(z) = 1/(1 − 0.5z⁻¹) = z/(z − 0.5)', 'pole at 0.5, inside the unit circle'], 'stable')}
      ${TRICK('s-plane ↔ z-plane: left half-plane ↔ inside the unit circle; jω-axis ↔ unit circle; z = e^{sT}.')}`,
      () => { const a = R.pick([.3, .5, .8, .9, 1.2, -0.7, 1.5, -1.1]); return mc(`y[n] = ${a}·y[n − 1] + x[n] (causal). Is the system stable?`, ['stable', 'unstable'], Math.abs(a) < 1 ? 0 : 1, [`H(z) = z/(z − ${a}): pole at z = ${a}`, `|${a}| ${Math.abs(a) < 1 ? '<' : '≥'} 1 → <b>${Math.abs(a) < 1 ? 'stable' : 'unstable'}</b>`]); }),
  ] });

/* ===================== ELECTRONICS (Sedra & Smith) ===================== */
pushSec('ss4',
  Sec('4.5', 'Rectifier ripple and peak inverse voltage', `${EQ('V_r ≈ V_p / (f C R) (half-wave) &nbsp;&nbsp; V_r ≈ V_p / (2 f C R) (full-wave)')}${FIG(P([{ f: t => Math.max(0, Math.sin(2 * Math.PI * t)), c: BL, dash: '5 4' }, { f: t => { const tt = t % 1; return tt < .25 ? Math.max(Math.sin(2 * Math.PI * tt), 1 - .18 * (tt + .75)) : 1 - .18 * (tt - .25); }, c: OR, lab: [1.3, 1.08, 'with C: ripple V_r'] }], { x: [0, 3], y: [-.1, 1.25], gx: [0, 1, 2, 3], gy: [0, 1], xl: 't (periods)', yl: 'v_O', draw: true }), 'The capacitor charges to the peak, then discharges slowly through R until the next peak tops it up.')}
    ${TRICK('PIV (peak inverse voltage) of the diode: half-wave and bridge ≈ V_p; center-tapped full-wave ≈ 2V_p. Pick a diode rated above it.')}`,
    () => { const Vp = R.pick([10, 12, 15, 20]), f = 60, C = R.pick([100, 220, 470, 1000]), Rl = R.pick([100, 500, 1000]), full = R.pick([true, false]); const Vr = Vp / ((full ? 2 : 1) * f * C * 1e-6 * Rl); return nm2(`${full ? 'Full' : 'Half'}-wave rectifier, V_p = ${Vp} V (after diode drops), 60 Hz, C = ${C} µF, R = ${Rl} Ω. Ripple voltage?`, Vr, 'V', [`V_r ≈ V_p/(${full ? '2' : ''}fCR)`, `= ${Vp}/(${full ? '2·' : ''}60·${C}µ·${Rl})`, `= <b>${f3(Vr)} V</b>`]); }),
);
pushSec('ss5',
  Sec('5.3', 'MOSFET DC analysis: assume saturation, then check', `${EQ('i_D = ½ k′_n (W/L)(v_GS − V_t)² (saturation, v_DS ≥ v_OV)')}${FIG(P([0.4, .9, 1.6].map((ov, i) => ({ f: v => v < ov ? (ov * v - v * v / 2) * 2 : ov * ov, c: [BL, GR, OR][i], lab: [3.2, ov * ov + .12, `v_OV = ${ov}`] })), { x: [0, 4], y: [0, 3.2], gx: [0, 1, 2, 3, 4], gy: [0, 1, 2, 3], xl: 'v_DS', yl: 'i_D', draw: true }), 'Output characteristics: triode on the left (rising), saturation on the right (flat). The boundary is v_DS = v_OV = v_GS − V_t.')}
    ${EX('V_DD = 10 V, R_D = 4 kΩ, V_GS = 2 V, V_t = 1 V, k′(W/L) = 1 mA/V². Find I_D and V_DS.', ['assume saturation: I_D = ½·1·(1)² = 0.5 mA', 'V_DS = 10 − 0.5·4 = 8 V', 'check: 8 ≥ v_OV = 1 ✓ saturation'], 'I_D = 0.5 mA, V_DS = 8 V')}
    ${TRICK('Saturation in a MOSFET means the CURRENT saturates (flat region). It is the amplifier region. This is the opposite of BJT "saturation", which is the switch-on region. Don\'t mix them up.')}`,
    () => { const VDD = R.pick([5, 10, 12]), RD = R.pick([1, 2, 4, 5]), Vov = R.pick([.5, 1, 1.5]), k = R.pick([1, 2, 4]); const ID = .5 * k * Vov * Vov, VDS = VDD - ID * RD; const sat = VDS >= Vov; return nm2(`NMOS: V_DD = ${VDD} V, R_D = ${RD} kΩ, v_OV = ${Vov} V, k′(W/L) = ${k} mA/V². Assuming saturation, V_DS = ? ${sat ? '' : '(then check whether the assumption holds)'}`, VDS, 'V', [`I_D = ½·${k}·${Vov}² = ${f3(ID)} mA`, `V_DS = ${VDD} − ${f3(ID)}·${RD} = <b>${f3(VDS)} V</b>`, sat ? `${f3(VDS)} ≥ ${Vov} ✓ saturation` : `${f3(VDS)} < ${Vov}: actually in triode, so redo with the triode equation`]); }),
);
pushSec('ss6',
  Sec('6.4', 'BJT amplifier gain the fast way', `${EQ('g_m = I_C / V_T &nbsp;&nbsp; r_π = β / g_m &nbsp;&nbsp; A_v(CE) ≈ −g_m (R_C ∥ R_L)')}<p>With an unbypassed emitter resistor R_E, gain becomes ≈ −(R_C ∥ R_L)/(r_e + R_E), where r_e = V_T/I_E ≈ 1/g_m. That trades gain for stability.</p>
    ${TRICK('Gain of a CE stage with R_E ≈ −R_C/R_E when R_E ≫ r_e. "Collector over emitter resistance" works on most quick-check questions.')}
    ${TRICK('Max gain of any BJT CE stage ≈ −V_RC/V_T: the DC drop across R_C divided by 25 mV. 5 V across R_C → gain ≈ −200.')}`,
    () => { const IC = R.pick([.5, 1, 2, 4]), RC = R.pick([2, 4, 5, 10]), RL = R.pick([5, 10, 20, 1e9]); const gm = IC / .025, Rp = RL > 1e8 ? RC : RC * RL / (RC + RL); return nm2(`CE amplifier, I_C = ${IC} mA, R_C = ${RC} kΩ, ${RL > 1e8 ? 'no load' : `R_L = ${RL} kΩ`}, V_T = 25 mV. Voltage gain A_v?`, -gm * Rp, 'V/V', [`g_m = ${IC}/0.025 = ${f3(gm)} mA/V`, `R_C ∥ R_L = ${f3(Rp)} kΩ`, `A_v = −g_m(R_C ∥ R_L) = <b>${f3(-gm * Rp)}</b>`]); }),
);
CH.push({ id: 'ss9', course: '3310', title: 'Ch 9–10 · Differential pairs & frequency response', blurb: 'Differential and common-mode gain, CMRR, coupling/bypass capacitors and the Miller effect.',
  learn: [
    Sec('9.1–9.4', 'The differential pair', `${EQ('A_d = g_m R_D &nbsp;&nbsp; A_cm ≈ −R_D/(2R_SS) &nbsp;&nbsp; CMRR = |A_d/A_cm|')}<p>Two matched transistors share a tail current source. A difference between the inputs steers current from one side to the other; a common change does almost nothing because the tail current is fixed.</p>
      ${TRICK('Single-ended output gain is half the differential gain: g_mR_D/2.')}${TRICK('CMRR in dB = 20 log|A_d/A_cm|. A better (higher-resistance) tail source raises CMRR.')}`,
      () => { const gm = R.pick([1, 2, 4]), RD = R.pick([5, 10, 20]), RSS = R.pick([50, 100, 200]); const Ad = gm * RD, Acm = RD / (2 * RSS); return nm2(`Differential pair: g_m = ${gm} mA/V, R_D = ${RD} kΩ, R_SS = ${RSS} kΩ. CMRR in dB?`, db(Ad / Acm), 'dB', [`A_d = g_mR_D = ${Ad}`, `A_cm = R_D/2R_SS = ${f3(Acm)}`, `CMRR = 20 log(${f3(Ad / Acm)}) = <b>${f3(db(Ad / Acm))} dB</b>`]); }),
    Sec('10.1–10.4', 'Frequency response and the Miller effect', `${FIG(P([{ f: lw => { const w = 10 ** lw; return 40 - 10 * Math.log10(1 + (10 / w) ** 2) - 10 * Math.log10(1 + (w / 1e5) ** 2); }, c: OR }], { x: [0, 7], y: [0, 45], gx: [1, 2, 3, 4, 5, 6], gxl: v => '10^' + v, gy: [0, 20, 37, 40], xl: 'frequency (Hz)', yl: 'gain (dB)', vlines: [[1, 37], [5, 37]], marks: [[1, 37, 'f_L (coupling caps)', BL], [5, 37, 'f_H (device caps)', BL, -110]], draw: true }), 'Mid-band gain is flat. Coupling and bypass capacitors set f_L; the transistor\'s internal capacitances set f_H. Bandwidth ≈ f_H − f_L ≈ f_H.')}
      ${EQ('C_in = C_gd (1 + |A_v|) &nbsp;(Miller)')}${TRICK('The Miller effect multiplies a small gate–drain (or base–collector) capacitance by the gain, so it usually sets f_H in a CE/CS stage. Cascode and CB stages avoid it.')}`,
      () => { const Cgd = R.pick([.5, 1, 2]), Av = R.pick([20, 50, 100]), Rs = R.pick([1, 5, 10]); const Cin = Cgd * (1 + Av), fH = 1 / (2 * Math.PI * Rs * 1e3 * Cin * 1e-12); return nm2(`CS stage: C_gd = ${Cgd} pF, |A_v| = ${Av}, source resistance ${Rs} kΩ (ignore C_gs). Estimate f_H in MHz.`, fH / 1e6, 'MHz', [`C_in = ${Cgd}(1 + ${Av}) = ${f3(Cin)} pF`, `f_H = 1/(2πR_sC_in)`, `= <b>${f3(fH / 1e6)} MHz</b>`]); }),
  ] });

/* ===================== EM FIELDS (Ulaby) ===================== */
CH.push({ id: 'ul4', course: '4301', title: 'Ch 4–5 · Electrostatics & magnetostatics', blurb: 'Coulomb, Gauss, potential, capacitance, Biot–Savart, Ampère and inductance in engineering form.',
  learn: [
    Sec('4.3–4.5', 'Gauss\'s law and potential', `${EQ('∮ D·ds = Q_enc &nbsp;&nbsp; E = −∇V &nbsp;&nbsp; C = εA/d (parallel plate)')}${FIG(fieldFig([{ x: 180, y: 160, q: 1 }, { x: 340, y: 160, q: -1 }], { w: 520, h: 320 }), 'Field lines leave + and end on −; equipotentials cross them at right angles.')}
      ${TRICK('Pick the Gaussian surface by symmetry: sphere for a point charge, cylinder for a line charge (E = ρ_l/2πεr), pillbox for a sheet (E = ρ_s/2ε, independent of distance).')}`,
      () => { const er = R.pick([1, 2.2, 4, 10]), A = R.pick([1, 2, 5]), d = R.pick([.1, .5, 1]); const C = 8.854e-12 * er * A * 1e-4 / (d * 1e-3); return nm2(`Parallel-plate capacitor: A = ${A} cm², d = ${d} mm, ε_r = ${er}. C in pF?`, C * 1e12, 'pF', [`C = ε₀ε_rA/d`, `= 8.854×10⁻¹² · ${er} · ${A}×10⁻⁴ / ${d}×10⁻³`, `= <b>${f3(C * 1e12)} pF</b>`]); }),
    Sec('5.2–5.4', 'Biot–Savart, Ampère and inductance', `${EQ('B = μ₀I/(2πr) (long wire) &nbsp;&nbsp; B = μ₀nI (solenoid) &nbsp;&nbsp; L′ = (μ/2π) ln(b/a) (coax)')}<p>Ampère's law is the magnetic Gauss's law: pick a loop where H is constant and parallel to dl. Inductance = flux linkage / current.</p>
      ${TRICK('Coax: C′ = 2πε/ln(b/a) and L′ = (μ/2π)ln(b/a), so L′C′ = με and Z₀ = √(L′/C′) = (60/√ε_r) ln(b/a) Ω.')}`,
      () => { const er = R.pick([1, 2.25, 2.1]), ba = R.pick([2.3, 3, 3.5, 5]); const Z = 60 / Math.sqrt(er) * Math.log(ba); return nm2(`Coax with b/a = ${ba} and ε_r = ${er}. Characteristic impedance Z₀?`, Z, 'Ω', [`Z₀ = (60/√ε_r) ln(b/a)`, `= (60/${f3(Math.sqrt(er))}) ln ${ba}`, `= <b>${f3(Z)} Ω</b>`]); }, 'rhr', { mode: 'wire' }),
    Sec('6.1–6.3', 'Faraday\'s law and motional EMF', `${EQ('emf = −dΦ/dt &nbsp;&nbsp; motional: emf = ∮(u × B)·dl = BLu')}<p>Lenz: the induced current opposes the change in flux. A transformer EMF comes from a changing B; a motional EMF from a conductor moving through B. A generator has both viewpoints at once.</p>
      ${TRICK('For a rotating loop, emf = NBAω sin ωt: the peak is NBAω. Doubling the speed doubles both the amplitude and the frequency.')}`,
      () => { const N = R.pick([10, 50, 100]), B = R.pick([.1, .2, .5]), A = R.pick([.01, .02, .05]), rpm = R.pick([600, 1200, 1800, 3600]); const w = rpm * 2 * Math.PI / 60; return nm2(`Generator: N = ${N} turns, B = ${B} T, A = ${A} m², ${rpm} rpm. Peak EMF?`, N * B * A * w, 'V', [`ω = ${rpm}·2π/60 = ${f3(w)} rad/s`, `peak = NBAω = ${N}·${B}·${A}·${f3(w)}`, `= <b>${f3(N * B * A * w)} V</b>`]); }, 'rhr', { mode: 'loop' }),
  ] });
pushSec('ul2',
  Sec('2.9–2.11', 'Smith chart thinking and quarter-wave matching', `${EQ('Z_in(λ/4) = Z₀²/Z_L &nbsp;&nbsp; matching: Z₀(QW) = √(Z₁Z_L)')}<p>A quarter-wave line <b>inverts</b> impedance: short ↔ open, small ↔ large. A half-wave line repeats Z_L. Moving toward the generator turns clockwise on the Smith chart; one full turn is λ/2.</p>
    ${TRICK('VSWR and |Γ|: S = (1 + |Γ|)/(1 − |Γ|), |Γ| = (S − 1)/(S + 1). Matched: S = 1. Short or open: S = ∞.')}`,
    () => { const Z1 = R.pick([50, 75]), ZL = R.pick([25, 100, 200, 300]); return nm2(`Match a ${ZL} Ω load to a ${Z1} Ω line with a quarter-wave transformer. Its Z₀?`, Math.sqrt(Z1 * ZL), 'Ω', [`Z₀ = √(Z₁Z_L) = √(${Z1}·${ZL})`, `= <b>${f3(Math.sqrt(Z1 * ZL))} Ω</b>`]); }),
);
pushSec('ul7',
  Sec('8.1–8.3', 'Reflection and transmission at a boundary', `${EQ('Γ = (η₂ − η₁)/(η₂ + η₁) &nbsp;&nbsp; τ = 1 + Γ &nbsp;&nbsp; η = 377/√ε_r Ω')}<p>A wave hitting a new medium partly reflects. The reflected fraction of power is |Γ|²; the rest is transmitted (lossless media). Total internal reflection happens going from high to low ε beyond the critical angle sin θ_c = √(ε₂/ε₁).</p>
    ${TRICK('Air → glass (ε_r = 4): η₂ = η₁/2, Γ = −1/3, so only |Γ|² ≈ 11% of the power reflects.')}`,
    () => { const er = R.pick([2.25, 4, 9, 16, 81]); const G = (1 / Math.sqrt(er) - 1) / (1 / Math.sqrt(er) + 1); return nm2(`Plane wave in air hits a lossless dielectric (ε_r = ${er}) at normal incidence. Fraction of power reflected (|Γ|²)?`, G * G, '', [`η₂/η₁ = 1/√${er} = ${f3(1 / Math.sqrt(er))}`, `Γ = (η₂ − η₁)/(η₂ + η₁) = ${f3(G)}`, `|Γ|² = <b>${f3(G * G)}</b>`]); }),
);

/* ===================== CONTROLS (Nise) ===================== */
pushSec('ns2',
  Sec('2.4–2.6', 'Modeling: electrical and mechanical analogs', `${EQ('m s² + b s + k ↔ L s + R + 1/(Cs) &nbsp;&nbsp; G(s) = X(s)/F(s) = 1/(ms² + bs + k)')}${FIG(P([{ f: t => 1 - Math.exp(-.5 * t) * (Math.cos(1.94 * t) + .26 * Math.sin(1.94 * t)), c: OR }], { x: [0, 12], y: [0, 1.6], gx: [0, 4, 8, 12], gy: [0, 1], xl: 't (s)', yl: 'x(t)/x_ss', draw: true }), 'Step response of a mass–spring–damper (m = 1, b = 1, k = 4): underdamped, it overshoots and rings before settling.')}
    ${TRICK('Impedance method: mass → Ms², damper → f_v s, spring → K. Write "sum of impedances × X = F" for each mass exactly like a nodal equation.')}`,
    () => { const m = R.pick([1, 2, 4]), b = R.pick([2, 4, 8]), k = R.pick([8, 16, 32]); const wn = Math.sqrt(k / m), z = b / (2 * Math.sqrt(k * m)); return nm2(`Mass–spring–damper: m = ${m} kg, b = ${b} N·s/m, k = ${k} N/m. Damping ratio ζ?`, z, '', [`G = 1/(${m}s² + ${b}s + ${k})`, `ω_n = √(k/m) = ${f3(wn)}, 2ζω_n = b/m`, `ζ = b/(2√(km)) = <b>${f3(z)}</b>`]); }),
);
pushSec('ns4',
  Sec('4.6–4.7', 'Specs from poles: %OS, Ts, Tp', `${EQ('%OS = 100 e^{−ζπ/√(1−ζ²)} &nbsp;&nbsp; T_s ≈ 4/(ζω_n) &nbsp;&nbsp; T_p = π/(ω_n√(1−ζ²))')}${FIG(P([.2, .5, .8].map((z, i) => ({ f: t => { const wd = Math.sqrt(1 - z * z); return 1 - Math.exp(-z * t) * (Math.cos(wd * t) + z / wd * Math.sin(wd * t)); }, c: [RD, OR, BL][i], lab: [[3.7, 5.6, 7.4][i], [1.58, 1.22, .8][i], `ζ = ${z}`] })), { x: [0, 14], y: [0, 1.7], gx: [0, 5, 10], gy: [0, 1], xl: 'ω_n t', yl: 'c(t)', draw: true }), 'Smaller ζ → more overshoot and ringing. ζ ≈ 0.7 is a common sweet spot.')}
    ${TRICK('Pole position reading: real part −ζω_n sets T_s; imaginary part ω_d sets T_p; the angle θ from the negative real axis gives ζ = cos θ and therefore %OS. Vertical lines = constant T_s, horizontal = constant T_p, rays = constant %OS.')}`,
    () => { const z = R.pick([.2, .3, .4, .5, .6, .7]), wn = R.pick([2, 4, 5, 10]); const os = 100 * Math.exp(-z * Math.PI / Math.sqrt(1 - z * z)); return R.pick([
      () => nm2(`Second-order system with ζ = ${z}. Percent overshoot?`, os, '%', [`%OS = 100e^{−ζπ/√(1−ζ²)}`, `= <b>${f3(os)}%</b>`]),
      () => nm2(`ζ = ${z}, ω_n = ${wn} rad/s. 2% settling time T_s?`, 4 / (z * wn), 's', [`T_s ≈ 4/(ζω_n) = 4/(${z}·${wn})`, `= <b>${f3(4 / (z * wn))} s</b>`]),
    ])(); }),
);
pushSec('ns6',
  Sec('7.6', 'Steady-state error table', `<table class="t"><tr><th>Type</th><th>step input</th><th>ramp</th><th>parabola</th></tr><tr><td>0</td><td>1/(1 + K_p)</td><td>∞</td><td>∞</td></tr><tr><td>1</td><td>0</td><td>1/K_v</td><td>∞</td></tr><tr><td>2</td><td>0</td><td>0</td><td>1/K_a</td></tr></table>${EQ('K_p = lim G(s) &nbsp; K_v = lim sG(s) &nbsp; K_a = lim s²G(s) &nbsp; (s → 0)')}
    ${TRICK('System type = number of pure integrators (poles at s = 0) in the open-loop G(s). Count them before anything else, then the table fills itself in.')}`,
    () => { const K = R.pick([5, 10, 20, 50]), a = R.pick([2, 4, 5]), b = R.pick([1, 3, 10]); const Kv = K / (a * b); return nm2(`Unity feedback, G(s) = ${K}/[s(s + ${a})(s + ${b})]. Steady-state error to a unit ramp?`, 1 / Kv, '', ['one pole at 0 → type 1 → finite ramp error', `K_v = lim sG = ${K}/(${a}·${b}) = ${f3(Kv)}`, `e_ss = 1/K_v = <b>${f3(1 / Kv)}</b>`]); }),
);
pushSec('ns10',
  Sec('9.2–9.4', 'Lead and lag compensators', `${EQ('G_c(s) = K (s + z_c)/(s + p_c) &nbsp;&nbsp; lead: |z_c| < |p_c| &nbsp;&nbsp; lag: |z_c| > |p_c|')}<p><b>Lead</b> adds phase near crossover: faster response and more phase margin (a practical PD). <b>Lag</b> adds low-frequency gain: smaller steady-state error with little change to the transient (a practical PI).</p>
    ${TRICK('Maximum phase from a lead network: sin φ_max = (1 − α)/(1 + α), with α = z_c/p_c, at ω = √(z_c p_c).')}`,
    () => { const zc = R.pick([1, 2, 4]), pc = zc * R.pick([4, 5, 10]); const a = zc / pc, ph = Math.asin((1 - a) / (1 + a)) * 180 / Math.PI; return nm2(`Lead compensator zero at −${zc}, pole at −${pc}. Maximum phase lead (degrees)?`, ph, '°', [`α = ${zc}/${pc} = ${f3(a)}`, `sin φ = (1 − α)/(1 + α) = ${f3((1 - a) / (1 + a))}`, `φ_max = <b>${f3(ph)}°</b> at ω = √(${zc}·${pc}) = ${f3(Math.sqrt(zc * pc))}`]); }),
);

/* ===================== CIRCUITS (Alexander & Sadiku), later chapters ===================== */
pushSec('as6',
  Sec('6.4–6.5', 'Series/parallel C and L, and stored energy', `${EQ('C_series: 1/C = Σ 1/C_i &nbsp;&nbsp; C_parallel = Σ C_i &nbsp;&nbsp; w_C = ½CV² &nbsp;&nbsp; w_L = ½LI²')}<p>Capacitors combine like conductances (opposite to resistors); inductors combine like resistors. In DC steady state a capacitor is an <b>open</b> and an inductor is a <b>short</b>.</p>
    ${TRICK('Capacitor voltage and inductor current cannot jump. Everything at t = 0⁺ follows from that one rule.')}`,
    () => { const c = Array.from({ length: 3 }, () => R.pick([2, 3, 4, 6, 12])); const ser = 1 / c.reduce((a, x) => a + 1 / x, 0); return R.pick([
      () => nm2(`Capacitors ${c.join(' µF, ')} µF in series. Equivalent?`, ser, 'µF', ['1/C = Σ 1/C_i', `= <b>${f3(ser)} µF</b>`]),
      () => nm2(`Inductors ${c.join(' mH, ')} mH in series. Equivalent?`, c[0] + c[1] + c[2], 'mH', ['inductors add like resistors in series', `= <b>${c[0] + c[1] + c[2]} mH</b>`]),
    ])(); }, 'circuit', { preset: 'rc' }),
);
pushSec('as7',
  Sec('7.6', 'The universal first-order formula', `${EQ('x(t) = x(∞) + [x(0⁺) − x(∞)] e^{−t/τ} &nbsp;&nbsp; τ = RC or L/R')}${FIG(P([{ f: t => 10 * (1 - Math.exp(-t)), c: OR, lab: [3, 8.4, 'charging'] }, { f: t => 10 * Math.exp(-t), c: BL, lab: [2.2, 2.3, 'discharging'] }], { x: [0, 5], y: [0, 11], gx: [0, 1, 2, 3, 4, 5], gxl: v => v + 'τ', gy: [0, 6.3, 10], gyl: v => v === 6.3 ? '63%' : v, xl: 't', yl: 'v_C', draw: true }), 'After 1τ: 63% of the way there. After 5τ: >99%, "done" for engineering purposes.')}
    ${TRICK('Three numbers solve every first-order problem: x(0⁺), x(∞), τ. Use R_Th seen by the C or L (sources zeroed) for τ.')}`,
    () => { const R0 = R.pick([1, 2, 5, 10]), C = R.pick([1, 10, 100]), Vs = R.pick([5, 10, 12]), n = R.pick([.5, 1, 2, 3]); const tau = R0 * C * 1e-3; return nm2(`RC charging: R = ${R0} kΩ, C = ${C} µF, source ${Vs} V, v_C(0) = 0. v_C at t = ${f3(n * tau * 1000)} ms?`, Vs * (1 - Math.exp(-n)), 'V', [`τ = RC = ${f3(tau * 1000)} ms`, `t/τ = ${n}`, `v = ${Vs}(1 − e^{−${n}}) = <b>${f3(Vs * (1 - Math.exp(-n)))} V</b>`]); }, 'circuit', { preset: 'rc' }),
);
pushSec('as8',
  Sec('8.3–8.5', 'Series and parallel RLC: three kinds of response', `${EQ('series: α = R/2L &nbsp;&nbsp; parallel: α = 1/(2RC) &nbsp;&nbsp; ω₀ = 1/√(LC)')}<p>α > ω₀ overdamped (two real roots); α = ω₀ critically damped; α < ω₀ underdamped (rings at ω_d = √(ω₀² − α²)).</p>
    ${TRICK('Series vs parallel α are "opposites": a bigger R damps a series RLC more but a parallel RLC less.')}`,
    () => { const R0 = R.pick([10, 40, 100, 200]), L = R.pick([.01, .1]), C = R.pick([1e-6, 1e-5, 1e-4]); const a = R0 / (2 * L), w0 = 1 / Math.sqrt(L * C); const kind = Math.abs(a - w0) / w0 < .02 ? 'critically damped' : a > w0 ? 'overdamped' : 'underdamped'; return mcFrom(`Series RLC: R = ${R0} Ω, L = ${L * 1000} mH, C = ${C * 1e6} µF. The natural response is…`, kind, ['overdamped', 'underdamped', 'critically damped', 'undamped'], [`α = R/2L = ${f3(a)} s⁻¹`, `ω₀ = 1/√(LC) = ${f3(w0)} rad/s`, `→ <b>${kind}</b>`]); }),
);
pushSec('as11',
  Sec('11.6–11.8', 'Complex power and power factor correction', `${EQ('S = P + jQ = V_rms I_rms* &nbsp;&nbsp; pf = P/|S| = cos θ &nbsp;&nbsp; C = P(tan θ₁ − tan θ₂)/(ω V²_rms)')}${FIG(SVG(520, 240, arr(80, 200, 380, 200, BL, 2.6, 'P (W)', { lx: 230, ly: 224 }) + arr(380, 200, 380, 60, RD, 2.6, 'Q (VAR)', { lx: 430, ly: 130 }) + arr(80, 200, 380, 60, OR, 3, '|S| (VA)', { lx: 210, ly: 112 }) + tx(130, 190, 'θ', { it: true, s: 18 })), 'The power triangle: real power does work, reactive power sloshes back and forth, apparent power is what the wiring must carry.')}
    ${TRICK('Inductive (motor) loads lag: Q > 0. Add a parallel capacitor to cancel Q and bring pf toward 1. P does not change.')}`,
    () => { const P0 = R.pick([5, 10, 20, 50]) * 1e3, pf1 = R.pick([.6, .7, .75, .8]), pf2 = R.pick([.9, .95, 1]), V = R.pick([120, 240, 480]); const t1 = Math.tan(Math.acos(pf1)), t2 = Math.tan(Math.acos(pf2)); const C = P0 * (t1 - t2) / (2 * Math.PI * 60 * V * V); return nm2(`A ${P0 / 1000} kW load at ${pf1} lagging, ${V} V rms, 60 Hz. Parallel capacitance to raise pf to ${pf2}? (µF)`, C * 1e6, 'µF', [`Q₁ = P tan θ₁ = ${f3(P0 * t1 / 1000)} kVAR, Q₂ = P tan θ₂ = ${f3(P0 * t2 / 1000)} kVAR`, `Q_C = ${f3(P0 * (t1 - t2) / 1000)} kVAR = ωCV²`, `C = <b>${f3(C * 1e6)} µF</b>`]); }),
);
})();
