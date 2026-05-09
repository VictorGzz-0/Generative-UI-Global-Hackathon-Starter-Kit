// ===== Neural Network Background (versión blanca y menos saturada) =====
// Requiere en el HTML: <canvas id="starfield-canvas"></canvas>

const canvas = document.getElementById('starfield-canvas');
const ctx = canvas.getContext('2d', { alpha: true });

// ----- Configuración visual -----
const BG_COLOR = 'rgba(8, 10, 18, 0.08)';   // Fondo con rastro
const NODE_COLOR_INACTIVE = '#555';         // Nodos apagados gris medio
const NODE_COLOR_ACTIVE = '#ffffff';        // Nodos activos blancos
const EDGE_COLOR = '255, 255, 255';         // Blanco puro para conexiones
const AREA_PER_NODE = 20000;                // Más área por nodo -> menos nodos
const CONNECTION_PROB = 0.06;               // ↓ Reducido (mitad) para menos conexiones visibles
const NODE_RADIUS = 2.2;

// ----- Otros parámetros -----
const INTERACTION_RADIUS = 120;
const RANDOM_TOGGLE_PROB = 0.008;
const SPEED_BASE = 0.35;
const SPEED_JITTER = 0.45;
const SIGNAL_RISE = 0.12;
const SIGNAL_DECAY = 0.06;
const ENERGY_RISE = 0.10;
const ENERGY_DECAY = 0.05;
const EDGE_ALPHA_SCALE = 0.25;

// ----- Tope de conexiones (mitad del máximo teórico) -----
const MAX_EDGE_RATIO = 0.5; // 0.5 = 50% de las aristas posibles i<j

// ----- Estado -----
let vw = 0, vh = 0, dpr = 1;
let nodes = [];
let edges = [];
const pointer = { x: 0, y: 0, active: false };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const randSign = () => (Math.random() < 0.5 ? -1 : 1);

function resizeCanvas() {
  dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
  vw = window.innerWidth;
  vh = window.innerHeight;

  canvas.style.width = vw + 'px';
  canvas.style.height = vh + 'px';
  canvas.width = Math.round(vw * dpr);
  canvas.height = Math.round(vh * dpr);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const desired = Math.round((vw * vh) / AREA_PER_NODE);
  initNodes(desired);
  buildEdges();
}

function initNodes(count) {
  nodes = new Array(count).fill(0).map(() => ({
    x: Math.random() * vw,
    y: Math.random() * vh,
    vx: (SPEED_BASE + Math.random() * SPEED_JITTER) * randSign(),
    vy: (SPEED_BASE + Math.random() * SPEED_JITTER) * randSign(),
    baseActive: Math.random() < 0.5,
    energy: Math.random() * 0.6
  }));
}

// ----- buildEdges con límite de conexiones -----
function buildEdges() {
  edges = [];
  const n = nodes.length;

  // Genera pares candidatos según CONNECTION_PROB (topología base menos densa)
  const pairs = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      if (Math.random() < CONNECTION_PROB) {
        pairs.push([i, j]);
      }
    }
  }

  // Baraja los pares
  for (let k = pairs.length - 1; k > 0; k--) {
    const r = Math.floor(Math.random() * (k + 1));
    [pairs[k], pairs[r]] = [pairs[r], pairs[k]];
  }

  // Aplica el tope del 50% del máximo teórico de aristas
  const maxEdges = Math.floor((n * (n - 1) / 2) * MAX_EDGE_RATIO);
  const selected = pairs.slice(0, Math.min(maxEdges, pairs.length));

  // Crea aristas
  for (const [i, j] of selected) {
    edges.push({ i, j, signal: Math.random() * 0.2 });
  }
}

// ----- Interacción -----
function onPointerMove(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  pointer.x = clientX - rect.left;
  pointer.y = clientY - rect.top;
  pointer.active = true;
}
function onPointerLeave() { pointer.active = false; }

canvas.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
canvas.addEventListener('mouseleave', onPointerLeave);
canvas.addEventListener('touchstart', (e) => {
  if (e.touches && e.touches.length) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
canvas.addEventListener('touchmove', (e) => {
  if (e.touches && e.touches.length) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });
canvas.addEventListener('touchend', onPointerLeave);

// ----- Actualización y dibujo -----
function updateNodes() {
  for (let n of nodes) {
    n.x += n.vx;
    n.y += n.vy;

    if (n.x < 0 || n.x > vw) n.vx *= -1;
    if (n.y < 0 || n.y > vh) n.vy *= -1;

    if (Math.random() < RANDOM_TOGGLE_PROB) n.baseActive = !n.baseActive;

    let pointerBoost = 0;
    if (pointer.active) {
      const dx = n.x - pointer.x;
      const dy = n.y - pointer.y;
      const dist = Math.hypot(dx, dy);
      if (dist < INTERACTION_RADIUS) pointerBoost = 1 - (dist / INTERACTION_RADIUS);
    }

    const target = Math.max(n.baseActive ? 1 : 0.15, pointerBoost);
    if (n.energy < target) n.energy = lerp(n.energy, target, ENERGY_RISE);
    else n.energy = lerp(n.energy, target, ENERGY_DECAY);
  }
}

function drawBackground() {
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, vw, vh);
}

function drawNodes() {
  for (let n of nodes) {
    ctx.beginPath();
    ctx.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = n.energy > 0.5 ? NODE_COLOR_ACTIVE : NODE_COLOR_INACTIVE;
    ctx.fill();
  }
}

function updateAndDrawEdges() {
  for (let e of edges) {
    const a = nodes[e.i];
    const b = nodes[e.j];

    const bothActive = (a.energy > 0.55 && b.energy > 0.55);
    if (bothActive) e.signal = Math.min(1, e.signal + SIGNAL_RISE);
    else e.signal = Math.max(0, e.signal - SIGNAL_DECAY);

    const alpha = clamp(((a.energy + b.energy) * 0.5) * EDGE_ALPHA_SCALE * e.signal, 0, 1);
    if (alpha <= 0.01) continue;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = `rgba(${EDGE_COLOR}, ${alpha})`;
    ctx.stroke();
  }
}

function animate() {
  drawBackground();
  updateNodes();
  updateAndDrawEdges();
  drawNodes();
  requestAnimationFrame(animate);
}

// ----- Setup -----
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
animate();
