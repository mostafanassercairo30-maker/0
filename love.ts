// @ts-nocheck
export function startLove() {
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var KEY = 'love-hourglass-v4';
  var UNITS = ['سنين', 'شهور', 'أيام', 'ساعات', 'دقايق', 'ثواني'];
  var ids = ['in1', 'in2', 'inStart', 'inKK', 'inWed', 'inKKword', 'inWword'];
  var reduce = false;
  try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

  function load() {
    try {
      var v = JSON.parse(window.__ls.getItem(KEY) || 'null');
      if (v) ids.forEach(function (id) { if (typeof v[id] === 'string') $(id).value = v[id]; });
    } catch (e) {}
  }
  function save() {
    try {
      var o = {}; ids.forEach(function (id) { o[id] = $(id).value; });
      window.__ls.setItem(KEY, JSON.stringify(o));
    } catch (e) {}
  }
  function parts(from, to) {
    var y = to.getFullYear() - from.getFullYear();
    var mo = to.getMonth() - from.getMonth();
    var d = to.getDate() - from.getDate();
    var h = to.getHours() - from.getHours();
    var mi = to.getMinutes() - from.getMinutes();
    var s = to.getSeconds() - from.getSeconds();
    if (s < 0) { s += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h < 0) { h += 24; d--; }
    if (d < 0) { d += new Date(to.getFullYear(), to.getMonth(), 0).getDate(); mo--; }
    if (mo < 0) { mo += 12; y--; }
    return [y, mo, d, h, mi, s];
  }
  var ZERO = [0, 0, 0, 0, 0, 0], DAY = 86400000;
  var feedP = { kk: 0, w: 0 };
  function tiles(el, p) {
    if (el.children.length !== 6) {
      el.innerHTML = UNITS.map(function (u) { return '<div class="tile"><b>0</b><span>' + u + '</span></div>'; }).join('');
    }
    for (var i = 0; i < 6; i++) el.children[i].firstChild.textContent = p[i];
  }
  function parse(v) { var d = new Date(v); return isNaN(d.getTime()) ? null : d; }
  function dateAr(d) { return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }); }
  function clamp(p) { return Math.max(0, Math.min(1, p)); }
  function days(el, word, n) { el.innerHTML = word + '<b>' + n + '</b>يوم'; }

  var state = { pw: 0, pouring: false };

  // one countdown box on top of the glass; returns progress 0..1 from "start" to the event
  function cell(prefix, target, start, now, upTitle, downTitle, word) {
    var titleEl = $(prefix + 'Title'), noteEl = $(prefix + 'Note'), daysEl = $(prefix + 'Days'), p = 0;
    var list = $(prefix === 'kk' ? 'kk' : 'wed');
    if (!target) {
      titleEl.textContent = downTitle; tiles(list, ZERO); noteEl.textContent = 'اختار التاريخ'; daysEl.textContent = '';
    } else if (target > now) {
      titleEl.textContent = downTitle; tiles(list, parts(now, target)); noteEl.textContent = dateAr(target);
      days(daysEl, 'فاضل', Math.ceil((target - now) / DAY));
      if (start && start < target && start <= now) p = (now - start) / (target - start);
    } else {
      p = 1; titleEl.textContent = upTitle; tiles(list, parts(target, now)); noteEl.textContent = 'مبروك! من ' + dateAr(target);
      days(daysEl, 'عدّى', Math.floor((now - target) / DAY));
    }
    p = clamp(p);
    var pouring = p > 0 && p < 1;
    feedP[prefix] = pouring ? p : 0;
    $(prefix + 'Pct').innerHTML = (p * 100).toFixed(pouring ? 2 : 0) + '%<small>' + (p >= 1 ? 'حصل' : 'قطعنا') + '</small>';
    $(prefix + 'Bar').style.width = (p * 100) + '%';
    // sand drains out of the top boxes
    $(prefix === 'kk' ? 'fillKK' : 'fillW').style.height = ((1 - p) * 100) + '%';
    $(prefix === 'kk' ? 'dropKK' : 'dropW').hidden = !pouring;
    $(prefix + 'Word').textContent = word;
    return p;
  }

  function render() {
    $('n1').textContent = $('in1').value.trim() || '...';
    $('n2').textContent = $('in2').value.trim() || '...';
    var now = new Date(), start = parse($('inStart').value), kk = parse($('inKK').value), wed = parse($('inWed').value);

    if (start && start <= now) {
      tiles($('up'), parts(start, now));
      days($('upDays'), 'عدّى', Math.floor((now - start) / DAY));
      $('upNote').textContent = 'من ' + dateAr(start);
    } else {
      tiles($('up'), ZERO);
      $('upDays').textContent = '';
      $('upNote').textContent = start ? 'التاريخ ده لسه جاي' : 'اختار أول يوم ليكم مع بعض';
    }

    cell('kk', kk, start, now, 'بقالنا كاتبين الكتاب', 'فاضل على كتب الكتاب', $('inKKword').value.trim());
    var pw = cell('w', wed, start, now, 'بقالنا متجوزين', 'فاضل على فرحنا', $('inWword').value.trim());
    state.pw = pw;
    state.pouring = pw > 0 && pw < 1;

    // sand piles up in the bottom box
    $('fillBot').style.height = (pw * 100) + '%';
    $('dropBot').hidden = !state.pouring;
    if (reduce) draw(0, 0);
  }

  // ---- granular sand: individual grains, gravity follows tilt (phone) or mouse (desktop) ----
  var glassEl = document.querySelector('.glass');
  var wrapG = document.createElement('div'); wrapG.className = 'glassWrap';
  glassEl.parentNode.insertBefore(wrapG, glassEl); wrapG.appendChild(glassEl);
  var cv = document.createElement('canvas'); cv.className = 'sandCv'; cv.setAttribute('aria-hidden', 'true'); wrapG.appendChild(cv);
  var cx2 = cv.getContext('2d');
  var FEED = 44;
  var fv = document.createElement('canvas'); fv.className = 'feedCv'; fv.setAttribute('aria-hidden', 'true'); wrapG.appendChild(fv);
  var fx = fv.getContext('2d');
  var SHAPE_D = 'M6 20 H234 C234 110 128 150 124 180 C128 210 234 250 234 340 H6 C6 250 112 210 116 180 C112 150 6 110 6 20 Z';
  var SHAPE = new Path2D(SHAPE_D);
  var NP = 2800, KF = NP / 700, INS = 2.5, GRAV = 1500;
  var S = null, pgx = 0, pgy = 1, tgx = 0, tgy = 1, valveOpen = false, tiltedNow = false, upright = true;
  var lastDrip = 0, lastHeal = 0, lastTilt = 0, visible = true, dpr = 1;
  var colA = '#edb674', colB = '#d58f47', colC = '#d58f47', colT = 0;
  var input = { gx: 0, gy: 1, motionAt: 0, mouseAt: 0, mx: 0, my: 0, mouseOver: false, mvx: 0, mvy: 0, sgn: 0, beta: null, on: false };

  function lattice(S, startY, minY, maxCount) {
    var out = [], d = S.r * 2.04, pitch = d * 0.88, k = 0;
    for (var y = startY; y >= minY; y -= pitch, k++) {
      var iy = Math.max(0, Math.min(S.H, Math.round(y)));
      var L = S.left[iy] + INS + S.r, R = S.right[iy] - INS - S.r;
      if (R < L) continue;
      for (var x = L + (k % 2) * S.r; x <= R + 0.01; x += d) {
        out.push([x, y]);
        if (out.length >= maxCount) return out;
      }
    }
    return out;
  }
  function buildSim() {
    var W = Math.round(wrapG.clientWidth), H = Math.round(glassEl.clientHeight) || 320;
    if (W < 40) return false;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    fv.width = Math.round(W * dpr); fv.height = Math.round((H + FEED) * dpr); fv.style.width = W + 'px'; fv.style.height = (H + FEED) + 'px'; fv.style.top = (-FEED) + 'px';
    var sx = W / 240, sy = H / 344;
    var off = document.createElement('canvas'); off.width = W; off.height = H;
    var oc = off.getContext('2d');
    oc.setTransform(sx, 0, 0, sy, 0, -8 * sy); oc.fill(SHAPE);
    var data = oc.getImageData(0, 0, W, H).data;
    var left = new Float32Array(H + 1), right = new Float32Array(H + 1), cxm = W / 2;
    for (var y = 0; y <= H; y++) {
      var a = -1, b = -1, yy = Math.min(H - 1, y);
      for (var x = 0; x < W; x++) { if (data[(yy * W + x) * 4 + 3] > 128) { if (a < 0) a = x; b = x + 1; } }
      if (a < 0) { a = cxm; b = cxm; }
      left[y] = a; right[y] = b;
    }
    function smooth(arr) {
      var o = new Float32Array(arr.length);
      for (var i = 0; i < arr.length; i++) { var s = 0, c = 0; for (var j = -2; j <= 2; j++) { var k = i + j; if (k >= 0 && k < arr.length) { s += arr[k]; c++; } } o[i] = s / c; }
      return o;
    }
    left = smooth(left); right = smooth(right);
    var sl = new Float32Array(H + 1), sr = new Float32Array(H + 1);
    for (var i = 0; i <= H; i++) {
      var i0 = Math.max(0, i - 3), i1 = Math.min(H, i + 3);
      sl[i] = (left[i1] - left[i0]) / (i1 - i0); sr[i] = (right[i1] - right[i0]) / (i1 - i0);
    }
    var Sm = { W: W, H: H, sx: sx, sy: sy, left: left, right: right, sl: sl, sr: sr, r: 4,
      ytop: 12 * sy + INS, ybot: 332 * sy - INS, neck: 172 * sy, cx: cxm };
    // largest grain radius whose packing fits the full top bulb with a small margin
    for (var r = 2.4; r >= 0.9; r -= 0.05) {
      Sm.r = r;
      if (lattice(Sm, Sm.neck - r, Sm.ytop + r, 99999).length >= NP * 1.04) break;
    }
    var r2 = Sm.r, pw = state.pw, nb = Math.round(pw * NP), nt = NP - nb;
    var top = lattice(Sm, Sm.neck - r2 * 1.2, Sm.ytop + r2, nt);
    var bot = lattice(Sm, Sm.ybot - r2, Sm.neck + r2 * 1.5, nb);
    var P = [];
    top.concat(bot).forEach(function (p, idx) {
      var x = p[0] + (Math.random() - 0.5) * 0.4, y = p[1];
      P.push({ x: x, y: y, ox: x, oy: y, side: idx < top.length ? 0 : 1, pass: false });
    });
    // lattice may hold slightly fewer than asked in a bulb: top up the rest on that side
    while (P.length < NP) { var sd = P.length < nt ? 0 : 1; var q = P[Math.floor(Math.random() * P.length)] || { x: cxm, y: Sm.neck - 30 };
      P.push({ x: q.x, y: q.y - 2, ox: q.x, oy: q.y - 2, side: sd, pass: false }); }
    Sm.P = P; Sm.cell = Sm.r * 2;
    Sm.cols = Math.ceil(W / Sm.cell) + 2; Sm.rows = Math.ceil(H / Sm.cell) + 2;
    Sm.head = new Int32Array(Sm.cols * Sm.rows); Sm.next = new Int32Array(P.length);
    S = Sm; readColors();
    return true;
  }
  function readColors() {
    try {
      var cs = getComputedStyle(glassEl);
      var a = cs.getPropertyValue('--sand').trim(), b = cs.getPropertyValue('--sand-deep').trim();
      if (a) colA = a; if (b) colB = b; colC = b ? b : colC;
    } catch (e) {}
  }
  function setGravity(dt) {
    var now = performance.now(), gx = 0, gy = 1, k = 0.15;
    if (input.motionAt && now - input.motionAt < 1200) { gx = input.gx; gy = input.gy; k = 0.2; }
    else if (input.mouseAt && now - input.mouseAt < 4500) {
      var a = Math.max(-1, Math.min(1, input.mx)) * 1.1; gx = Math.sin(a); gy = Math.cos(a); k = 0.18;
    }
    tgx = gx; tgy = gy;
    if (!isFinite(tgx) || !isFinite(tgy)) { tgx = 0; tgy = 1; }
    if (!isFinite(pgx) || !isFinite(pgy)) { pgx = 0; pgy = 1; }
    pgx += (tgx - pgx) * k; pgy += (tgy - pgy) * k;
    var m = Math.sqrt(pgx * pgx + pgy * pgy) || 1;
    var cosA = pgy / m;
    var tilted = cosA < 0.82;
    valveOpen = false; tiltedNow = tilted;
    if (cosA < 0.95) lastTilt = now;
    upright = cosA > 0.95 && now - lastTilt > 900;
  }
  function stepSim(sub) {
    var P = S.P, n = P.length, r = S.r, d2 = 4 * r * r, lim = r * 1.25;
    var gx = pgx * GRAV / (sub * sub) / 3600, gy = pgy * GRAV / (sub * sub) / 3600; // px per substep^2
    var gm = Math.sqrt(gx * gx + gy * gy), cap = 2.2 * GRAV / (sub * sub) / 3600;
    if (gm > cap) { gx *= cap / gm; gy *= cap / gm; }
    var i, p, vx, vy, mx = input.mouseOver && performance.now() - input.mouseAt < 400;
    for (i = 0; i < n; i++) {
      p = P[i];
      vx = (p.x - p.ox) * 0.986; vy = (p.y - p.oy) * 0.986;
      p.ox = p.x; p.oy = p.y;
      var dx = vx + gx, dy = vy + gy, dm = Math.sqrt(dx * dx + dy * dy);
      if (dm > lim) { dx *= lim / dm; dy *= lim / dm; }
      p.x += dx; p.y += dy;
      if (mx) {
        var ex = p.x - input.px, ey = p.y - input.py, ed = Math.sqrt(ex * ex + ey * ey), R = 30;
        if (ed < R && ed > 0.01) { var f = (1 - ed / R) * 1.1 / sub * 2; p.x += ex / ed * f; p.y += ey / ed * f; }
      }
    }
    // grain-grain contacts via spatial hash
    var head = S.head, next = S.next, cols = S.cols, cell = S.cell;
    head.fill(-1);
    for (i = 0; i < n; i++) {
      p = P[i];
      var cxi = Math.max(0, Math.min(cols - 1, (p.x / cell | 0) + 1)), cyi = Math.max(0, Math.min(S.rows - 1, (p.y / cell | 0) + 1));
      p.c = cyi * cols + cxi; next[i] = head[p.c]; head[p.c] = i;
    }
    for (i = 0; i < n; i++) {
      p = P[i];
      var c0 = p.c, cxx = c0 % cols, cyy = (c0 / cols) | 0;
      for (var oy2 = -1; oy2 <= 1; oy2++) for (var ox2 = -1; ox2 <= 1; ox2++) {
        var nx = cxx + ox2, ny = cyy + oy2;
        if (nx < 0 || ny < 0 || nx >= cols || ny >= S.rows) continue;
        for (var j = head[ny * cols + nx]; j >= 0; j = next[j]) {
          if (j <= i) continue;
          var q = P[j], ax = q.x - p.x, ay = q.y - p.y, dd = ax * ax + ay * ay;
          if (dd < d2 && dd > 1e-6) {
            var dist = Math.sqrt(dd), push = (2 * r - dist) * 0.5 * 0.9, ux = ax / dist, uy = ay / dist;
            p.x -= ux * push; p.y -= uy * push; q.x += ux * push; q.y += uy * push;
            // contact friction: bleed a little speed so piles hold an angle of repose
            p.ox += (p.x - p.ox) * 0.09; p.oy += (p.y - p.oy) * 0.09; q.ox += (q.x - q.ox) * 0.09; q.oy += (q.y - q.oy) * 0.09;
          }
        }
      }
    }
    // walls, floor, ceiling and the neck valve
    var open = valveOpen;
    for (i = 0; i < n; i++) {
      p = P[i];
      for (var it = 0; it < 2; it++) {
        var iy = Math.max(0, Math.min(S.H, Math.round(p.y)));
        var L = S.left[iy] + INS + r, R = S.right[iy] - INS - r, hit = false;
        if (p.x < L) { var s = S.sl[iy], k2 = (L - p.x) / (1 + s * s); p.x += k2; p.y += -s * k2; hit = true; }
        else if (p.x > R) { var s2 = S.sr[iy], k3 = (p.x - R) / (1 + s2 * s2); p.x -= k3; p.y += s2 * k3; hit = true; }
        if (p.y < S.ytop + r) { p.y = S.ytop + r; hit = true; }
        else if (p.y > S.ybot - r) { p.y = S.ybot - r; hit = true; }
        if (hit) { p.ox += (p.x - p.ox) * 0.4; p.oy += (p.y - p.oy) * 0.4; }
      }
      if (!open && !p.pass) {
        if (p.side === 0 && p.y > S.neck - r) { p.y = S.neck - r; p.oy = p.y; }
        else if (p.side === 1 && p.y < S.neck + r) { p.y = S.neck + r; p.oy = p.y; }
      } else {
        if (p.pass) { if (p.pd === -1) { if (p.y < S.neck - r * 1.6) { p.pass = false; p.side = 0; } } else if (p.y > S.neck + r * 1.6) { p.pass = false; p.side = 1; } }
        else p.side = p.y > S.neck ? 1 : 0;
      }
    }
  }
  function flowControl(now) {
    var P = S.P, bottom = 0, i, p, target = Math.round(state.pw * NP), inTransit = 0;
    for (i = 0; i < P.length; i++) { if (P[i].pass) inTransit++; else if (P[i].side === 1) bottom++; }
    for (i = 0; i < P.length; i++) { if (P[i].pass && now - P[i].pt > 2500) P[i].pass = false; }
    if (!upright) {
      // tilted: the neck lets sand through as one slow, steady stream instead of dumping it
      if (tiltedNow && pgy * 0 === 0 && now - lastDrip > 70 && inTransit < 3) {
        var dn = pgy >= 0 ? 1 : -1, bst = null, bdd = 1e9, sd = dn > 0 ? 0 : 1;
        for (i = 0; i < P.length; i++) {
          p = P[i];
          if (p.side !== sd || p.pass) continue;
          var ny0 = (p.y - S.neck) * dn; if (ny0 > -S.r * 0.5 || ny0 < -S.r * 8) continue;
          var ddx = Math.abs(p.x - S.cx) + (-ny0) * 0.3;
          if (ddx < bdd) { bdd = ddx; bst = p; }
        }
        if (bst && bdd < S.r * 9) { bst.pass = true; bst.pd = dn; bst.pt = now; bst.x += (S.cx - bst.x) * 0.6; lastDrip = now; }
      }
      return;
    }
    var diff = bottom + inTransit - target;
    var dripGap = diff < 0 ? 140 / KF : (state.pouring ? 380 / KF : 1e9);
    if (now - lastDrip > dripGap && inTransit < 2 * KF) {
      var best = null, bd = 1e9;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        if (p.side !== 0 || p.pass || p.y < S.neck - S.r * 8) continue;
        var dx = Math.abs(p.x - S.cx) + (S.neck - p.y) * 0.3;
        if (dx < bd) { bd = dx; best = p; }
      }
      if (best) { best.pass = true; best.pd = 1; best.pt = now; best.x += (S.cx - best.x) * 0.6; lastDrip = now; }
    }
    if (diff > 0 && now - lastHeal > 70 / KF) {
      // too much sand below for the countdown: lift the highest grain below back on top of the upper pile
      var hi = null, hy = 1e9, topY = S.neck;
      for (i = 0; i < P.length; i++) {
        p = P[i];
        if (p.side === 1 && !p.pass && p.y < hy) { hy = p.y; hi = p; }
        if (p.side === 0 && p.y < topY) topY = p.y;
      }
      if (hi) {
        var ny = Math.max(S.ytop + S.r, topY - S.r * 2.2), iy = Math.round(ny);
        var L = S.left[iy] + INS + S.r, R = S.right[iy] - INS - S.r;
        hi.x = L + Math.random() * Math.max(0, R - L); hi.y = ny; hi.ox = hi.x; hi.oy = hi.y; hi.side = 0; lastHeal = now;
      }
    }
  }
  function sandGrad(c, y0, y1) {
    var g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, colA); g.addColorStop(1, colB); return g;
  }
  // highest grain of one side near a given x (top of the pile under a stream)
  function surfaceY(x, side, fallback) {
    var P = S.P, best = fallback, i, p;
    for (i = 0; i < P.length; i++) {
      p = P[i];
      if (p.side === side && !p.pass && p.y < best && Math.abs(p.x - x) < 7) best = p.y;
    }
    return best;
  }
  function ribbon(c, x, y0, y1, w, now, dy) {
    // thin unbroken ribbon of sand with a faint moving sheen so it reads as flowing
    c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = sandGrad(c, S.ytop + dy, S.ybot + dy);
    c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke();
    c.save(); c.lineCap = 'butt'; c.lineWidth = Math.max(0.6, w * 0.38); c.strokeStyle = 'rgba(255,240,215,0.45)';
    c.setLineDash([5, 11]); c.lineDashOffset = -(now / 22) % 16;
    c.beginPath(); c.moveTo(x - w * 0.12, y0 + 1); c.lineTo(x - w * 0.12, y1 - 1); c.stroke(); c.restore();
  }
  var fp = [], fAcc = { kk: 0, w: 0 }, fLast = 0;
  function drawFeed(now) {
    var c = fx, W = S.W, dt = fLast ? Math.min(0.05, (now - fLast) / 1000) : 0.016; fLast = now;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, fv.width, fv.height);
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    var srcs = [{ k: 'kk', x: W * 0.75 }, { k: 'w', x: W * 0.25 }], i, j, p;
    c.fillStyle = sandGrad(c, FEED + S.ytop, FEED + S.ybot);
    var hy = [], g = 1100;
    for (i = 0; i < 2; i++) {
      var pr = feedP[srcs[i].k], x = srcs[i].x; hy[i] = surfaceY(x, 0, S.neck - 2);
      if (!pr) continue;
      // funnel at the bottom of the card, where the sand leaves it
      // no funnel: the stream starts as a thin thread right at the top of the glass
      // spawn grains: a steady trickle, denser as the countdown progresses
      fAcc[srcs[i].k] += dt * (260 + 200 * pr);
      var nsp = Math.floor(fAcc[srcs[i].k]), q = 0; fAcc[srcs[i].k] -= nsp;
      for (q = 0; q < nsp; q++) {
        var v0 = 70, back = (q / Math.max(1, nsp)) * dt; // stagger inside the frame so the trickle stays unbroken at any fps
        fp.push({ x: x + (Math.random() - 0.5) * 0.5, y: FEED + 3, vx: 0, vy: v0, s: i, r: 0.8 + 0.35 * pr, lag: back });
      }
    }
    // grains fall under gravity, then settle into the pile and are gone
    c.beginPath();
    for (j = fp.length - 1; j >= 0; j--) {
      p = fp[j]; var ddt = dt - (p.lag || 0); p.lag = 0; if (ddt < 0) ddt = 0; p.vy += g * ddt; p.y += p.vy * ddt; p.x += p.vx * ddt;
      if (p.y >= FEED + hy[p.s] - 1) { fp.splice(j, 1); continue; }
      c.moveTo(p.x + p.r, p.y); c.arc(p.x, p.y, p.r, 0, 6.2832);
    }
    c.fill();
    // small mound where each stream lands, merging into the pile
    for (i = 0; i < 2; i++) {
      if (!feedP[srcs[i].k]) continue;
      var x2 = srcs[i].x, ye = FEED + hy[i] + 1;
      c.beginPath(); c.moveTo(x2 - 6, ye + 3); c.quadraticCurveTo(x2, ye - 3, x2 + 6, ye + 3); c.closePath(); c.fill();
    }
    if (fp.length > 400) fp.length = 400;
  }
  var MK = null;
  function hexRGB(h, d) { var m = /^#([0-9a-f]{6})$/i.exec((h || '').trim()); if (!m) return d; var n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function buildMask() {
    var mw = Math.ceil(S.W / 2), mh = Math.ceil(S.H / 2), m = {};
    m.w = mw; m.h = mh;
    m.a = document.createElement('canvas'); m.a.width = mw; m.a.height = mh; m.ac = m.a.getContext('2d', { willReadFrequently: true });
    m.o = document.createElement('canvas'); m.o.width = mw; m.o.height = mh; m.oc = m.o.getContext('2d');
    m.img = m.oc.createImageData(mw, mh);
    m.f = new Float32Array(mw * mh); m.g = new Float32Array(mw * mh);
    MK = m; MK.S = S;
  }
  function drawSand(now) {
    if (!MK || MK.S !== S) buildMask();
    var m = MK, mw = m.w, mh = m.h, P = S.P, i, x, y, k, rr = S.r * 1.5 / 2;
    // 1) grains into a half-resolution mask
    var ac = m.ac; ac.clearRect(0, 0, mw, mh); ac.fillStyle = '#fff'; ac.beginPath();
    for (i = 0; i < P.length; i++) { ac.moveTo(P[i].x / 2 + rr, P[i].y / 2); ac.arc(P[i].x / 2, P[i].y / 2, rr, 0, 6.2832); }
    ac.fill();
    var src = ac.getImageData(0, 0, mw, mh).data, f = m.f, g = m.g;
    for (k = 0; k < f.length; k++) f[k] = src[k * 4 + 3] / 255;
    // 2) soften (two small box blurs) so the grains melt into one mass
    for (var pass = 0; pass < 2; pass++) {
      for (y = 0; y < mh; y++) for (x = 0; x < mw; x++) { k = y * mw + x; g[k] = (f[x > 0 ? k - 1 : k] + f[k] + f[x < mw - 1 ? k + 1 : k]) / 3; }
      for (y = 0; y < mh; y++) for (x = 0; x < mw; x++) { k = y * mw + x; f[k] = (g[y > 0 ? k - mw : k] + g[k] + g[y < mh - 1 ? k + mw : k]) / 3; }
    }
    // 3) smooth threshold to a flat sand colour with a soft vertical gradient
    var cA = hexRGB(colA, [237, 182, 116]), cB = hexRGB(colB, [213, 143, 71]), d = m.img.data, y0 = S.ytop / 2, y1 = S.ybot / 2;
    for (y = 0; y < mh; y++) {
      var t = Math.max(0, Math.min(1, (y - y0) / (y1 - y0))), R = cA[0] + (cB[0] - cA[0]) * t, G = cA[1] + (cB[1] - cA[1]) * t, B = cA[2] + (cB[2] - cA[2]) * t;
      for (x = 0; x < mw; x++) {
        k = y * mw + x; var v = (f[k] - 0.26) / 0.26; v = v < 0 ? 0 : v > 1 ? 1 : v; v = v * v * (3 - 2 * v);
        var o = k * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = v * 255;
      }
    }
    m.oc.putImageData(m.img, 0, 0);
    var c = cx2;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
    c.setTransform(dpr * S.sx, 0, 0, dpr * S.sy, 0, -8 * S.sy * dpr);
    c.save(); c.clip(SHAPE); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.imageSmoothingEnabled = true; c.drawImage(m.o, 0, 0, mw, mh, 0, 0, mw * 2, mh * 2);
    if (state.pouring && upright && !valveOpen) {
      var sy1 = surfaceY(S.cx, 1, S.ybot);
      ribbon(c, S.cx, S.neck - 3, sy1 + 1, 1.7, now || 0, 0);
    }
    c.restore();
    drawFeed(now || 0);
  }
  function frame(now) {
    var dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016);
    lastT = now;
    try { if (!S && !buildSim()) { requestAnimationFrame(frame); return; } } catch (e) { cv.setAttribute('data-err', String(e && e.stack || e).slice(0, 300)); requestAnimationFrame(frame); return; }
    if (visible) {
      if (now - colT > 1500) { colT = now; readColors(); }
      setGravity(dt);
      stepSim(2); stepSim(2);
      flowControl(now);
      drawSand(now);
      if ((fcount++ % 20) === 0) { var bt = 0; for (var q = 0; q < S.P.length; q++) if (S.P[q].side === 1) bt++; cv.setAttribute('data-sand', 'n=' + S.P.length + ' bottom=' + bt + ' g=' + pgx.toFixed(2) + ',' + pgy.toFixed(2) + ' r=' + S.r.toFixed(2) + ' fps=' + fpsv); }
    }
    fpsN++; if (now - fpsT > 1000) { fpsv = fpsN; fpsN = 0; fpsT = now; }
    requestAnimationFrame(frame);
  }
  var lastT = 0, fcount = 0, fpsN = 0, fpsT = 0, fpsv = 0;
  function draw() { if (!S) buildSim(); if (S) drawSand(0); }
  // keep the shape and grain size right when the width changes
  var lastW = 0;
  function onResize() { var w = Math.round(wrapG.clientWidth); if (w && w !== lastW) { lastW = w; if (S) buildSim(); } }
  window.addEventListener('resize', onResize);
  try { if (window.ResizeObserver) new ResizeObserver(onResize).observe(wrapG); } catch (e) {}
  try { if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(wrapG); } catch (e) {}

  // ---- tilt (phones) and mouse (desktop) ----
  var hint = document.createElement('button'); hint.type = 'button'; hint.className = 'sandHint';
  wrapG.parentNode.insertBefore(hint, wrapG.nextSibling);
  var isIOSPerm = !!(window.DeviceMotionEvent && typeof window.DeviceMotionEvent.requestPermission === 'function');
  function hintText(t) { hint.textContent = t; }
  hintText(isIOSPerm ? 'اضغط هنا عشان الرمل يتحرك مع الموبايل' : 'مِيّل الموبايل أو حرّك الماوس والرمل هيتحرك');
  function screenAngle() { try { return (screen.orientation && screen.orientation.angle) || window.orientation || 0; } catch (e) { return 0; } }
  function onOri(e) { if (e.beta != null) input.beta = e.beta; }
  function onMot(e) {
    var a = e.accelerationIncludingGravity;
    if (!a || a.x == null || a.y == null) return;
    if (input.beta != null) {
      var sb = Math.sin(input.beta * Math.PI / 180);
      if (Math.abs(sb) > 0.6 && Math.abs(a.y) > 4) input.sgn = (a.y * sb > 0) ? 1 : -1;
    }
    var s = input.sgn || (isIOSPerm ? -1 : 1);
    var Gx = -a.x * s / 9.81, Gy = -a.y * s / 9.81, th = ((screenAngle() % 360) + 360) % 360, right, up;
    if (th === 90) { right = Gy; up = -Gx; } else if (th === 180) { right = -Gx; up = -Gy; } else if (th === 270) { right = -Gy; up = Gx; } else { right = Gx; up = Gy; }
    var gx = right, gy = -up, m = Math.sqrt(gx * gx + gy * gy);
    if (m < 0.2) return;           // free fall or flat: ignore
    if (m > 2.2) { gx *= 2.2 / m; gy *= 2.2 / m; }
    input.gx = gx; input.gy = gy; input.motionAt = performance.now();
    if (hint.dataset.on !== '1') { hint.dataset.on = '1'; hintText('الرمل شغّال مع حركة الموبايل'); }
  }
  function enableMotion() {
    if (input.on) return; input.on = true;
    window.addEventListener('deviceorientation', onOri);
    window.addEventListener('devicemotion', onMot);
  }
  function askMotion() {
    var DM = window.DeviceMotionEvent, DO = window.DeviceOrientationEvent, reqs = [];
    try { if (DM && typeof DM.requestPermission === 'function') reqs.push(DM.requestPermission().catch(function () { return 'denied'; })); } catch (e) {}
    try { if (DO && typeof DO.requestPermission === 'function') reqs.push(DO.requestPermission().catch(function () { return 'denied'; })); } catch (e) {}
    if (!reqs.length) { enableMotion(); return; }
    Promise.all(reqs).then(function (r) {
      if (r.some(function (x) { return x === 'granted'; })) { enableMotion(); hintText('تمام، مِيّل الموبايل وشوف الرمل'); }
      else hintText('الحساس اتمنع. فعّله من إعدادات المتصفح وجرّب تاني');
    });
  }
  hint.addEventListener('click', askMotion);
  if (isIOSPerm) {
    var firstTap = function () { document.removeEventListener('click', firstTap, true); document.removeEventListener('touchend', firstTap, true); if (!input.on) askMotion(); };
    document.addEventListener('click', firstTap, true);
    document.addEventListener('touchend', firstTap, true);
  } else enableMotion();
  document.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    input.mx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1; input.mouseAt = performance.now();
    var rc = cv.getBoundingClientRect();
    input.px = e.clientX - rc.left; input.py = e.clientY - rc.top;
    input.mouseOver = input.px >= 0 && input.py >= 0 && input.px <= rc.width && input.py <= rc.height;
  });
  document.addEventListener('pointerleave', function () { input.mouseOver = false; });
  window.__sand = { input: input, get S() { return S; }, tilt: function (gx, gy) { input.gx = gx; input.gy = gy; input.motionAt = performance.now(); } };

  // ---- photo slideshow with birds circling the frame ----
  var photosEl = $('photos'), baseEls = Array.prototype.slice.call(document.querySelectorAll('#photos img'));
  var dots = $('dots'), cur = 0, timer = 0, birdsEl = $('birds'), wrap = $('photoWrap');
  var PKEY = 'love-hourglass-photos-v1', HKEY = 'love-hidden2', SLOTS = 20, SLOT_MAX = 15000, TOTAL_MAX = 56000, PRESET = 15000;
  var mine = [], hidden = [], imgs = [];
  var BIRD = '<svg viewBox="0 0 30 20" width="30" height="20"><ellipse cx="14" cy="11" rx="8" ry="3.8"/><circle cx="22.5" cy="9" r="3"/><path d="M25 8.6 L29.6 9.7 L25 10.8Z"/><path d="M7 10 L0 6.5 L6.5 12.5Z"/><path class="wing" d="M9 10 C11 1 18 0 21.5 3 C17 4 14 7 13 10Z"/></svg>';
  function flock() {
    if (reduce || !birdsEl.animate) return;
    var w = wrap.offsetWidth, h = wrap.offsetHeight, maxRx = (document.querySelector('main').clientWidth / 2) - 20;
    var cfg = [
      { off: 20, a0: -2.5, dir: 1, dur: 2900, delay: 0 },
      { off: 34, a0: -1.7, dir: 1, dur: 3100, delay: 250 },
      { off: 27, a0: 0.9, dir: -1, dur: 3000, delay: 480 }
    ];
    cfg.forEach(function (c) {
      var el = document.createElement('div');
      el.className = 'bird'; el.innerHTML = BIRD;
      birdsEl.appendChild(el);
      var rx = Math.min(w / 2 + c.off, maxRx), ry = h / 2 + c.off * 0.85, sweep = Math.PI * 2 * 0.92, n = 36, frames = [];
      for (var k = 0; k <= n; k++) {
        var u = k / n, th = c.a0 + c.dir * sweep * u;
        var x = w / 2 + rx * Math.cos(th) - 15, y = h / 2 + ry * Math.sin(th) - 10;
        var vx = -Math.sin(th) * c.dir * rx, vy = Math.cos(th) * c.dir * ry;
        var d = vx >= 0 ? 1 : -1;
        var rot = Math.max(-55, Math.min(55, Math.atan2(vy, Math.abs(vx)) * 180 / Math.PI));
        var sc = 1.05 + 0.4 * Math.sin(Math.PI * u);
        var bob = Math.sin(u * 26) * 3;
        frames.push({
          transform: 'translate(' + x.toFixed(1) + 'px,' + (y + bob).toFixed(1) + 'px) scaleX(' + d + ') rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(2) + ')',
          opacity: u < 0.1 ? u * 10 : (u > 0.88 ? (1 - u) / 0.12 : 1),
          offset: u
        });
      }
      var a = el.animate(frames, { duration: c.dur, delay: c.delay, easing: 'ease-in-out', fill: 'both' });
      a.onfinish = function () { el.remove(); };
    });
  }

  function show(i, withBirds) {
    var prev = cur;
    if (!imgs.length) { cur = 0; return; }
    cur = (i + imgs.length) % imgs.length;
    imgs.forEach(function (im, k) { im.classList.toggle('on', k === cur); });
    Array.prototype.forEach.call(dots.children, function (d, k) { d.classList.toggle('on', k === cur); });
    if (withBirds && cur !== prev) flock();
  }
  function auto() { clearInterval(timer); if (imgs.length > 1) timer = setInterval(function () { show(cur + 1, true); }, 5500); }
  photosEl.addEventListener('click', function () { show(cur + 1, true); auto(); });
  function msg(t, bad) { var m = $('photoMsg'); m.textContent = t; m.style.color = bad ? '#b3263e' : 'inherit'; }
  function usedChars() { var t = 0; mine.forEach(function (m) { t += m.length; }); return t; }
  function persistMine() {
    try {
      var tot = 0; mine.forEach(function (m) { tot += m.length; });
      if (tot > TOTAL_MAX) return false;
      for (var i = 0; i < SLOTS; i++) window.__ls.setItem('love-p' + i, mine[i] || '');
      return true;
    } catch (e) { return false; }
  }
  function persistHidden() { try { window.__ls.setItem(HKEY, JSON.stringify(hidden)); } catch (e) {} }
  function renderThumbs() {
    var t = $('thumbs'); t.innerHTML = '';
    function add(src, label, onRemove) {
      var d = document.createElement('div'), im = document.createElement('img'), x = document.createElement('b');
      im.src = src; im.alt = ''; x.textContent = '×'; x.title = 'شيل الصورة'; x.setAttribute('role', 'button'); x.setAttribute('aria-label', 'شيل ' + label); x.tabIndex = 0;
      x.onclick = onRemove;
      x.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onRemove(); } };
      d.appendChild(im); d.appendChild(x); t.appendChild(d);
    }
    baseEls.forEach(function (el, k) {
      if (hidden.indexOf(k) >= 0) return;
      add(el.src, 'الصورة ' + (k + 1), function () { hidden.push(k); persistHidden(); rebuild(); msg('اتشالت الصورة'); });
    });
    mine.forEach(function (src, k) {
      add(src, 'صورة مضافة', function () { mine.splice(k, 1); persistMine(); rebuild(); msg('اتشالت الصورة'); });
    });
    $('clearPhotos').hidden = !(hidden.length || mine.length);
    $('photoCount').textContent = 'الصور الحالية: ' + (baseEls.length - hidden.length + mine.length) + ' (المضافة ' + mine.length + ' من ' + SLOTS + '، المساحة ' + Math.round(usedChars() / 1024) + ' من ' + Math.round(TOTAL_MAX / 1024) + ' كيلوبايت)';
  }
  function rebuild() {
    Array.prototype.slice.call(photosEl.querySelectorAll('img')).forEach(function (im) { im.remove(); });
    imgs = [];
    baseEls.forEach(function (el, k) { if (hidden.indexOf(k) < 0) { photosEl.insertBefore(el, dots); imgs.push(el); } });
    Array.prototype.forEach.call(document.querySelectorAll('.mirror'), function (m, k) { m.style.display = hidden.indexOf(k) < 0 ? '' : 'none'; });
    mine.forEach(function (src) { var im = document.createElement('img'); im.src = src; im.alt = ''; photosEl.insertBefore(im, dots); imgs.push(im); });
    dots.innerHTML = '';
    imgs.forEach(function () { dots.appendChild(document.createElement('i')); });
    dots.hidden = imgs.length < 2;
    renderThumbs();
    show(Math.min(cur, Math.max(0, imgs.length - 1)), false); auto();
  }
  // crop to the 4:5 arch, then shrink until it fits one storage slot (each slot is capped at ~13 KB)
  function shrink(file) {
    return new Promise(function (ok, no) {
      var r = new FileReader();
      r.onerror = no;
      r.onload = function () {
        var im = new Image();
        im.onerror = no;
        im.onload = function () {
          var cw = im.width, ch = im.height, tw = Math.min(cw, ch * 0.8), th = tw / 0.8;
          if (th > ch) { th = ch; tw = th * 0.8; }
          var sx = (cw - tw) / 2, sy = (ch - th) / 2, widths = [720, 600, 500, 420, 360, 300, 260, 230, 200, 170, 140, 120, 100], qs = [0.7, 0.58, 0.46, 0.34, 0.25], out = null;
          for (var a = 0; a < widths.length && !out; a++) {
            var w = Math.min(widths[a], Math.round(tw)), h = Math.round(w * 1.25);
            var c = document.createElement('canvas'); c.width = w; c.height = h;
            c.getContext('2d').drawImage(im, sx, sy, tw, th, 0, 0, w, h);
            for (var b = 0; b < qs.length; b++) {
              var u = c.toDataURL('image/jpeg', qs[b]);
              if (u.length <= PRESET) { out = u; break; }
            }
          }
          out ? ok(out) : no(new Error('big'));
        };
        im.src = r.result;
      };
      r.readAsDataURL(file);
    });
  }
  try { var hv = JSON.parse(window.__ls.getItem(HKEY) || '[]'); if (Array.isArray(hv)) hidden = hv.filter(function (n) { return typeof n === 'number' && n >= 0 && n < baseEls.length; }); } catch (e) {}
  for (var si = 0; si < SLOTS; si++) { var sv = window.__ls.getItem('love-p' + si); if (sv && sv.indexOf('data:image') === 0) mine.push(sv); }
  try { // older single-key photos: move them into slots
    var legacy = JSON.parse(window.__ls.getItem(PKEY) || '[]');
    if (Array.isArray(legacy) && legacy.length) {
      legacy.forEach(function (x) { if (typeof x === 'string' && mine.length < SLOTS && x.length <= SLOT_MAX + 1000) mine.push(x); });
      persistMine(); window.__ls.removeItem(PKEY);
    }
  } catch (e) {}
  var qSel = $('photoQ');
  if (qSel) qSel.addEventListener('change', function () { PRESET = parseInt(qSel.value, 10) || 15000; });
  $('inPhotos').addEventListener('change', function () {
    var files = Array.prototype.slice.call(this.files || []), inp = this;
    if (!files.length) return;
    msg('ثواني، بنجهّز الصور...');
    Promise.all(files.map(function (f) { return shrink(f).catch(function () { return null; }); })).then(function (res) {
      var good = res.filter(Boolean), added = 0, full = false;
      good.forEach(function (src) {
        if (mine.length >= SLOTS || usedChars() + src.length > TOTAL_MAX) { full = true; return; }
        mine.push(src);
        if (persistMine()) added++; else { mine.pop(); persistMine(); full = true; }
      });
      rebuild();
      inp.value = '';
      if (full) msg('المساحة امتلت (المتصفح بيسمح بحوالي ' + Math.round(TOTAL_MAX / 1024) + ' كيلوبايت صور بس). ضفنا ' + added + '. شيل صورة وجرّب تاني.', true);
      else if (good.length < files.length) msg('بعض الملفات مش صور أو كبيرة، اتخطّت. ضفنا ' + added + ' صورة', true);
      else msg('تمت إضافة ' + added + ' صورة');
    });
  });
  $('clearPhotos').addEventListener('click', function () {
    mine = []; persistMine(); hidden = []; persistHidden(); rebuild(); msg('رجعنا الصور الأصلية بس');
  });
  rebuild();

  // ---- hidden settings gate ----
  var wrapS = $('settingsWrap'), ov = $('pwOv'), pin = $('pwIn');
  function unlock() { wrapS.hidden = false; $('secretBtn').hidden = true; }
  try { if (window.__ss.getItem('love-unlocked') === '1') unlock(); } catch (e) {}
  var afterPw = null, msOk = false;
  try { if (window.__ss.getItem('love-unlocked') === '1' || window.__ss.getItem('love-ms-ok') === '1') msOk = true; } catch (e) {}
  function openDlg(d) { try { if (!d.open) d.showModal(); } catch (e) { d.setAttribute('open', ''); } }
  function closeDlg(d) { try { if (d.open) d.close(); } catch (e) { d.removeAttribute('open'); } }
  function closePw() { afterPw = null; closeDlg(ov); pin.value = ''; $('pwErr').textContent = ''; }
  $('secretBtn').addEventListener('click', function () { afterPw = null; openDlg(ov); pin.focus(); });
  $('pwNo').addEventListener('click', closePw);
  function normPw(v) {
    v = String(v == null ? '' : v);
    try { v = v.normalize('NFKC'); } catch (e) {}
    return v
      .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '')
      .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
      .replace(/\u0629/g, '\u0647')
      .replace(/[\u0649\u06CC]/g, '\u064A')
      .replace(/\u06A9/g, '\u0643')
      .replace(/[\u0660-\u0669]/g, function (d) { return String(d.charCodeAt(0) - 0x660); })
      .replace(/[\u06F0-\u06F9]/g, function (d) { return String(d.charCodeAt(0) - 0x6F0); })
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function tryPw() {
    if (normPw(pin.value) === normPw('مش سهلة')) {
      var cb = afterPw;
      msOk = true;
      try { window.__ss.setItem(cb ? 'love-ms-ok' : 'love-unlocked', '1'); } catch (e) {}
      closePw();
      if (cb) cb(); else { unlock(); wrapS.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    } else { $('pwErr').textContent = 'الكلمة مش صح، جرّب تاني'; pin.select(); }
  }
  $('pwOk').addEventListener('click', tryPw);
  pin.addEventListener('keydown', function (e) { if (e.key === 'Enter') tryPw(); });

  // ---- bird song: synthesized melodies (Web Audio, starts only on tap) ----
  var MEL = [
    { id: 'calm', name: 'لحن هادي', bpm: 56, step: 0.5, wave: 'sine', gain: 0.5,
      chords: [ { b: 48, a: [60, 64, 67, 72], l: [76, 74] }, { b: 45, a: [57, 60, 64, 69], l: [72, 69] }, { b: 41, a: [57, 60, 65, 69], l: [72, 77] }, { b: 43, a: [59, 62, 67, 71], l: [74, 71] } ],
      pat: [0, 1, 2, 3, 2, 1, 2, 1] },
    { id: 'happy', name: 'لحن فرح', bpm: 112, step: 0.5, wave: 'triangle', gain: 0.55,
      chords: [ { b: 43, a: [67, 71, 74, 79], l: [83, 79] }, { b: 50, a: [66, 69, 74, 78], l: [81, 78] }, { b: 40, a: [67, 71, 76, 79], l: [83, 76] }, { b: 48, a: [67, 72, 76, 79], l: [84, 79] } ],
      pat: [0, 2, 1, 2, 3, 2, 1, 2] },
    { id: 'love', name: 'لحن رومانسي', bpm: 66, step: 0.5, wave: 'sine', gain: 0.5,
      chords: [ { b: 38, a: [62, 65, 69, 74], l: [77, 74] }, { b: 43, a: [62, 67, 71, 74], l: [79, 76] }, { b: 36, a: [64, 67, 72, 76], l: [79, 76] }, { b: 45, a: [64, 69, 72, 76], l: [81, 76] } ],
      pat: [0, 1, 2, 1, 3, 2] }
  ];
  var MKEY = 'love-melody-v1', melIdx = 0, ctx = null, master = null, sched = 0, nextT = 0, stepN = 0, playing = false;
  try { var mv = window.__ls.getItem(MKEY); MEL.forEach(function (m, i) { if (m.id === mv) melIdx = i; }); } catch (e) {}
  function hz(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function tone(m, t, dur, type, vol, atk) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = hz(m);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function playStep(mel, n, t) {
    var per = mel.pat.length, total = per * mel.chords.length, k = n % total;
    var c = mel.chords[Math.floor(k / per)], j = k % per, sd = 60 / mel.bpm * mel.step, beat = 60 / mel.bpm;
    if (j === 0) {
      tone(c.b, t, sd * per * 1.05, 'sine', 0.22, 0.05);
      tone(c.b + 12, t, sd * per, 'sine', 0.08, 0.08);
      tone(c.a[0], t, sd * per * 1.05, 'sine', 0.05, 0.3);
      tone(c.a[2], t, sd * per * 1.05, 'sine', 0.04, 0.3);
      tone(c.l[0], t, beat * 2.2, 'sine', 0.11, 0.04);
    }
    if (j === Math.floor(per / 2)) tone(c.l[1], t, beat * 1.6, 'sine', 0.09, 0.04);
    tone(c.a[mel.pat[j]], t, sd * 2.6, mel.wave, 0.1, 0.012);
  }
  function tick() {
    var mel = MEL[melIdx], sd = 60 / mel.bpm * mel.step;
    while (nextT < ctx.currentTime + 0.45) {
      playStep(mel, stepN, nextT); nextT += sd; stepN++;
      if (cycleMel && stepN >= mel.pat.length * mel.chords.length * 2) { stepN = 0; melIdx = (melIdx + 1) % MEL.length; mel = MEL[melIdx]; sd = 60 / mel.bpm * mel.step; try { drawChips(); } catch (e) {} }
    }
  }
  function setBird(on) {
    $('birdBtn').classList.toggle('playing', on);
    $('birdBtn').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('birdBtn').setAttribute('aria-label', on ? 'وقّف لحن العصفورة' : 'شغّل لحن العصفورة');
    $('photoWrap').classList.toggle('song', on);
  }
  function startSynth() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!ctx) ctx = new AC();
    if (ctx.resume) ctx.resume();
    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.linearRampToValueAtTime(MEL[melIdx].gain, ctx.currentTime + 0.8);
    var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    var dly = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
    dly.delayTime.value = 0.32; fb.gain.value = 0.38; wet.gain.value = 0.45;
    master.connect(lp); lp.connect(ctx.destination);
    lp.connect(dly); dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(ctx.destination);
    master._nodes = [lp, dly, fb, wet];
    stepN = 0; nextT = ctx.currentTime + 0.1; playing = true;
    tick(); sched = setInterval(tick, 100);
    setBird(true);
  }
  function stopSynth() {
    playing = false; clearInterval(sched); setBird(false);
    if (!master) return;
    var m = master; master = null;
    m.gain.cancelScheduledValues(ctx.currentTime);
    m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
    m.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    setTimeout(function () { try { m.disconnect(); m._nodes.forEach(function (n) { n.disconnect(); }); } catch (e) {} }, 2500);
  }
  // ---- real song from a link (plays in a normal audio element; bird tap = play/stop) ----
  var SKEY = 'love-song', DEFAULT_SONG = '';
  var songUrl = DEFAULT_SONG, usingSynth = false, audio = new Audio(), audioOn = false;
  try { var sg = window.__ls.getItem(SKEY); if (sg) songUrl = sg; } catch (e) {}
  audio.loop = true; audio.preload = 'none'; audio.setAttribute('playsinline', '');
  window.__audio = audio;
  function audioState(ev) { var b = $('birdBtn'); b.setAttribute('data-audio', (ev || 'idle') + ' paused=' + audio.paused + ' ready=' + audio.readyState + ' t=' + audio.currentTime.toFixed(1) + ' err=' + (audio.error ? audio.error.code : 0)); }
  ['playing', 'pause', 'error', 'loadstart', 'canplay', 'timeupdate', 'stalled', 'waiting'].forEach(function (n) { audio.addEventListener(n, function () { audioState(n); }); });
  $('inSong').value = songUrl === DEFAULT_SONG ? '' : songUrl;
  function songCur() { $('songCur').textContent = songUrl === DEFAULT_SONG ? 'الأغنية الحالية: الألحان التلاتة 🎶 (هادي، فرح، رومانسي). تقدر تحط رابط لأغنية لو عايز.' : 'الأغنية الحالية: الرابط اللي حطيته'; }
  songCur();
  $('setClose').addEventListener('click', function () { $('edView').open = false; $('settingsWrap').hidden = true; $('secretBtn').hidden = false; try { window.__ss.removeItem('love-unlocked'); } catch (e) {} window.scrollTo({ top: 0 }); });
  $('edClose').addEventListener('click', function () { $('edView').open = false; $('edView').scrollIntoView({ block: 'nearest' }); });
  function songMsg(t, bad) { var m = $('songMsg'); m.textContent = t; m.style.color = bad ? '#b3263e' : 'inherit'; }
  function validUrl(u) { return u === DEFAULT_SONG && false || /^https?:\/\/\S+$/i.test(u); }
  function stopAll() {
    audioOn = false; cycleMel = false; try { audio.pause(); } catch (e) {}
    if (usingSynth) { usingSynth = false; stopSynth(); }
    setBird(false);
  }
  function fallbackSynth(why) {
    audioOn = false;
    songMsg((spNote ? SP_MSG + ' ' : '') + why + ' شغّلنا اللحن الاحتياطي بدل الأغنية.', true);
    usingSynth = true; startSynth();
  }
  // ---- Spotify links: shown as Spotify's own embedded player ----
  function spotifyEmbed(u) {
    var m = /^https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(track|album|playlist|episode)\/([A-Za-z0-9]+)/i.exec(u);
    return m ? 'https://open.spotify.com/embed/' + m[1].toLowerCase() + '/' + m[2] : null;
  }
  var spNote = false, SP_MSG = 'روابط سبوتيفاي مش بتشتغل هنا، لأن الصفحة بتمنع مشغّل سبوتيفاي. حط رابط مباشر لملف صوت (mp3 أو m4a) بدالها. شغّلنا الألحان دلوقتي.';
  function blockedLink(u) { return /^https?:\/\/(open\.spotify\.com|spotify\.link|(www\.|m\.|music\.)?youtube\.com|youtu\.be)\//i.test(u); }
  var BL_MSG = 'روابط سبوتيفاي ويوتيوب بيمنعها المتصفح جوه الصفحة دي، فمش هينفع تشتغل هنا. شغّلنا بدالها الألحان التلاتة: رومانسي وهادي وفرح، ورا بعض.';
  var cycleMel = false;
  function startAudio() {
    if (blockedLink(songUrl)) { audioOn = false; songMsg(BL_MSG, true); cycleMel = true; usingSynth = true; startSynth(); return; }
    var se = null;
    spNote = false;
    if (!songUrl) { audioOn = false; usingSynth = true; startSynth(); return; }
    if (!validUrl(songUrl)) { fallbackSynth('الرابط مش صح.'); return; }
    if (audio.getAttribute('data-src') !== songUrl) { audio.src = songUrl; audio.setAttribute('data-src', songUrl); }
    audioOn = true; setBird(true); songMsg('بنحمّل الأغنية...');
    var pr = audio.play();
    if (pr && pr.then) pr.then(function () { songMsg('شغّالة'); }).catch(function () { if (audioOn) { stopAll(); fallbackSynth('الأغنية مارضيتش تشتغل (الرابط مش مباشر أو الموقع مانعها).'); } });
  }
  audio.addEventListener('error', function () { if (audioOn) { audioOn = false; try { audio.pause(); } catch (e) {} setBird(false); fallbackSynth('الرابط ده مش ملف صوت بيشتغل.'); } });
  audio.addEventListener('playing', function () { if (audioOn) songMsg('شغّالة'); });
  $('birdBtn').addEventListener('click', function () {
    if (audioOn || usingSynth) { stopAll(); songMsg(''); } else startAudio();
  });
  function saveSong() {
    var v = $('inSong').value.trim();
    if (!v) v = DEFAULT_SONG;
    if (v === DEFAULT_SONG) $('inSong').value = '';
    var wasOn = audioOn;
    songUrl = v; audio.removeAttribute('data-src'); songCur();
    try { if (v === DEFAULT_SONG) window.__ls.removeItem(SKEY); else window.__ls.setItem(SKEY, v.slice(0, 400)); } catch (e) {}
    if (v === DEFAULT_SONG) { songMsg('تمام، العصفورة هتشغّل الألحان.'); if (wasOn || usingSynth) { stopAll(); startAudio(); } return; }
    if (!validUrl(v)) { songMsg('لازم رابط يبدأ بـ http أو https', true); return; }
    if (blockedLink(v)) { songMsg('ده رابط سبوتيفاي أو يوتيوب، وبيتمنع جوه الصفحة. اضغط العصفورة وهتسمع الألحان التلاتة (رومانسي، هادي، فرح) بدالها. أو حط رابط مباشر لملف صوت (mp3 أو m4a).', true); return; }
    songMsg('اتحفظ الرابط. اضغط العصفورة تسمع.');
    if (wasOn || usingSynth) { stopAll(); startAudio(); }
  }
  $('inSong').addEventListener('change', saveSong);
  $('inSong').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); saveSong(); } });
  $('songTest').addEventListener('click', function () { saveSong(); if (!audioOn) { stopAll(); startAudio(); } });
  $('songReset').addEventListener('click', function () { $('inSong').value = DEFAULT_SONG; saveSong(); });

  function drawChips() {
    var box = $('melChips'); box.innerHTML = '';
    MEL.forEach(function (m, i) {
      var b = document.createElement('button'); b.type = 'button'; b.textContent = m.name;
      b.setAttribute('aria-pressed', i === melIdx ? 'true' : 'false');
      b.onclick = function () {
        cycleMel = false; melIdx = i; try { window.__ls.setItem(MKEY, m.id); } catch (e) {}
        drawChips();
        if (playing && usingSynth) { stopSynth(); setTimeout(startSynth, 120); }
      };
      box.appendChild(b);
    });
  }
  drawChips();

  // ---- milestones card ----
  var MSG = ["حبيبي انت يا مصطفى\nكل سنه وانت طيب وانت جنبي وساندني ومش بعيد عني حتى لو بعيد مسافه بس اقرب لقلبي من اي حد والسنه الجايه نحتفل بيه في بيتنا سوا بس متكونش راجع من الشغل متأخر كده وتكون في بوزيشن احسن في الشركه واكون بحبك اكتر واكتر بكتير من دلوقتي وانت كمان تكون مبسوط وبتحبني اكتر\nكل سنه وانت طيب يا روحي 💗", "منونتي القمر 💖\nكل سنه وانتي طيبه يا نور عيني و قره عيني كل سنه و انتي حياتي و عمري كل سنه و انتي ماليه عليا حياتي كل سنه وانتي الحب الاول و الاخير كل سنه و انا لقلبك قريب يا روحي و انا بعت عنك 20 سنه مش عايز اضيع يوم تاني من غيرك و عقبال سنين كتير مع بعض كلها حب و موده و ان شاء الله كل السنين اللي جايه تبقي في بيتنا و بنحتفل بيه سوي يا روحي و احلا كتكوته في حياتي كده كده بحبك 💗🎂🥳✨", "في اليوم ده قلبي لقى بيته. قبله كنت عايش، وبعده بقيت عارف يعني إيه حب. كل ثانية فاتت قبل ما أعرفك كانت بتستناكي.", "الدبلة لبست إيدك، وقلبي لبس معاها. وعدتك إن إيدي مش هتسيب إيدك، والوعد ده بيكبر كل يوم زي ما بيكبر حبي ليكي.", "هنا اسمك بيتكتب جنب اسمي بالحلال، ويبقى حبنا عهد قدام ربنا والدنيا كلها. اسمك جنب اسمي للأبد يا نور عيني.", "ليلة العمر. هاخد إيدك على بيتنا وأقول للدنيا كلها: دي حبيبتي وصاحبتي وأحلى هدية ربنا ادهالي. وبعدها كل أيامنا فرح."];
  Array.prototype.forEach.call(document.querySelectorAll('.msItem'), function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      Array.prototype.forEach.call(document.querySelectorAll('.msItem'), function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
      var m = $('msMsg'); m.textContent = MSG[+b.getAttribute('data-i')]; m.className = 'msMsg on';
    });
  });
  function openMs() { openDlg($('msOv')); $('msClose').focus(); }
  function closeMs() { closeDlg($('msOv')); }
  $('starBtn').addEventListener('click', function () {
    if (msOk || !wrapS.hidden) { openMs(); return; }
    afterPw = openMs; openDlg(ov); pin.focus();
  });
  $('msClose').addEventListener('click', closeMs);
  $('pwOv').addEventListener('cancel', function () { afterPw = null; });

  if (imgs.length) { show(0, false); auto(); }


  // ---- song starts on the first touch anywhere (browsers block audio before a gesture) ----
  (function () {
    var evs = ['pointerup', 'touchend', 'click', 'keydown'], armed = true;
    function disarm() { armed = false; evs.forEach(function (n) { document.removeEventListener(n, first, true); }); }
    function first(e) {
      if (!armed) return;
      var t = e.target;
      if (t && t.closest && t.closest('#birdBtn')) { disarm(); return; }
      disarm();
      if (!audioOn && !usingSynth) startAudio();
    }
    evs.forEach(function (n) { document.addEventListener(n, first, true); });
  })();

  // ---- bird: idle hops + small flights, bigger flight on tap ----
  (function () {
    var b = $('birdBtn'), wrapB = $('photoWrap');
    if (!b || !wrapB || !b.animate || reduce) return;
    var BASE = 'scaleX(-1) rotate(-14deg)', busy = false, timers = [];
    function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
    function geom() {
      var W = wrapB.offsetWidth, H = wrapB.offsetHeight;
      return { W: W, H: H, bx: b.offsetLeft + b.offsetWidth / 2, by: b.offsetTop + b.offsetHeight / 2 };
    }
    function tr(x, y, rot) { return 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) ' + BASE + (rot ? ' rotate(' + rot.toFixed(1) + 'deg)' : ''); }
    function done(a, cls) { a.onfinish = a.oncancel = function () { b.classList.remove(cls); busy = false; }; }
    function hop() {
      if (busy || document.hidden) return; busy = true; b.classList.add('flap');
      var a = b.animate([
        { transform: tr(0, 0, 0) }, { transform: tr(0, -9, -4), offset: .25 }, { transform: tr(0, 0, 0), offset: .5 },
        { transform: tr(0, -6, 3), offset: .7 }, { transform: tr(0, 0, 0) }], { duration: 900, easing: 'ease-in-out' });
      done(a, 'flap');
    }
    // flight on an ellipse around the photo, starting and ending at the perch
    function fly(big) {
      if (busy || document.hidden) return; busy = true; b.classList.add('fly');
      var g = geom(), cx = g.W / 2, cy = g.H / 2;
      var rx = g.W / 2 + (big ? 14 : 4), ry = g.H / 2 * (big ? .86 : .5);
      if (!big) { cy = g.H * .3; }
      var a0 = Math.atan2(g.by - cy, g.bx - cx), N = big ? 36 : 22, kf = [], i;
      for (i = 0; i <= N; i++) {
        var t = i / N, ang = a0 - t * Math.PI * 2;
        var wob = big ? Math.sin(t * Math.PI * 6) * 6 : 0;
        var scl = Math.sin(t * Math.PI);
        var x = cx + (rx + wob) * Math.cos(ang), y = cy + ry * Math.sin(ang);
        x = g.bx + (x - g.bx) * (i === 0 || i === N ? 0 : 1) + (i === 0 || i === N ? 0 : 0);
        var px = i === 0 || i === N ? 0 : x - g.bx, py = i === 0 || i === N ? 0 : (cy + ry * Math.sin(ang)) - g.by;
        kf.push({ transform: tr(px, py, Math.sin(t * Math.PI * 4) * 10), offset: t });
      }
      var a = b.animate(kf, { duration: big ? 3800 : 2600, easing: 'ease-in-out' });
      done(a, 'fly');
    }
    function idle() {
      later(function () { (Math.random() < .3 ? fly(false) : hop()); idle(); }, 3500 + Math.random() * 3500);
    }
    later(hop, 900);
    later(function () { fly(false); }, 2600);
    idle();
    b.addEventListener('click', function () { if (!busy) fly(true); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) b.getAnimations().forEach(function (x) { x.cancel(); }); });
  })();
  load();
  ids.forEach(function (id) { $(id).addEventListener('input', function () { save(); render(); }); });
  render();
  setInterval(render, 1000);
  if (!reduce) requestAnimationFrame(frame);
})();
}
