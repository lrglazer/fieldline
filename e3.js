/* Fieldline — EE 3310/3311 Electronic Devices & Circuits (Sedra & Smith) and EE 4301 Electromagnetic Engineering (Ulaby). */
'use strict';
const VT = .025;

/* ================= EE 3310/3311 ================= */
CH.push({ id: 'ss3', course: '3310', title: 'Ch 3 · Semiconductors', blurb: 'Intrinsic carriers, doping, n·p = nᵢ², drift and diffusion, and the pn junction.',
  learn: [
    Sec('3.1–3.2', 'Intrinsic and doped semiconductors', `${EQ('n·p = nᵢ² &nbsp;&nbsp; nᵢ(Si, 300 K) ≈ 1.5×10¹⁰ cm⁻³')}<p><b>n-type</b> (donors, N_D): n ≈ N_D, p = nᵢ²/N_D. <b>p-type</b> (acceptors, N_A): p ≈ N_A, n = nᵢ²/N_A. The majority carrier is set by doping; the minority carrier by the mass-action law.</p>
      ${TRICK('More doping makes the <b>minority</b> concentration smaller, not bigger. Doping 10¹⁶ donors drops holes from 10¹⁰ to about 10⁴ cm⁻³.')}`,
      () => { const ND = R.pick([1e15, 1e16, 1e17, 5e16]); return nm2(`Silicon at 300 K (nᵢ = 1.5×10¹⁰ cm⁻³) is doped with N_D = ${sci(ND)} cm⁻³. Hole concentration?`, 2.25e20 / ND, 'cm⁻³', [`n ≈ N_D = ${sci(ND)}`, `p = nᵢ²/n = (1.5×10¹⁰)²/${sci(ND)}`, `= <b>${sci(2.25e20 / ND)} cm⁻³</b>`]); }),
    Sec('3.3–3.5', 'The pn junction', `${EQ('V₀ = V_T ln(N_AN_D/nᵢ²) &nbsp;&nbsp; V_T = kT/q ≈ 25 mV at room temperature')}<p>Carriers diffuse across, leaving a depletion region with a built-in potential V₀ (≈ 0.6–0.8 V for Si). Forward bias shrinks the barrier; reverse bias widens it. The depletion region extends farther into the <b>more lightly doped</b> side.</p>
      ${TRICK('W extends mostly into the lightly doped side: x_n/x_p = N_A/N_D. In a p⁺n junction almost all of the depletion width is on the n side.')}`,
      () => { const NA = R.pick([1e16, 1e17, 1e18]), ND = R.pick([1e15, 1e16, 1e17]); return nm2(`Silicon pn junction: N_A = ${sci(NA)}, N_D = ${sci(ND)} cm⁻³, V_T = 25.9 mV. Built-in voltage?`, .0259 * Math.log(NA * ND / 2.25e20), 'V', [`V₀ = V_T ln(N_AN_D/nᵢ²)`, `= 0.0259 ln(${sci(NA * ND)}/2.25×10²⁰)`, `= <b>${f3(.0259 * Math.log(NA * ND / 2.25e20))} V</b>`]); }),
  ] });

