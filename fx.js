/* Fieldline — background: drifting field symbols. */
(() => { const c = document.getElementById('bgfx'); if (!c || matchMedia('(prefers-reduced-motion: reduce)').matches) return; const x = c.getContext('2d'); let W, H, P = [];
  const G = ['Ω', 'μ', 'ε₀', '∮', '∇', 'ω', 'Φ', 'λ', '∂', 'τ', 'θ', '⊗', '⊙', '→', 'ℏ', 'σ'];
  const rs = () => { W = c.width = innerWidth * devicePixelRatio; H = c.height = innerHeight * devicePixelRatio; P = [...Array(46)].map(() => ({ x: Math.random() * W, y: Math.random() * H, v: (.15 + Math.random() * .4) * devicePixelRatio, g: G[Math.random() * G.length | 0], s: (10 + Math.random() * 12) * devicePixelRatio, a: .05 + Math.random() * .12 })); };
  rs(); addEventListener('resize', rs);
  const f = () => { x.clearRect(0, 0, W, H); const light = document.documentElement.dataset.theme === 'light'; P.forEach(p => { p.y += p.v; if (p.y > H + 20) { p.y = -20; p.x = Math.random() * W; } x.font = `${p.s}px IBM Plex Mono, monospace`; x.fillStyle = light ? `rgba(10,90,130,${p.a * .7})` : `rgba(79,209,255,${p.a})`; x.fillText(p.g, p.x, p.y); }); requestAnimationFrame(f); }; f(); })();
