/* unrot your brain: spin a wheel, get one real task, log it.
   Everything is stored in this browser (localStorage); skills.json holds the tasks. */
'use strict';

const CATS = [
  {key:'pwn',        name:'Binary Exploitation', short:'pwn',       color:'#d9574a'},
  {key:'rev',        name:'Reverse Engineering', short:'rev',       color:'#4fa3a5'},
  {key:'crypto',     name:'Cryptography',        short:'crypto',    color:'#e8c547'},
  {key:'forensics',  name:'Forensics & Stego',   short:'forensics', color:'#7a6fd1'},
  {key:'net',        name:'Networking',          short:'net',       color:'#6aa832'},
  {key:'linux',      name:'Linux & Tooling',     short:'linux',     color:'#d98a3d'},
  {key:'kernel',     name:'Systems & Kernel',    short:'kernel',    color:'#4f7fc4'},
  {key:'winint',     name:'Windows Internals',   short:'win',       color:'#c9667f'},
  {key:'bsd',        name:'BSD & Unix',          short:'bsd',       color:'#9cc24a'},
  {key:'dsa',        name:'LeetCode / DSA',      short:'dsa',       color:'#a46ab8'},
  {key:'ctf',        name:'CTF Challenges',      short:'ctf',       color:'#3fb38a'},
  {key:'geo',        name:'Geography',           short:'geo',       color:'#c47a52'},
  {key:'history',    name:'History',             short:'history',   color:'#8a9bd8'},
  {key:'science',    name:'Science',             short:'science',   color:'#d6a23a'},
  {key:'space',      name:'Astronomy & Space',   short:'space',     color:'#5b6bc0'},
  {key:'nature',     name:'Nature & Biology',    short:'nature',    color:'#5fa04e'},
  {key:'philosophy', name:'Philosophy',          short:'philo',     color:'#b9739d'},
  {key:'psychology', name:'Psychology',          short:'psych',     color:'#48a6c9'},
  {key:'mind',       name:'Memory & Math',       short:'mind',      color:'#d77050'},
  {key:'lang',       name:'World Languages',     short:'lang',      color:'#7bb86f'},
  {key:'money',      name:'Money & Economics',   short:'money',     color:'#c4b04a'},
  {key:'cube',       name:"Rubik's Cube",        short:'cube',      color:'#e06b8b'},
  {key:'games',      name:'Chess & Strategy',    short:'games',     color:'#8d8d8d'},
  {key:'life',       name:'Life Skills',         short:'life',      color:'#5aa79a'},
  {key:'habit',      name:'Habits',              short:'habits',    color:'#a3c45a'},
  {key:'faith',      name:'Faith & Scripture',   short:'faith',     color:'#c99a6b'},
];
const catMap = Object.fromEntries(CATS.map(c => [c.key, c]));
const PRESETS = {
  all: CATS.map(c => c.key),
  cyber: ['pwn','rev','crypto','forensics','net','linux','kernel','winint','bsd','dsa','ctf'],
  knowledge: ['geo','history','science','space','nature','philosophy','psychology','mind','lang','money'],
  life: ['habit','life','games','cube','faith'],
};

let SKILLS = [];
let skillById = new Map();

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ymd = d => d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const diffLabel = d => d === 30 ? '30 min' : d === 60 ? '1 hr' : '2 hr+';
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,7);
const reducedMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
function fmt(ms){ let s = Math.floor(ms/1000); const h = Math.floor(s/3600), m = Math.floor(s%3600/60); s %= 60;
  const p = x => String(x).padStart(2,'0'); return h ? h + ':' + p(m) + ':' + p(s) : m + ':' + p(s); }

/* ---------- pixel font (5x7, hand-drawn) ---------- */
const GLYPHS = {
  A:'01110 10001 10001 11111 10001 10001 10001', B:'11110 10001 10001 11110 10001 10001 11110',
  C:'01110 10001 10000 10000 10000 10001 01110', D:'11110 10001 10001 10001 10001 10001 11110',
  E:'11111 10000 10000 11110 10000 10000 11111', F:'11111 10000 10000 11110 10000 10000 10000',
  G:'01110 10001 10000 10111 10001 10001 01111', H:'10001 10001 10001 11111 10001 10001 10001',
  I:'111 010 010 010 010 010 111',               J:'00111 00010 00010 00010 00010 10010 01100',
  K:'10001 10010 10100 11000 10100 10010 10001', L:'10000 10000 10000 10000 10000 10000 11111',
  M:'10001 11011 10101 10101 10001 10001 10001', N:'10001 10001 11001 10101 10011 10001 10001',
  O:'01110 10001 10001 10001 10001 10001 01110', P:'11110 10001 10001 11110 10000 10000 10000',
  Q:'01110 10001 10001 10001 10101 10010 01101', R:'11110 10001 10001 11110 10100 10010 10001',
  S:'01111 10000 10000 01110 00001 00001 11110', T:'11111 00100 00100 00100 00100 00100 00100',
  U:'10001 10001 10001 10001 10001 10001 01110', V:'10001 10001 10001 10001 10001 01010 00100',
  W:'10001 10001 10001 10101 10101 10101 01010', X:'10001 10001 01010 00100 01010 10001 10001',
  Y:'10001 10001 01010 00100 00100 00100 00100', Z:'11111 00001 00010 00100 01000 10000 11111',
  0:'01110 10001 10011 10101 11001 10001 01110', 1:'010 110 010 010 010 010 111',
  2:'01110 10001 00001 00010 00100 01000 11111', 3:'11110 00001 00001 01110 00001 00001 11110',
  4:'00010 00110 01010 10010 11111 00010 00010', 5:'11111 10000 11110 00001 00001 10001 01110',
  6:'00110 01000 10000 11110 10001 10001 01110', 7:'11111 00001 00010 00100 01000 01000 01000',
  8:'01110 10001 10001 01110 10001 10001 01110', 9:'01110 10001 10001 01111 00001 00010 01100',
  ' ':'000 000 000 000 000 000 000', '.':'0 0 0 0 0 0 1', ',':'00 00 00 00 00 01 10', ':':'0 1 0 0 0 1 0',
  '!':'1 1 1 1 1 0 1', "'":'1 1 0 0 0 0 0', '-':'000 000 000 111 000 000 000', '?':'01110 10001 00001 00010 00100 00000 00100',
  '/':'001 001 010 010 010 100 100', '+':'000 000 010 111 010 000 000', '>':'000 100 010 001 010 100 000',
  '_':'0000 0000 0000 0000 0000 0000 1111', '&':'01100 10010 10100 01000 10101 10010 01101',
};
for (const k in GLYPHS) GLYPHS[k] = GLYPHS[k].split(' ');