CH.push({ id: 'ss4', course: '3310', title: 'Ch 4 · Diodes', blurb: 'The exponential model, constant-drop model, rectifiers, Zener regulators and clippers.',
  learn: [
    Sec('4.2–4.3', 'Diode models', `${EQ('i = I_S(e^{v/(nV_T)} − 1) &nbsp;&nbsp; V₂ − V₁ = nV_T ln(I₂/I₁)')}<p>Constant-voltage-drop model: on → 0.7 V, off → open. Ideal model: on → short, off → open.</p>
      ${TRICK('Every 10× increase in current raises a silicon diode\'s voltage by about <b>60 mV</b> (2.3·V_T for n = 1). Every 2× is about 17 mV. You can answer most exponential-model questions with this alone.')}
      ${TRICK('Assume-and-check: guess each diode on or off, solve, then verify (on → i > 0; off → v &lt; 0.7 V). If a check fails, flip that guess and redo.')}`,
      () => { const I1 = R.pick([.1, 1, 2, 5]), k = R.pick([2, 10, 100, .5]), V1 = .7; return nm2(`A diode drops ${V1} V at ${I1} mA. Voltage at ${f3(I1 * k)} mA? (n = 1, V_T = 25 mV)`, V1 + .025 * Math.log(k), 'V', [`ΔV = V_T ln(I₂/I₁) = 0.025 ln(${k})`, `= ${f3(.025 * Math.log(k) * 1000)} mV`, `V = <b>${f3(V1 + .025 * Math.log(k))} V</b>`]); }),
    Sec('4.4–4.6', 'Zener diodes and rectifiers', `<p><b>Half-wave</b> rectifier: V_out,peak = V_p − 0.7. <b>Full-wave bridge</b>: V_p − 1.4 (two diodes conduct). With a smoothing capacitor, ripple ≈ V_p/(fRC) (half-wave) or V_p/(2fRC) (full-wave).</p><p>A <b>Zener</b> in reverse breakdown holds V_Z nearly constant: a simple regulator.</p>
      ${TRICK('Full-wave ripple uses 2f because the capacitor is recharged twice per cycle. PIV (peak inverse voltage) for a bridge is about V_p; for a center-tapped full-wave it\'s about 2V_p.')}`,
      () => { const Vp = R.int(10, 30), f = R.pick([60, 50]), Rr = R.int(1, 10), C = R.int(100, 2000), full = R.pick([true, false]); const Vo = Vp - (full ? 1.4 : .7), rip = Vo / ((full ? 2 : 1) * f * Rr * 1e3 * C * 1e-6); return nm2(`A ${full ? 'full-wave bridge' : 'half-wave'} rectifier: input peak ${Vp} V at ${f} Hz, load ${Rr} kΩ, filter C = ${C} μF. Peak-to-peak ripple?`, rip, 'V', [`V_peak,out = ${Vp} − ${full ? '1.4' : '0.7'} = ${f3(Vo)} V`, `V_r ≈ V_p/(${full ? '2' : ''}fRC) = ${f3(Vo)}/(${full ? 2 * f : f}·${Rr * 1e3}·${C}×10⁻⁶)`, `= <b>${f3(rip)} V</b>`]); }),
  ] });

CH.push({ id: 'ss5', course: '3310', title: 'Ch 5 · MOSFETs', blurb: 'Regions of operation, the square law, biasing, and the small-signal model.',
  learn: [
    Sec('5.1–5.2', 'NMOS regions and the I–V equations', `${EQ('cutoff: v_GS < V_t → i_D = 0')}${EQ('triode: v_DS < v_OV → i_D = k′(W/L)[v_OV v_DS − ½v_DS²]')}${EQ('saturation: v_DS ≥ v_OV → i_D = ½k′(W/L)v_OV²(1 + λv_DS)')}<p>v_OV = v_GS − V_t is the overdrive voltage.</p>
      ${TRICK('Region check in one line: compare v_DS to v_OV (equivalently v_GD to V_t). If v_D ≥ v_G − V_t, it\'s saturated. Always verify the region after solving; if wrong, redo with the other equation.')}
      ${TRICK('In saturation (λ = 0), i_D doesn\'t depend on v_DS at all, so a MOSFET acts like a current source. That\'s what makes it an amplifier.')}`,
      () => { const Vt = R.pick([.4, .5, .7]), k = R.pick([1, 2, 4]), vgs = Vt + R.real(.2, 1.2, 1), vds = R.real(.1, 2.5, 1), vov = vgs - Vt; const sat = vds >= vov, I = sat ? .5 * k * vov * vov : k * (vov * vds - .5 * vds * vds); return nm2(`NMOS: V_t = ${Vt} V, k′(W/L) = ${k} mA/V², v_GS = ${f3(vgs)} V, v_DS = ${vds} V. Drain current (mA)?`, I, 'mA', [`v_OV = ${f3(vov)} V`, `v_DS ${sat ? '≥' : '<'} v_OV → <b>${sat ? 'saturation' : 'triode'}</b>`, sat ? `i_D = ½(${k})(${f3(vov)})² = <b>${f3(I)} mA</b>` : `i_D = ${k}[${f3(vov)}·${vds} − ½·${vds}²] = <b>${f3(I)} mA</b>`]); }, 'mosfet'),
    Sec('5.4–5.6', 'Small-signal model & the common-source amplifier', `${EQ('g_m = k′(W/L)v_OV = 2I_D/v_OV = √(2k′(W/L)I_D) &nbsp;&nbsp; r_o = 1/(λI_D)')}${EQ('CS gain: A_v = −g_m(R_D ∥ r_o)')}
      ${TRICK('Three equivalent g_m formulas: pick the one whose inputs you have. Given I_D and v_OV, g_m = 2I_D/v_OV is fastest. Doubling I_D at fixed W/L raises g_m only by √2.')}`,
      () => { const I = R.real(.1, 2, 2), vov = R.real(.15, .5, 2), RD = R.int(2, 20); const gm = 2 * I / vov; return nm2(`A MOSFET biased at I_D = ${I} mA with v_OV = ${vov} V drives R_D = ${RD} kΩ (ignore r_o). Voltage gain of the common-source stage?`, -gm * RD, 'V/V', [`g_m = 2I_D/v_OV = 2·${I}/${vov} = ${f3(gm)} mA/V`, `A_v = −g_mR_D = −${f3(gm)}·${RD}`, `= <b>${f3(-gm * RD)} V/V</b>`]); }, 'mosfet'),
  ] });

