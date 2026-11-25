import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { FileRouter, useLocalState } from '@instinct/files';
import css from './page.css?raw';
import html from './page.html?raw';
import { startLove } from './love';
import { startTree } from './tree';
import { WORDS } from './words';
import './style.css';
import o1 from './photos/o1.jpg';
import o2 from './photos/o2.jpg';
import o3 from './photos/o3.jpg';
import p1 from './photos/p1.jpg';
import p2 from './photos/p2.jpg';
import p2b from './photos/p2b.jpg';
import p3 from './photos/p3.jpg';
import p4 from './photos/p4.jpg';
import p4b from './photos/p4b.jpg';
import p5 from './photos/p5.jpg';
import p6 from './photos/p6.jpg';
import o4 from './photos/o4.jpg';

const PHOTOS = [o1, o2, o3, p1, p2, p2b, p3, p4, p4b, p5, p6, o4];

// internal storage key -> useLocalState key (existing keys keep their names)
const SPEC: [string, string][] = [
    ['love-hourglass-v4', 'love-settings.v1'],
    ['love-hourglass-photos-v1', 'love-photos.v1'],
    ['love-melody-v1', 'love-melody.v1'],
    ['love-song', 'love-song.v1'],
    ['love-hidden2', 'love-hidden.v2'],
    ['love-p0', 'love-p0.v1'],
    ['love-p1', 'love-p1.v1'],
    ['love-p2', 'love-p2.v1'],
    ['love-p3', 'love-p3.v1'],
    ['love-p4', 'love-p4.v1'],
    ['love-p5', 'love-p5.v1'],
    ['love-p6', 'love-p6.v1'],
    ['love-p7', 'love-p7.v1'],
    ['love-p8', 'love-p8.v1'],
    ['love-p9', 'love-p9.v1'],
    ['love-p10', 'love-p10.v1'],
    ['love-p11', 'love-p11.v1'],
    ['love-p12', 'love-p12.v1'],
    ['love-p13', 'love-p13.v1'],
    ['love-p14', 'love-p14.v1'],
    ['love-p15', 'love-p15.v1'],
    ['love-p16', 'love-p16.v1'],
    ['love-p17', 'love-p17.v1'],
    ['love-p18', 'love-p18.v1'],
    ['love-p19', 'love-p19.v1'],
];