// pixel coordinates of a string: [{x,y}], plus total width
function pxLayout(text){
  const pts = []; let x = 0;
  for (const ch of text.toUpperCase()){
    const g = GLYPHS[ch] || GLYPHS[' '];
    g.forEach((row, y) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') pts.push([x+i, y]); });
    x += g[0].length + 1;
  }
  return {pts, w: Math.max(1, x-1)};
}
// swap a .px heading for crisp SVG with a Minecraft-style drop shadow; the text stays as its label
function renderPx(el){ el.innerHTML = pxSvg(el.dataset.px, +el.dataset.scale || 3, +el.dataset.hl || 0, el.classList.contains('snowtext')); }
function pxSvg(text, s, hl, snow){
  const {pts, w} = pxLayout(text);
  const sq = ([x,y]) => 'M' + x + ' ' + y + 'h1v1h-1z';
  let hlEnd = 0;
  if (hl){ hlEnd = pxLayout(text.slice(0, hl)).w + 1; }
  const main = pts.filter(p => p[0] >= hlEnd).map(sq).join(''), acc = pts.filter(p => p[0] < hlEnd).map(sq).join('');
  const shadow = pts.map(([x,y]) => sq([x+1, y+1])).join('');
  return '<svg role="img" aria-label="' + esc(text) + '" viewBox="0 0 ' + (w+1) + ' 8" width="' + (w+1)*s + '" height="' + 8*s +
    '" shape-rendering="crispEdges"><path fill="' + (snow ? '#b2c6d2' : '#06121b') + '" d="' + shadow + '"/>' +
    (acc ? '<path fill="' + (snow ? '#3f8fb0' : '#8fd3ea') + '" d="' + acc + '"/>' : '') + '<path fill="currentColor" d="' + main + '"/></svg>';
}

/* ---------- state (same storage key as the old site, so progress carries over) ---------- */
const KEY = 'skillwheel_v1';
const state = {log:{}};
const ui = {diff:'all', hideCompleted:true, enabledCats:CATS.map(c => c.key), selectedDate:ymd(new Date()), muted:false, mode:'all', recent:[]};
let viewMonth = {y:new Date().getFullYear(), m:new Date().getMonth()};
let rotation = 0, spinning = false, revealed = null;

function load(){
  try {
    const o = JSON.parse(localStorage.getItem(KEY) || 'null'); if (!o) return;
    state.log = o.log || {};
    const u = o.ui || {};
    if (u.diff === 'all' || [30,60,120].includes(u.diff)) ui.diff = u.diff;
    if (typeof u.hideCompleted === 'boolean') ui.hideCompleted = u.hideCompleted;
    if (typeof u.muted === 'boolean') ui.muted = u.muted;
    if (['study','do','all'].includes(u.mode)) ui.mode = u.mode;
    if (Array.isArray(u.recent)) ui.recent = u.recent;
    if (Array.isArray(u.enabledCats)){ const e = u.enabledCats.filter(k => catMap[k]); if (e.length) ui.enabledCats = e; }
  } catch (e) {}
}
function save(){
  try { localStorage.setItem(KEY, JSON.stringify({log:state.log, ui:{diff:ui.diff, hideCompleted:ui.hideCompleted,
    enabledCats:ui.enabledCats, muted:ui.muted, mode:ui.mode, recent:ui.recent}})); } catch (e) {}
}
function completedIds(){ const s = new Set(); for (const d in state.log) for (const t of state.log[d]) if (t.status === 'done') s.add(t.sid); return s; }

function eligibleSkills(){
  const done = ui.hideCompleted ? completedIds() : null;
  return SKILLS.filter(s => ui.enabledCats.includes(s.c) && (ui.diff === 'all' || s.d === ui.diff)
    && (ui.mode === 'all' || s.type === ui.mode) && (!done || !done.has(s.id)));
}
function wheelCats(){ const k = new Set(eligibleSkills().map(s => s.c)); return CATS.filter(c => k.has(c.key)); }

/* ---------- wheel: drawn pixel by pixel at 120x120, scaled up crisp ---------- */
const cv = $('wheel'), ctx = cv.getContext('2d');
const N = 120, CX = 60, CY = 63, R = 55, HUB = 14;
const img = ctx.createImageData(N, N);
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
const ANG = new Float32Array(N*N), RAD = new Float32Array(N*N);
for (let y = 0; y < N; y++) for (let x = 0; x < N; x++){
  const dx = x + .5 - CX, dy = y + .5 - CY, i = y*N + x;
  RAD[i] = Math.hypot(dx, dy); ANG[i] = Math.atan2(dy, dx);
}
const rgb = h => [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
const mul = (c, f) => c.map(v => Math.max(0, Math.min(255, Math.round(v*f))));
CATS.forEach(c => { c.rgb = rgb(c.color); c.dark = mul(c.rgb, .6); c.lite = mul(c.rgb, 1.22); });
const HUBTXT = pxLayout('spin');
const TAU = Math.PI*2, POINTER = -Math.PI/2;

function sizeWheel(){
  const avail = Math.min(420, (cv.closest('.stage') || cv.parentElement).clientWidth - 8);
  const s = Math.max(2, Math.floor(avail / N));
  cv.style.width = cv.style.height = N*s + 'px';
}
function drawWheel(cats){
  const d = img.data, n = cats.length, seg = n ? TAU/n : TAU;
  for (let i = 0; i < N*N; i++){
    const r = RAD[i], o = i*4, x = i % N, y = (i / N) | 0, b = BAYER[(y & 3)*4 + (x & 3)];
    let c = null;
    if (r > R + 1){ d[o+3] = 0; continue; }
    if (r > R){ c = [9,20,27]; }
    else if (r > R - 3){ // icy rim, lit from the top left
      const lit = Math.cos(ANG[i] + Math.PI*.75);
      c = lit > .35 ? [234,241,247] : lit < -.35 ? [58,79,90] : [150,184,196];
    }
    else if (r > R - 4){ c = [9,20,27]; }
    else if (r <= HUB){ c = r > HUB - 1 ? [9,20,27] : r > HUB - 3 ? [234,241,247] : [210,226,234]; }
    else if (!n){ c = (b & 1) ? [22,48,63] : [16,37,52]; }
    else {
      const a = ((ANG[i] - rotation) % TAU + TAU) % TAU, k = Math.floor(a / seg) % n, cat = cats[k];
      const edge = Math.min(a - k*seg, (k+1)*seg - a) * r;   // distance to the nearest divider, in pixels
      if (n > 1 && edge < .75) c = [10,10,10];
      else {
        const t = (r - HUB) / (R - 4 - HUB);                    // 0 at the hub, 1 at the rim
        c = t < .3 ? cat.dark : t < .55 ? (b < (t - .3)/.25*16 ? cat.rgb : cat.dark)
          : t > .9 && b < 6 ? cat.lite : cat.rgb;
      }
    }
    d[o] = c[0]; d[o+1] = c[1]; d[o+2] = c[2]; d[o+3] = 255;
  }
  // "SPIN" on the hub
  const tx = CX - Math.floor(HUBTXT.w/2), ty = CY - 4;
  const put = (x, y, c) => { if (x < 0 || y < 0 || x >= N || y >= N) return; const o = (y*N + x)*4; d[o] = c[0]; d[o+1] = c[1]; d[o+2] = c[2]; d[o+3] = 255; };
  for (const [x,y] of HUBTXT.pts){ put(tx+x, ty+y+1, [150,184,196]); }   // soft shadow on the snow hub
  for (const [x,y] of HUBTXT.pts){ put(tx+x, ty+y, n ? [21,36,46] : [122,150,163]); }
  // pointer at the top: an ice-blue arrow with a dark outline
  for (let y = 0; y < 11; y++){
    const half = 6 - Math.floor(y*6/11);
    for (let x = -half - 1; x <= half + 1; x++){
      const out = Math.abs(x) > half || y === 0;
      put(CX + x, y + 1, out ? [9,20,27] : (x < 0 ? [183,230,245] : [63,143,176]));
    }
  }
  put(CX, 12, [9,20,27]);
  ctx.putImageData(img, 0, 0);
}
function idxUnderPointer(n){ const seg = TAU/n; const a = ((POINTER - rotation) % TAU + TAU) % TAU; return Math.floor(a/seg) % n; }
function setReadout(text){ $('readout').textContent = text; }
function idleReadout(){
  if (!SKILLS.length) return;
  const n = eligibleSkills().length;
  setReadout(n ? n + ' task' + (n === 1 ? '' : 's') + ' in the wheel' : 'nothing matches');
}
function refreshWheel(){ drawWheel(wheelCats()); if (!spinning) idleReadout(); }

let lastTick = null;
function spin(){
  if (spinning || !SKILLS.length) return;
  const pool = eligibleSkills(), cats = wheelCats();
  if (!pool.length){ toast('nothing matches your filters'); return; }
  spinning = true; $('spinbtn').disabled = true; hideReveal(); audioResume(); lastTick = null;
  let fresh = pool.filter(s => !ui.recent.includes(s.id)); if (!fresh.length) fresh = pool;
  const skill = fresh[Math.floor(Math.random()*fresh.length)];
  ui.recent.push(skill.id);
  const cap = Math.max(5, Math.min(80, Math.floor(pool.length*.6))); while (ui.recent.length > cap) ui.recent.shift();
  save();
  const i = cats.findIndex(c => c.key === skill.c), n = cats.length, seg = TAU/n;
  let dest = POINTER - (i*seg + seg/2) + (Math.random() - .5)*seg*.6;
  const quick = reducedMotion(), turns = quick ? 1 : 6 + Math.floor(Math.random()*3);
  while (dest < rotation + turns*TAU) dest += TAU;
  const start = rotation, delta = dest - rotation, dur = quick ? 700 : 4200, t0 = performance.now();
  (function frame(now){
    const p = Math.min(1, (now - t0)/dur);
    rotation = start + delta*(1 - Math.pow(1 - p, 3));
    drawWheel(cats);
    const k = idxUnderPointer(n);
    if (k !== lastTick){ if (lastTick !== null) playTick(); lastTick = k; setReadout(cats[k].name); }
    if (p < 1) return requestAnimationFrame(frame);
    rotation = dest % TAU; spinning = false; $('spinbtn').disabled = false;
    setReadout(catMap[skill.c].name); playWin(); confetti(); showReveal(skill);
  })(t0);
}

/* ---------- reveal ---------- */
function checkHtml(s, open){
  if (!s || !s.check || !s.check.length) return '';
  const study = s.type === 'study';
  const items = s.check.map((q, i) => '<li>' + esc(q) + (study && s.a && s.a[i]
    ? '<details><summary>answer</summary><span class="ans">' + esc(s.a[i]) + '</span></details>' : '') + '</li>').join('');
  return '<h3>' + (study ? 'check yourself' : 'done when') + '</h3><ol>' + items + '</ol>';
}
function hideReveal(){ $('reveal').classList.add('hidden'); }
function showReveal(s){
  revealed = s; const cat = catMap[s.c], el = $('reveal');
  el.innerHTML = '<div class="rv-top"><span class="tagc" style="--cc:' + cat.color + '">' + esc(cat.name) + '</span>' +
    '<span class="meta">' + (s.type === 'study' ? 'study' : 'hands-on') + ' &middot; target ' + diffLabel(s.d) + '</span></div>' +
    '<h2 class="rv-title">' + esc(s.t) + '</h2>' +
    (s.desc ? '<p class="rv-desc">' + esc(s.desc) + '</p>' : '') +
    '<div class="check">' + checkHtml(s) + '</div>' +
    '<div class="rv-btns"><button class="btn primary" id="addBtn">+ add to today</button>' +
    '<button class="btn" id="againBtn">↻ spin again</button><button class="btn ghost" id="duelBtn">⚔ battle this</button></div>';
  el.classList.remove('hidden');
  $('addBtn').onclick = () => { addToToday(s); hideReveal(); toast('added to today ✓'); };
  $('againBtn').onclick = () => { hideReveal(); spin(); };
  $('duelBtn').onclick = () => openBattle(s.t);
  el.scrollIntoView({behavior: reducedMotion() ? 'auto' : 'smooth', block:'nearest'});
}
function addToToday(s){
  const d = ymd(new Date());
  (state.log[d] = state.log[d] || []).push({tid:uid(), sid:s.id, t:s.t, c:s.c, d:s.d, desc:s.desc, status:'pending',
    accMs:0, runningSince:null, stars:null, addedAt:Date.now()});
  const now = new Date(); viewMonth = {y:now.getFullYear(), m:now.getMonth()}; ui.selectedDate = d;
  save(); renderAll();
}

/* ---------- tasks + timer ---------- */
const findTask = (date, tid) => (state.log[date] || []).find(t => t.tid === tid);
const elapsed = t => t.accMs + (t.runningSince ? Date.now() - t.runningSince : 0);
function stop(t){ if (t.runningSince){ t.accMs += Date.now() - t.runningSince; t.runningSince = null; } }
const actions = {
  start(t){ if (t.status !== 'done' && !t.runningSince) t.runningSince = Date.now(); },
  pause(t){ stop(t); },
  done(t){ stop(t); t.status = 'done'; const e = t.accMs;
    t.stars = e <= 0 ? 0 : e <= t.d*60000 ? 3 : e <= t.d*120000 ? 2 : 1;
    if (t.stars === 3) toast('★★★ nailed it'); else if (t.stars) toast('done · ' + t.stars + ' star' + (t.stars > 1 ? 's' : ''));
    if (t.stars === 3) confetti(); },
  reopen(t){ t.status = 'pending'; t.stars = null; },
  del(t, date){ const a = state.log[date]; a.splice(a.indexOf(t), 1); if (!a.length) delete state.log[date]; },
};
const starHtml = n => '<span class="stars">' + [1,2,3].map(i => i <= n ? '★' : '<span class="off">★</span>').join('') + '</span>';

function renderTasks(){
  const el = $('tasks'), ds = ui.selectedDate, arr = state.log[ds] || [];
  const nice = new Date(ds + 'T00:00:00').toLocaleDateString('en-GB', {weekday:'short', day:'numeric', month:'short'});
  let html = '<div class="tasks-head">' + nice.toLowerCase() + (ds === ymd(new Date()) ? ' <span class="tag">TODAY</span>' : '') + '</div>';
  if (!arr.length){ el.innerHTML = html + '<div class="empty-msg">nothing logged.<br>spin the wheel and add one.</div>'; return; }
  for (const t of arr){
    const cat = catMap[t.c] || {name:t.c, color:'#8d8d8d'}, e = elapsed(t), s = skillById.get(t.sid), desc = t.desc || (s && s.desc) || '';
    let ctrl;
    if (t.status === 'done'){
      ctrl = '<div class="t-time fin">' + fmt(e) + ' ' + (t.stars > 0 ? starHtml(t.stars) : '<span class="meta">untimed</span>') + '</div>' +
        '<div class="t-btns"><button class="btn" data-a="reopen" data-t="' + t.tid + '">↺ reopen</button><button class="btn ghost" data-a="del" data-t="' + t.tid + '">delete</button></div>';
    } else if (t.runningSince){
      ctrl = '<div class="t-time run" data-run="' + t.tid + '">▶ ' + fmt(e) + '</div>' +
        '<div class="t-btns"><button class="btn" data-a="pause" data-t="' + t.tid + '">❚❚ pause</button><button class="btn primary" data-a="done" data-t="' + t.tid + '">✓ done</button></div>';
    } else {
      ctrl = (t.accMs > 0 ? '<div class="t-time">' + fmt(e) + '</div>' : '') +
        '<div class="t-btns"><button class="btn" data-a="start" data-t="' + t.tid + '">▶ ' + (t.accMs > 0 ? 'resume' : 'start') + '</button>' +
        '<button class="btn primary" data-a="done" data-t="' + t.tid + '">✓ done</button><button class="btn ghost" data-a="del" data-t="' + t.tid + '">delete</button></div>';
    }
    const chk = s && s.check ? '<details class="check"><summary class="ck">' + (s.type === 'study' ? 'check yourself' : 'done when') + '</summary>' +
      checkHtml(s).replace(/^<h3>.*?<\/h3>/, '') + '</details>' : '';
    html += '<div class="task ' + t.status + '" style="--cc:' + cat.color + '"><div class="t-title">' + esc(t.t) + '</div>' +
      (desc ? '<div class="t-desc">' + esc(desc) + '</div>' : '') + chk +
      '<div class="t-meta"><span class="tagc" style="--cc:' + cat.color + '">' + esc(cat.name) + '</span>' + diffLabel(t.d) + '</div>' + ctrl + '</div>';
  }
  el.innerHTML = html;
}
$('tasks').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const t = findTask(ui.selectedDate, b.dataset.t); if (!t) return;
  actions[b.dataset.a](t, ui.selectedDate); save();
  if (b.dataset.a === 'start' || b.dataset.a === 'pause') renderTasks(); else renderAll();
});
// only the running clocks change every second: update their text, don't rebuild the list
setInterval(() => {
  document.querySelectorAll('[data-run]').forEach(el => { const t = findTask(ui.selectedDate, el.dataset.run); if (t) el.textContent = '▶ ' + fmt(elapsed(t)); });
}, 1000);

