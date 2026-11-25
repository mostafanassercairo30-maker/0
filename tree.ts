// A small tree that grows with time: one leaf per day from the first day to the wedding, roses bloom near the end.
export function startTree() {
  const host = document.getElementById('treeSvgHost');
  if (!host) return;
  const val = (id: string, fb: string) => { const el = document.getElementById(id) as HTMLInputElement | null; const d = new Date(el && el.value ? el.value : fb); return isNaN(d.getTime()) ? new Date(fb) : d; };
  const start = val('inStart', '2026-05-01T00:00'), wed = val('inWed', '2027-07-15T00:00');
  const DAY = 86400000;
  const total = Math.max(1, Math.round((wed.getTime() - start.getTime()) / DAY));
  const elapsed = Math.min(total, Math.max(0, Math.floor((Date.now() - start.getTime()) / DAY)));
  const p = elapsed / total;
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const f = (n: number) => n.toFixed(1);
  let branches = '';
  const pts: { x: number; y: number; a: number; d: number }[] = [];
  const grow = (x: number, y: number, ang: number, len: number, w: number, depth: number) => {
    const x2 = x + Math.cos(ang) * len, y2 = y + Math.sin(ang) * len;
    const cx = (x + x2) / 2 + (rnd() - 0.5) * len * 0.3, cy = (y + y2) / 2 + (rnd() - 0.5) * len * 0.2;
    branches += `<path d="M${f(x)} ${f(y)} Q${f(cx)} ${f(cy)} ${f(x2)} ${f(y2)}" stroke-width="${w.toFixed(1)}"/>`;
    if (depth >= 2) for (let k = 0; k < 3; k++) { const t = 0.45 + k * 0.28; pts.push({ x: x + (x2 - x) * t + (rnd() - 0.5) * 10, y: y + (y2 - y) * t + (rnd() - 0.5) * 10, a: rnd() * 360, d: 0 }); }
    if (depth >= 6) return;
    const n = depth < 1 ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const spread = depth < 1 ? (i - 1) * 0.55 : (i === 0 ? -1 : 1) * (0.35 + rnd() * 0.3);
      grow(x2, y2, ang + spread + (rnd() - 0.5) * 0.2, len * (0.72 + rnd() * 0.08), w * 0.66, depth + 1);
    }
  };
  grow(150, 292, -Math.PI / 2, 62, 11, 0);
  // order leaves from the inside out, with some shuffle so it fills evenly
  pts.forEach((q) => { q.d = Math.hypot(q.x - 150, q.y - 170) + rnd() * 34; });
  pts.sort((a, b) => a.d - b.d);
  const L = Math.min(pts.length, total);
  const shown = Math.round(p * L);
  const greens = ['#6f9a5a', '#7ca862', '#5f8a4c', '#88b36c', '#6b9457'];
  let leaves = '';
  for (let i = 0; i < shown; i++) {
    const q = pts[Math.floor(i * pts.length / L)];
    const fresh = i >= shown - 3 ? ' class="fresh"' : '';
    leaves += `<path${fresh} d="M0 0 C3.5 -5.5 9.5 -5 12 0 C9.5 5 3.5 5.5 0 0Z" fill="${greens[i % greens.length]}" transform="translate(${f(q.x)} ${f(q.y)}) rotate(${f(q.a)})"/>`;
  }
  // roses: bloom through the last 40% of the way, all open on the wedding day
  const R = 70;
  const roseCount = Math.round(Math.max(0, (p - 0.6) / 0.4) * R);
  const outer = pts.slice().sort((a, b) => b.d - a.d).slice(0, 220);
  let roses = '';
  for (let i = 0; i < roseCount; i++) {
    const q = outer[(i * 3) % outer.length];
    const r = 4.2 + (i % 3) * 0.8;
    roses += `<g transform="translate(${f(q.x + 3)} ${f(q.y - 2)})"><circle r="${r.toFixed(1)}" fill="${i % 2 ? '#d9526d' : '#e9778a'}"/><path d="M${(-r * 0.75).toFixed(1)} -0.5 C-2 ${(-r * 1.1).toFixed(1)} 3 ${(-r * 1.1).toFixed(1)} ${(r * 0.75).toFixed(1)} -0.5" fill="none" stroke="#a82a47" stroke-width=".7" stroke-linecap="round"/><circle r="${(r * 0.32).toFixed(1)}" fill="#b83553"/></g>`;
  }
  host.innerHTML = `<svg viewBox="0 0 300 330" role="img" aria-label="شجرة صغيرة بتكبر مع الأيام، كل يوم بتطلع ورقة جديدة، ويوم الفرح بتتغطى ورد"><ellipse cx="150" cy="298" rx="104" ry="11" fill="#d9c9a6" opacity=".55"/><g fill="none" stroke="#7a5a48" stroke-linecap="round">${branches}</g><g>${leaves}</g><g>${roses}</g><path d="M60 300 q4 -12 8 0 M72 301 q2 -9 6 0 M222 300 q4 -12 8 0 M236 301 q2 -9 6 0" stroke="#6f9a5a" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>`;
  const num = (n: number) => n.toLocaleString('ar-EG');
  const cnt = document.getElementById('treeCount');
  const left = Math.max(0, total - elapsed);
  if (cnt) cnt.textContent = left === 0 ? 'النهارده الشجرة كملت، كلها ورد' : `عدّى ${num(elapsed)} يوم وكل يوم ورقة، وفاضل ${num(left)} يوم وتتغطى ورد`;
  // fit the SVG to everything drawn so no branch is clipped, and fit the text to one line at any width or font scaling
  const svgEl = host.querySelector('svg') as SVGSVGElement | null;
  if (svgEl) {
    svgEl.style.overflow = 'visible';
    try { const bb = svgEl.getBBox(); const pad = 8; svgEl.setAttribute('viewBox', `${f(Math.min(0, bb.x) - pad)} ${f(Math.min(0, bb.y) - pad)} ${f(Math.max(300, bb.x + bb.width) - Math.min(0, bb.x) + pad * 2)} ${f(Math.max(330, bb.y + bb.height) - Math.min(0, bb.y) + pad * 2)}`); } catch (e) { /* ignore */ }
  }
  const fit = () => {
    const el = cnt as HTMLElement | null; if (!el) return;
    el.style.display = 'block'; el.style.width = '100%'; el.style.overflow = 'visible'; el.style.whiteSpace = 'nowrap'; el.style.textAlign = 'center'; el.style.padding = '0';
    const textW = () => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };
    let size = 14; el.style.fontSize = size + 'px';
    const avail = el.clientWidth - 4;
    while (size > 7 && textW() > avail) { size -= 0.25; el.style.fontSize = size + 'px'; }
    if (size < 9.5) el.style.letterSpacing = '-0.01em';
  };
  fit(); window.addEventListener('resize', fit); if ((document as any).fonts && (document as any).fonts.ready) (document as any).fonts.ready.then(fit);
  const bar = document.getElementById('treeBar'); if (bar) (bar as HTMLElement).style.width = (p * 100).toFixed(1) + '%';
}