CH.push({ id: 'ss6', course: '3310', title: 'Ch 6 · BJTs', blurb: 'Modes of operation, i_C = βi_B, DC biasing and small-signal parameters.',
  learn: [
    Sec('6.1–6.3', 'BJT operation and DC analysis', `${EQ('i_C = βi_B &nbsp;&nbsp; i_E = (β + 1)i_B &nbsp;&nbsp; α = β/(β + 1) &nbsp;&nbsp; V_BE ≈ 0.7 V')}<p><b>Active mode</b> (amplifier): BE forward, BC reverse. <b>Saturation</b> (switch on): both forward, V_CE ≈ 0.2 V. <b>Cutoff</b>: both reverse.</p>
      ${TRICK('Bias recipe with an emitter resistor: KVL through base–emitter: V_BB = I_B·R_B + 0.7 + (β + 1)I_B·R_E. Resistors in the emitter look (β + 1) times bigger from the base.')}
      ${TRICK('Check active mode at the end: V_CE > 0.2–0.3 V. If V_CE comes out negative or tiny, the transistor is saturated and i_C = βi_B no longer holds.')}`,
      () => { const VBB = R.int(2, 6), RB = R.int(10, 200), RE = R.real(.2, 2, 1), beta = R.pick([50, 100, 150]), VCC = R.int(10, 15), RC = R.real(1, 5, 1); const IB = (VBB - .7) / (RB + (beta + 1) * RE), IC = beta * IB, VCE = VCC - IC * RC - (beta + 1) * IB * RE; return nm2(`V_BB = ${VBB} V through R_B = ${RB} kΩ, R_E = ${RE} kΩ, β = ${beta}. Collector current (mA)? (V_CC = ${VCC} V, R_C = ${RC} kΩ; assume active)`, IC, 'mA', [`I_B = (${VBB} − 0.7)/(${RB} + ${beta + 1}·${RE}) = ${f3(IB * 1000)} μA`, `I_C = βI_B = <b>${f3(IC)} mA</b>`, `check: V_CE = ${f3(VCE)} V ${VCE > .3 ? '> 0.3 → active ✓' : '→ actually saturated!'}`]); }),
    Sec('6.5', 'Small-signal parameters', `${EQ('g_m = I_C/V_T &nbsp;&nbsp; r_π = β/g_m &nbsp;&nbsp; r_e = α/g_m ≈ V_T/I_E')}${EQ('CE gain: A_v ≈ −g_mR_C (no emitter resistor) &nbsp; ≈ −R_C/(r_e + R_E) (with R_E)')}
      ${TRICK('BJT g_m = I_C/V_T = 40 mA/V per mA of collector current at room temperature. That\'s much larger than a MOSFET at the same current, which is why BJTs give more gain per milliamp.')}`,
      () => { const IC = R.real(.2, 5, 1), beta = R.pick([80, 100, 200]); return nm2(`A BJT at I_C = ${IC} mA, β = ${beta}. Find r_π (kΩ).`, beta / (IC / .025), 'kΩ', [`g_m = I_C/V_T = ${IC}/0.025 = ${f3(IC / .025)} mA/V`, `r_π = β/g_m = <b>${f3(beta / (IC / .025))} kΩ</b>`]); }),
  ] });