/* ---------- calendar + stats ---------- */
const hasDone = ds => (state.log[ds] || []).some(t => t.status === 'done');
function streak(){ let s = 0; const d = new Date(); if (!hasDone(ymd(d))) d.setDate(d.getDate() - 1);
  while (hasDone(ymd(d))){ s++; d.setDate(d.getDate() - 1); } return s; }
function renderCalendar(){
  const {y, m} = viewMonth, first = new Date(y, m, 1), startW = (first.getDay() + 6) % 7, days = new Date(y, m+1, 0).getDate(), today = ymd(new Date());
  let html = '<div class="cal-head"><button class="btn sq small" data-cal="-1" aria-label="previous month">‹</button><div class="cal-title">' +
    first.toLocaleString('en-GB', {month:'long'}) + ' ' + y + '</div><button class="btn sq small" data-cal="1" aria-label="next month">›</button></div><div class="cal-grid">';
  for (const d of ['mo','tu','we','th','fr','sa','su']) html += '<div class="cal-dow">' + d + '</div>';
  for (let i = 0; i < startW; i++) html += '<div class="cal-cell empty"></div>';
  for (let d = 1; d <= days; d++){
    const ds = y + '-' + String(m+1).padStart(2,'0') + '-' + String(d).padStart(2,'0'), arr = state.log[ds] || [];
    const cls = 'cal-cell' + (ds === today ? ' today' : '') + (ds === ui.selectedDate ? ' sel' : '');
    const dot = arr.length ? '<i class="cal-dot' + (arr.every(t => t.status === 'done') ? ' alldone' : '') + '"></i>' : '';
    html += '<button class="' + cls + '" data-date="' + ds + '" aria-label="' + ds + (arr.length ? ', ' + arr.length + ' tasks' : '') + '">' + d + dot + '</button>';
  }
  $('cal').innerHTML = html + '</div>';
}
$('cal').addEventListener('click', e => {
  const nav = e.target.closest('[data-cal]');
  if (nav){ const d = new Date(viewMonth.y, viewMonth.m + +nav.dataset.cal, 1); viewMonth = {y:d.getFullYear(), m:d.getMonth()}; renderCalendar(); return; }
  const c = e.target.closest('[data-date]'); if (c){ ui.selectedDate = c.dataset.date; renderCalendar(); renderTasks(); }
});
$('todayBtn').onclick = () => { const n = new Date(); viewMonth = {y:n.getFullYear(), m:n.getMonth()}; ui.selectedDate = ymd(n); renderCalendar(); renderTasks(); };