function Love() {
    const st = SPEC.map(([, hk]) => useLocalState<string>(hk, ''));
    const ref = useRef<HTMLDivElement>(null);
    const started = useRef(false);
    const setters = useRef<Record<string, (v: string) => void>>({});
    SPEC.forEach(([ik], i) => { setters.current[ik] = st[i][1] as (v: string) => void; });
    const [waited, setWaited] = React.useState(false);
    useEffect(() => { const t = setTimeout(() => setWaited(true), 1500); return () => clearTimeout(t); }, []);
    const ready = st.every((x) => x[2].ready) || waited;

    useEffect(() => {
        if (!ready || started.current || !ref.current) return;
        started.current = true;
        const store: Record<string, string> = {};
        SPEC.forEach(([ik], i) => { const v = st[i][0] as string; if (v) store[ik] = v; });
        const ls = {
            getItem: (k: string) => (k in store ? store[k] : null),
            setItem: (k: string, v: string) => {
                if (/^love-p\d+$/.test(k) && v.length > 15500) throw new Error('too big');
                if (!(k in setters.current)) throw new Error('unknown key');
                store[k] = v;
                setters.current[k](v);
            },
            removeItem: (k: string) => {
                delete store[k];
                if (k in setters.current) setters.current[k]('');
            },
        };
        (window as any).__ls = ls;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
        ref.current.innerHTML = html;
        const holder = ref.current.querySelector('#photos');
        const dotsEl = ref.current.querySelector('#dots');
        PHOTOS.forEach((src, i) => {
            const im = document.createElement('img');
            im.src = src; im.alt = 'مصطفى ومنة الله'; im.decoding = 'async';
            im.style.objectPosition = ['50% 30%', '50% 55%', '50% 35%'][i] || (i === 11 ? '44% 40%' : '50% 40%');
            if (i > 0) im.loading = 'lazy';
            holder?.insertBefore(im, dotsEl);
        });
        const mirrorsEl = ref.current.querySelector('#mirrors');
        // keep the fixed mirror layer outside the scaled photo window (a scaled parent would trap position:fixed)
        if (mirrorsEl) ref.current.appendChild(mirrorsEl);
        (ref.current as HTMLElement).style.position = 'relative';
        const ring = document.createElement('div'); ring.className = 'mirrorRing'; ring.id = 'mirrorRing';
        document.body.appendChild(ring);
        PHOTOS.forEach((src, i) => {
            const m = document.createElement('div');
            m.className = 'mirror';
            const im = document.createElement('img');
            im.src = src; im.alt = ''; im.decoding = 'async';
            im.style.objectPosition = ['50% 30%', '50% 55%', '50% 35%'][i] || (i === 11 ? '44% 40%' : '50% 40%');
            if (i > 0) im.loading = 'lazy';
            m.appendChild(im);
            m.setAttribute('role', 'button'); m.tabIndex = 0; m.setAttribute('aria-label', 'افتح الصورة');
            m.addEventListener('click', () => openMirror(src, im.style.objectPosition));
            m.addEventListener('keydown', (e: any) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openMirror(src, im.style.objectPosition); } });
            ring.appendChild(m);
        });
        // gen 34: round mirrors orbit slowly around the arch photo (rounded-square path), hero only
        const mirs = Array.prototype.slice.call(ring.children) as HTMLElement[];
        let ox = 0, oy = 0, oa = 0, ob = 0, mr = 13, oR = 20;
        const NM = mirs.length;
        const placeRing = () => {
            const host = ref.current as HTMLElement; const pw = host.querySelector('#photoWrap') as HTMLElement | null; if (!pw) return;
            const pe = (pw.querySelector('#photos') || pw) as HTMLElement; const pr = pe.getBoundingClientRect();
            const vw = document.documentElement.clientWidth;
            const d = Math.min(vw, 480) < 361 ? 22 : 26;
            mr = d / 2;
            ring.style.top = '0px'; ring.style.left = '0px'; ring.style.right = 'auto'; ring.style.width = '0px'; ring.style.height = '0px';
            ox = pr.left + window.scrollX + pr.width / 2; oy = pr.top + window.scrollY + pr.height / 2;
            const gap = mr + 8; oR = gap;
            oa = pr.width / 2 + gap; ob = pr.height / 2 + gap;
            
            mirs.forEach((m) => { m.style.width = d + 'px'; });
        };
        let t0 = performance.now();
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const orbit = (now: number) => {
            const ph = reduce ? 0 : (now - t0) / 1000 * (Math.PI * 2 / 120);
            // path = rounded rectangle around the photo, offset so every mirror clears the photo edge
            const R = oR, A = oa - R, B = ob - R; // straight half-lengths
            const sh = 2 * A, sv = 2 * B, arc = Math.PI * R / 2;
            const P = 2 * sh + 2 * sv + 4 * arc;
            for (let i = 0; i < NM; i++) {
                let u = ((ph / (Math.PI * 2) + i / NM) % 1) * P;
                let x = 0, y = 0;
                const segs: [number, (t: number) => [number, number]][] = [
                    [sh, (t) => [-A + t, -B - R]],
                    [arc, (t) => { const q = t / R; return [A + R * Math.sin(q), -B - R * Math.cos(q)]; }],
                    [sv, (t) => [A + R, -B + t]],
                    [arc, (t) => { const q = t / R; return [A + R * Math.cos(q), B + R * Math.sin(q)]; }],
                    [sh, (t) => [A - t, B + R]],
                    [arc, (t) => { const q = t / R; return [-A - R * Math.sin(q), B + R * Math.cos(q)]; }],
                    [sv, (t) => [-A - R, B - t]],
                    [arc, (t) => { const q = t / R; return [-A - R * Math.cos(q), -B - R * Math.sin(q)]; }],
                ];
                for (const [len, f] of segs) { if (u <= len) { [x, y] = f(u); break; } u -= len; }
                mirs[i].style.left = (ox + x).toFixed(1) + 'px';
                mirs[i].style.top = (oy + y).toFixed(1) + 'px';
            }
            requestAnimationFrame(orbit);
        };
        placeRing(); window.addEventListener('resize', placeRing); setTimeout(placeRing, 400); setTimeout(placeRing, 1500);
        if ('ResizeObserver' in window) new ResizeObserver(placeRing).observe(ref.current as HTMLElement);
        requestAnimationFrame(orbit);
        // tap a mirror: it flips open, enlarged, with a sweet word on the photo; a different word each time (shuffled bag, no repeat until all are used)
        let bag: number[] = []; let lastW = -1;
        const nextWord = () => {
            if (!bag.length) {
                bag = WORDS.map((_, i) => i);
                for (let i = bag.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [bag[i], bag[j]] = [bag[j], bag[i]]; }
                if (bag[bag.length - 1] === lastW && bag.length > 1) bag.unshift(bag.pop() as number);
            }
            lastW = bag.pop() as number;
            return WORDS[lastW];
        };
        let ov: HTMLElement | null = null;
        const closeMirror = () => { if (ov) { ov.remove(); ov = null; } ring.classList.remove('hush'); };
        const openMirror = (src: string, pos: string) => {
            closeMirror();
            if (!mirrorsEl) return;
            ov = document.createElement('div');
            ov.className = 'mOv';
            const card = document.createElement('div'); card.className = 'mCard';
            card.innerHTML = '<div class="mIn"><div class="mFace mFront"><img alt=""></div><div class="mFace mBack"><img alt=""><div class="mScrim"></div><p class="mTxt"></p></div></div>';
            card.querySelectorAll('img').forEach((i: any) => { i.src = src; i.style.objectPosition = pos; });
            (card.querySelector('.mTxt') as HTMLElement).textContent = nextWord();
            const x = document.createElement('button'); x.className = 'mX'; x.type = 'button'; x.textContent = '✕'; x.setAttribute('aria-label', 'اقفل');
            x.addEventListener('click', (e) => { e.stopPropagation(); closeMirror(); });
            card.appendChild(x);
            ov.appendChild(card);
            ov.addEventListener('click', closeMirror);
            card.addEventListener('click', (e) => { e.stopPropagation(); card.classList.toggle('back'); });
            mirrorsEl.appendChild(ov); ring.classList.add('hush');
            requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('back')));
        };
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMirror(); });
        // Mirrors grow a little as he scrolls down (--sg: 0 at the top, 1 at the bottom).
        // The page is shown inside a host frame that scrolls around it, so a scroll listener
        // here never fires. Instead, sentinels down the page watch (through IntersectionObserver,
        // which sees clipping by the host viewport) how far the visible band has moved.
        const mirrorsBox = mirrorsEl as HTMLElement | null;
        const mainEl = ref.current.querySelector('main') as HTMLElement | null;
        if (mirrorsBox && mainEl && 'IntersectionObserver' in window) {
            mainEl.style.position = 'relative';
            const N = 24;
            const vis: boolean[] = new Array(N + 1).fill(false);
            const update = () => {
                let lo = -1, hi = -1;
                for (let i = 0; i <= N; i++) if (vis[i]) { if (lo < 0) lo = i; hi = i; }
                if (lo < 0) return;
                // progress = how far the visible band has traveled, from its top edge:
                // 0 when the band's first sentinel is the page top, 1 at the bottom.
                const range = N - (hi - lo);
                if (range <= 0) return; // whole page visible (load transient)
                const p = Math.min(1, Math.max(0, lo / range));
                // front-loaded curve: growth is visible from the very first scroll
                const eased = Math.pow(p, 0.6);
                // keep all mirrors inside the band of the page the user is looking at (the frame is as tall as the page)
                const step = mainEl.offsetHeight / N;
                const bt = Math.max(0, mainEl.offsetTop + lo * step);
                const bh = Math.max(step * 8, (hi - lo) * step);
                mirrorsBox.style.setProperty('--bt', bt.toFixed(0) + 'px');
                mirrorsBox.style.setProperty('--bh', bh.toFixed(0) + 'px');
                mirrorsBox.style.setProperty('--sg', eased.toFixed(3));
                (ref.current as HTMLElement).style.setProperty('--sg', eased.toFixed(3));
            };
            const io = new IntersectionObserver((entries) => {
                entries.forEach((e) => { vis[+(e.target as HTMLElement).dataset.sidx!] = e.isIntersecting; });
                update();
            });
            for (let i = 0; i <= N; i++) {
                const s = document.createElement('div');
                s.dataset.sidx = String(i);
                s.setAttribute('aria-hidden', 'true');
                s.style.cssText = 'position:absolute;left:0;width:1px;height:1px;top:' + (i * 100 / N) + '%;pointer-events:none;';
                mainEl.appendChild(s);
                io.observe(s);
            }
        }
        const ss: Record<string, string> = {};
        (window as any).__ss = {
            getItem: (k: string) => (k in ss ? ss[k] : null),
            setItem: (k: string, v: string) => { ss[k] = v; },
            removeItem: (k: string) => { delete ss[k]; },
        };
        startLove();
        startTree();
    }, [ready]);

    return <div ref={ref} />;
}

createRoot(document.getElementById('root')!).render(<FileRouter><Love /></FileRouter>);