/* ================= EE 4301 ================= */
CH.push({ id: 'ul2', course: '4301', title: 'Ch 2 · Transmission lines', blurb: 'Characteristic impedance, reflection coefficient, VSWR, input impedance and quarter-wave transformers.',
  learn: [
    Sec('2.5–2.6', 'Reflection coefficient and standing waves', `${EQ('Γ = (Z_L − Z₀)/(Z_L + Z₀) &nbsp;&nbsp; VSWR = (1 + |Γ|)/(1 − |Γ|)')}<p>Matched (Z_L = Z₀): Γ = 0, no reflection, VSWR = 1. Short: Γ = −1. Open: Γ = +1. Voltage maxima and minima repeat every λ/2.</p>
      ${TRICK('Reflected power fraction is |Γ|², and return loss = −20 log|Γ| dB. VSWR = 2 means |Γ| = 1/3, so only 11% of the power reflects.')}`,
      () => { const Z0 = R.pick([50, 75]), ZL = R.pick([25, 100, 150, 30, 300, 10]); const G = (ZL - Z0) / (ZL + Z0); return nm2(`A ${Z0} Ω line is terminated in ${ZL} Ω (resistive). VSWR?`, (1 + Math.abs(G)) / (1 - Math.abs(G)), '', [`Γ = (${ZL} − ${Z0})/(${ZL} + ${Z0}) = ${f3(G)}`, `VSWR = (1 + ${f3(Math.abs(G))})/(1 − ${f3(Math.abs(G))}) = <b>${f3((1 + Math.abs(G)) / (1 - Math.abs(G)))}</b>`, `(for real loads it's simply ${Math.max(ZL, Z0)}/${Math.min(ZL, Z0)})`]); }, 'tline'),
    Sec('2.7–2.8', 'Input impedance & special lines', `${EQ('Z_in = Z₀ (Z_L + jZ₀ tan βl)/(Z₀ + jZ_L tan βl)')}<p>λ/2 line: Z_in = Z_L (repeats). λ/4 line: Z_in = Z₀²/Z_L (inverts). Shorted stub: Z_in = jZ₀ tan βl (pure reactance).</p>
      ${TRICK('Quarter-wave transformer: to match R_L to Z₀, insert a λ/4 section with Z₁ = √(Z₀R_L). A 50 Ω line to a 200 Ω load needs a 100 Ω quarter-wave section.')}`,
      () => { const Z0 = R.pick([50, 75]), RL = R.pick([100, 200, 25, 300, 12.5]); return nm2(`Match a ${RL} Ω load to a ${Z0} Ω line with a quarter-wave transformer. Its characteristic impedance?`, Math.sqrt(Z0 * RL), 'Ω', [`Z₁ = √(Z₀R_L) = √(${Z0}·${RL})`, `= <b>${f3(Math.sqrt(Z0 * RL))} Ω</b>`]); }, 'tline'),
  ] });

CH.push({ id: 'ul7', course: '4301', title: 'Ch 3, 7 · Vector calculus & plane waves', blurb: 'Gradient, divergence and curl; plane-wave propagation, intrinsic impedance, skin depth and the Poynting vector.',
  learn: [
    Sec('3.4–3.7', 'Gradient, divergence and curl', `${EQ('∇V (steepest increase) &nbsp;&nbsp; ∇·A (net outflow per volume) &nbsp;&nbsp; ∇×A (circulation)')}<p>Divergence theorem: ∮A·ds = ∫∇·A dv. Stokes: ∮A·dl = ∫(∇×A)·ds. Identities: ∇×(∇V) = 0 and ∇·(∇×A) = 0.</p>
      ${TRICK('Maxwell in point form is just these operators: ∇·D = ρ (charge sources E), ∇·B = 0 (no monopoles), ∇×E = −∂B/∂t (Faraday), ∇×H = J + ∂D/∂t (Ampère–Maxwell).')}`,
      () => { const a = R.int(1, 6), b = R.int(1, 6), c = R.int(1, 6), x = R.int(1, 3), y = R.int(1, 3); return nm2(`A = ${a}x² x̂ + ${b}xy ŷ + ${c}z ẑ. Find ∇·A at (${x}, ${y}, 1).`, 2 * a * x + b * x + c, '', [`∇·A = ∂(${a}x²)/∂x + ∂(${b}xy)/∂y + ∂(${c}z)/∂z = ${2 * a}x + ${b}x + ${c}`, `at x = ${x}: <b>${2 * a * x + b * x + c}</b>`], 0); }),
    Sec('7.2–7.5', 'Plane waves in lossless and lossy media', `${EQ('η = √(μ/ε) (η₀ ≈ 377 Ω) &nbsp;&nbsp; u_p = 1/√(με) = c/√ε_r &nbsp;&nbsp; skin depth δ = 1/√(πfμσ) (good conductor)')}<p>In a good conductor fields decay as e^{−z/δ}; after a few δ they're essentially gone. Time-average Poynting vector S = |E₀|²/(2η) in a lossless medium.</p>
      ${TRICK('Skin depth falls as 1/√f: copper is ~9 mm at 60 Hz but ~2 μm at 1 GHz. That\'s why high-frequency current only uses the surface of a conductor.')}`,
      () => { const f = R.pick([60, 1e3, 1e6, 1e8, 1e9]), sigma = 5.8e7; const d = 1 / Math.sqrt(Math.PI * f * mu0 * sigma); return nm2(`Skin depth in copper (σ = 5.8×10⁷ S/m, μ = μ₀) at f = ${sci(f)} Hz? (in mm)`, d * 1000, 'mm', [`δ = 1/√(πfμσ)`, `= 1/√(π·${sci(f)}·4π×10⁻⁷·5.8×10⁷)`, `= <b>${sci(d * 1000)} mm</b>`]); }),
  ] });