function renderStats(){
  let stars = 0, time = 0; const uniq = new Set();
  for (const d in state.log) for (const t of state.log[d]) if (t.status === 'done'){ stars += t.stars || 0; time += t.accMs || 0; uniq.add(t.sid); }
  const stat = (n, l, c) => '<div class="stat"><div class="s-num ' + (c || '') + '">' + n + '</div><div class="s-lab">' + l + '</div></div>';
  $('stats').innerHTML = stat(streak(), 'day streak', 'g') + stat(uniq.size, 'tasks done') + stat(stars + ' ★', 'stars', 'y') + stat(Math.round(time/360000)/10 + ' h', 'time in');
}

/* ---------- filters ---------- */
function seg(id, items, attr, onPick){
  const el = $(id);
  el.innerHTML = items.map(([v, l]) => '<button data-' + attr + '="' + v + '">' + l + '</button>').join('');
  el.addEventListener('click', e => { const b = e.target.closest('[data-' + attr + ']'); if (!b) return; onPick(b.dataset[attr]); save(); updateFilterUI(); refreshWheel(); });
}
function initFilters(){
  seg('difffilter', [['all','all'],[30,'30 min'],[60,'1 hr'],[120,'2 hr+']], 'diff', v => ui.diff = v === 'all' ? 'all' : +v);
  seg('presets', [['all','all'],['cyber','cyber'],['knowledge','knowledge'],['life','life']], 'preset', v => ui.enabledCats = PRESETS[v].slice());
  seg('modefilter', [['all','all'],['study','📚 study'],['do','🛠 hands-on']], 'mode', v => ui.mode = v);
  const cf = $('catfilter');
  cf.innerHTML = CATS.map(c => '<button class="chip" data-cat="' + c.key + '" style="--cc:' + c.color + '" title="' + esc(c.name) + '"><i></i>' + c.short + '</button>').join('');
  cf.addEventListener('click', e => {
    const b = e.target.closest('[data-cat]'); if (!b) return; const k = b.dataset.cat, i = ui.enabledCats.indexOf(k);
    if (i >= 0){ if (ui.enabledCats.length > 1) ui.enabledCats.splice(i, 1); } else ui.enabledCats.push(k);
    save(); updateFilterUI(); refreshWheel();
  });
  const hc = $('hidecomp'); hc.checked = ui.hideCompleted;
  hc.addEventListener('change', () => { ui.hideCompleted = hc.checked; save(); refreshWheel(); });
}
function updateFilterUI(){
  const same = (a, b) => a.length === b.length && a.every(k => b.includes(k));
  document.querySelectorAll('[data-diff]').forEach(b => b.classList.toggle('on', String(ui.diff) === b.dataset.diff));
  document.querySelectorAll('[data-mode]').forEach(b => b.classList.toggle('on', ui.mode === b.dataset.mode));
  document.querySelectorAll('[data-preset]').forEach(b => b.classList.toggle('on', same(PRESETS[b.dataset.preset], ui.enabledCats)));
  document.querySelectorAll('[data-cat]').forEach(b => { const on = ui.enabledCats.includes(b.dataset.cat); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on); });
  const fc = $('fcount'); if (fc){
    const presetName = Object.keys(PRESETS).find(k => same(PRESETS[k], ui.enabledCats));
    const bits = [ui.diff === 'all' ? 'any time' : diffLabel(ui.diff), ui.mode === 'all' ? 'both' : ui.mode === 'do' ? 'hands-on' : 'study',
      presetName && presetName !== 'all' ? presetName : ui.enabledCats.length + '/' + CATS.length + ' cats'];
    fc.textContent = bits.join(' · ');
  }
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg){ const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 1900); }

/* ---------- sound: tiny square-wave chiptune, made on the fly ---------- */
let audioCtx = null, muted = false;
function audioResume(){ try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {} }
function beep(freq, at, len, vol, type){
  if (muted || !audioCtx) return;
  const t = audioCtx.currentTime + at, o = audioCtx.createOscillator(), g = audioCtx.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .005); g.gain.exponentialRampToValueAtTime(.0001, t + len);
  o.connect(g).connect(audioCtx.destination); o.start(t); o.stop(t + len + .02);
}
const playTick = () => beep(1200 + Math.random()*300, 0, .04, .08);
const playWin = () => [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => beep(f, i*.08, .3, .12));
const playBuzz = () => [0, .22, .44].forEach(t => beep(440, t, .16, .14));
function setMuted(m){ muted = m; ui.muted = m; const b = $('soundtog'); b.textContent = m ? '🔇' : '🔊'; b.title = m ? 'sound off' : 'sound on'; b.setAttribute('aria-pressed', !m); }

/* ---------- confetti: square pixels on a low-res layer ---------- */
function confetti(){
  if (reducedMotion()) return;
  const S = 4, c = document.createElement('canvas'), w = Math.ceil(innerWidth/S), h = Math.ceil(innerHeight/S);
  c.width = w; c.height = h; c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:150;image-rendering:pixelated';
  document.body.appendChild(c);
  const g = c.getContext('2d'), cols = ['#ffffff', '#b7e6f5', '#8fd3ea', '#e3b23c', '#eaf1f7', '#5fc6e0'];
  const parts = Array.from({length:120}, (_, i) => { const a = Math.random()*TAU, v = 1 + Math.random()*2.4;
    return {x:w/2, y:h*.42, vx:Math.cos(a)*v, vy:Math.sin(a)*v - 1.2, s:1 + (Math.random()*2|0), c:cols[i % cols.length]}; });
  const t0 = performance.now();
  (function frame(now){
    const el = now - t0; g.clearRect(0, 0, w, h);
    for (const p of parts){ p.vy += .06; p.x += p.vx; p.y += p.vy; g.fillStyle = p.c; g.fillRect(p.x|0, p.y|0, p.s, p.s); }
    if (el < 1600) requestAnimationFrame(frame); else c.remove();
  })(t0);
}

/* ---------- falling snow: a slow pixel layer behind everything ---------- */
function startSnow(){
  const c = $('snow'); if (!c || reducedMotion()) return;
  const g = c.getContext('2d'); const S = 3; let w, h, flakes;
  function reset(){
    w = c.width = Math.ceil(innerWidth/S); h = c.height = Math.ceil(innerHeight/S);
    const count = Math.min(70, Math.round(w*h/2600));
    flakes = Array.from({length:count}, () => ({x:Math.random()*w, y:Math.random()*h,
      vy:.08 + Math.random()*.22, drift:.15 + Math.random()*.3, ph:Math.random()*TAU, s:Math.random() < .3 ? 2 : 1}));
  }
  reset(); addEventListener('resize', reset);
  (function frame(){
    if (document.hidden){ return void setTimeout(() => requestAnimationFrame(frame), 400); }
    g.clearRect(0, 0, w, h); g.fillStyle = '#dcebf3';
    for (const f of flakes){ f.y += f.vy; f.ph += .01; f.x += Math.sin(f.ph)*f.drift;
      if (f.y > h){ f.y = -1; f.x = Math.random()*w; }
      g.globalAlpha = f.s === 2 ? .85 : .5; g.fillRect(f.x|0, f.y|0, f.s, f.s); }
    g.globalAlpha = 1; requestAnimationFrame(frame);
  })();
}

/* ---------- cram battle (same storage and invite format as before) ---------- */
const BKEY = 'cram_battle_v1';
let bstate = {standings:{}};
try { const r = JSON.parse(localStorage.getItem(BKEY) || 'null'); if (r && r.standings) bstate = r; } catch (e) {}
const bsave = () => { try { localStorage.setItem(BKEY, JSON.stringify(bstate)); } catch (e) {} };
let bdur = 30, totalMs = 30*60000, players = [{name:'you', task:''}, {name:'friend', task:''}], btimer = null, endTime = 0, remaining = 0, brunning = false;
const enc = o => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(o)))); } catch (e) { return ''; } };
const dec = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } };
const MED = ['🥇','🥈','🥉'];
function bshow(v){ ['bSetup','bRun','bResults'].forEach(x => $(x).classList.toggle('hidden', x !== v)); }
function openBattle(task){
  window.battleOpen = true; $('battleModal').classList.remove('hidden'); bshow('bSetup');
  if (task) players[0].task = task; else if (revealed && !players.some(p => p.task)) players[0].task = revealed.t;
  renderDur(); renderPlayers(); renderStandings(); $('bClose').focus();
}
function closeBattle(){
  window.battleOpen = false; bstop(); $('battleModal').classList.add('hidden');
  if (location.hash.includes('b=')) history.replaceState(null, '', location.pathname + location.search);
}
function renderDur(){ $('bDur').innerHTML = [[15,'15m'],[30,'30m'],[60,'1h'],[120,'2h']].map(([v, l]) => '<button data-d="' + v + '" class="' + (v === bdur ? 'on' : '') + '">' + l + '</button>').join(''); }
function renderPlayers(){
  $('bPlayers').innerHTML = players.map((p, i) => '<div class="bplayer"><input data-i="' + i + '" data-f="name" value="' + esc(p.name) + '" placeholder="player ' + (i+1) + '" aria-label="player ' + (i+1) + ' name">' +
    '<div class="row"><input data-i="' + i + '" data-f="task" value="' + esc(p.task) + '" placeholder="task (blank = free cram)" aria-label="player ' + (i+1) + ' task">' +
    '<button class="btn sq" data-roll="' + i + '" title="random task" aria-label="random task">🎲</button><button class="btn sq" data-rm="' + i + '" title="remove" aria-label="remove player">✕</button></div></div>').join('');
}
function renderStandings(){
  const arr = Object.entries(bstate.standings).map(([name, s]) => ({name, ...s})).sort((a, b) => b.wins - a.wins || b.points - a.points);
  $('bStandings').innerHTML = arr.length ? '<h3>standings</h3>' + arr.map((s, i) => '<div class="bstand-row"><span>' + (MED[i] || '') + ' ' + esc(s.name) +
    '</span><span>' + s.wins + ' win' + (s.wins === 1 ? '' : 's') + ' · ' + s.points + ' pts</span></div>').join('') : '';
}
function bstop(){ if (btimer){ clearInterval(btimer); btimer = null; } brunning = false; }
function buildInvite(){ $('bInvite').value = location.origin + location.pathname + '#b=' + enc({e:endTime, d:Math.round(totalMs/60000), p:players.map(p => ({n:p.name, t:p.task}))}); }
function startTicking(){
  $('bPause').textContent = 'pause'; brunning = true;
  $('bRoster').innerHTML = players.map(p => '<div class="broster-row"><b>' + esc(p.name) + '</b><span>' + esc(p.task || 'free cram') + '</span></div>').join('');
  btick(); clearInterval(btimer); btimer = setInterval(btick, 250);
}
function btick(){
  remaining = endTime - Date.now();
  const s = Math.max(0, Math.ceil(remaining/1000));
  const txt = String(Math.floor(s/60)).padStart(2,'0') + ':' + String(s%60).padStart(2,'0');
  if ($('bTimer').dataset.v !== txt){ $('bTimer').dataset.v = txt; $('bTimer').innerHTML = pxSvg(txt, 9, 0, true); }
  $('bTimer').classList.toggle('low', remaining <= 60000);
  $('bBar').style.width = (totalMs ? Math.max(0, Math.min(1, remaining/totalMs))*100 : 0) + '%';
  if (remaining <= 0){ bstop(); audioResume(); playBuzz(); confetti(); toResults(); }
}
function toResults(){
  $('bScores').innerHTML = players.map((p, i) => '<div class="bscore"><span><b>' + esc(p.name) + '</b><br><span class="muted">' + esc(p.task || 'free cram') +
    '</span></span><input type="number" data-si="' + i + '" placeholder="score" inputmode="numeric" aria-label="' + esc(p.name) + ' score"></div>').join('');
  $('bRanking').innerHTML = ''; bshow('bResults');
}
$('bDur').addEventListener('click', e => { const b = e.target.closest('[data-d]'); if (b){ bdur = +b.dataset.d; renderDur(); } });
$('bPlayers').addEventListener('input', e => { const i = e.target.closest('input[data-i]'); if (i && players[+i.dataset.i]) players[+i.dataset.i][i.dataset.f] = i.value; });
$('bPlayers').addEventListener('click', e => {
  const rm = e.target.closest('[data-rm]'), rl = e.target.closest('[data-roll]');
  if (rm && players.length > 1){ players.splice(+rm.dataset.rm, 1); renderPlayers(); }
  if (rl){ const pl = eligibleSkills(); if (pl.length){ players[+rl.dataset.roll].task = pl[Math.random()*pl.length|0].t; renderPlayers(); } }
});
$('bAddPlayer').onclick = () => { if (players.length < 8){ players.push({name:'', task:''}); renderPlayers(); } };
$('bRollAll').onclick = () => { const pl = eligibleSkills().slice(); players.forEach(p => { if (pl.length) p.task = pl.splice(Math.random()*pl.length|0, 1)[0].t; }); renderPlayers(); };
$('bStart').onclick = () => {
  players = players.map(p => ({name:p.name.trim(), task:p.task.trim()})).filter(p => p.name);
  if (!players.length) players = [{name:'you', task:''}];
  audioResume(); totalMs = bdur*60000; endTime = Date.now() + totalMs; buildInvite();
  $('bHint').textContent = 'Share this link so friends join the same countdown.'; bshow('bRun'); startTicking();
};
$('bPause').onclick = () => {
  if (brunning){ remaining = endTime - Date.now(); bstop(); $('bPause').textContent = 'resume'; }
  else { endTime = Date.now() + Math.max(0, remaining); buildInvite(); startTicking(); }
};
$('bFinishEarly').onclick = () => { bstop(); confetti(); toResults(); };
$('bCopy').onclick = () => {
  const v = $('bInvite').value;
  (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => $('bHint').textContent = 'link copied, send it to your friends',
    () => { $('bInvite').select(); $('bHint').textContent = 'press ctrl+c to copy the link'; });
};
$('bFinish').onclick = () => {
  const scores = players.map((p, i) => ({name:p.name, task:p.task, score:parseFloat($('bScores').querySelector('[data-si="' + i + '"]').value) || 0}))
    .sort((a, b) => b.score - a.score);
  const top = scores.length ? scores[0].score : 0;
  for (const s of scores){ const st = bstate.standings[s.name] || (bstate.standings[s.name] = {wins:0, points:0, battles:0});
    st.points += s.score; st.battles++; if (s.score === top && top > 0) st.wins++; }
  bsave();
  $('bRanking').innerHTML = '<h3>result</h3>' + scores.map((s, i) => '<div class="brank-row' + (s.score === top && top > 0 ? ' win' : '') + '"><span>' + (MED[i] || '') + ' ' +
    esc(s.name) + ' <span class="muted">' + esc(s.task) + '</span></span><span>' + s.score + '</span></div>').join('') +
    '<div class="bactions"><button class="btn primary wide" id="bNew">new battle</button></div>';
  $('bNew').onclick = () => { bshow('bSetup'); renderPlayers(); renderStandings(); };
  renderStandings();
};
$('bClose').onclick = closeBattle;
$('battleModal').addEventListener('click', e => { if (e.target === $('battleModal')) closeBattle(); });
$('battleBtn').onclick = () => openBattle();
function joinFromHash(){
  const m = location.hash.match(/[#&]b=([^&]+)/); if (!m) return;
  const d = dec(m[1]); if (!d || !d.e) return;
  totalMs = (d.d || 30)*60000; endTime = d.e;
  if (Array.isArray(d.p) && d.p.length) players = d.p.map(x => ({name:x.n || 'player', task:x.t || ''}));
  window.battleOpen = true; $('battleModal').classList.remove('hidden'); buildInvite();
  $('bHint').textContent = 'You joined a shared battle. Cram until the timer ends!';
  if (endTime > Date.now()){ bshow('bRun'); startTicking(); } else toResults();
}

/* ---------- boot ---------- */
function renderAll(){ renderStats(); renderCalendar(); renderTasks(); updateFilterUI(); refreshWheel(); }

document.querySelectorAll('.px[data-px]').forEach(renderPx);
load(); setMuted(!!ui.muted); initFilters(); sizeWheel(); renderAll(); joinFromHash(); startSnow();
if (innerWidth < 720) $('filterbox').open = false;   // keep the wheel near the top on phones
addEventListener('resize', sizeWheel);
$('soundtog').onclick = () => { setMuted(!muted); save(); if (!muted){ audioResume(); playTick(); } };
$('spinbtn').onclick = spin;
cv.addEventListener('click', spin);
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && window.battleOpen){ closeBattle(); return; }
  if (window.battleOpen || e.ctrlKey || e.metaKey || e.altKey) return;
  const tag = e.target.tagName, own = e.target === cv;
  if ((e.code === 'Space' || (own && e.key === 'Enter')) && (own || !/^(INPUT|TEXTAREA|SELECT|BUTTON|SUMMARY|A)$/.test(tag))){ e.preventDefault(); spin(); }
});

fetch('skills.json').then(r => { if (!r.ok) throw new Error(r.status); return r.json(); }).then(list => {
  SKILLS = list; skillById = new Map(list.map(s => [s.id, s]));
  $('spinbtn').disabled = false; renderAll();
}).catch(() => setReadout('could not load tasks'));
