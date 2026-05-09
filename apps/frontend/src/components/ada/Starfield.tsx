"use client";

/**
 * Starfield — animated neural-network background canvas.
 *
 * Ported from OpenData/starfield.js into a React component.
 * Renders a full-viewport `<canvas>` behind all other content with
 * a dark graphite background, white node dots, and semi-transparent
 * edge connections that brighten near the cursor.
 */

import { useEffect, useRef } from "react";

// ----- Configuration -----
const BG_COLOR = "rgba(8, 10, 18, 0.08)";
const NODE_COLOR_INACTIVE = "#555";
const NODE_COLOR_ACTIVE = "#ffffff";
const EDGE_COLOR = "255, 255, 255";
const AREA_PER_NODE = 20000;
const CONNECTION_PROB = 0.06;
const NODE_RADIUS = 2.2;
const INTERACTION_RADIUS = 120;
const RANDOM_TOGGLE_PROB = 0.008;
const SPEED_BASE = 0.35;
const SPEED_JITTER = 0.45;
const SIGNAL_RISE = 0.12;
const SIGNAL_DECAY = 0.06;
const ENERGY_RISE = 0.1;
const ENERGY_DECAY = 0.05;
const EDGE_ALPHA_SCALE = 0.25;
const MAX_EDGE_RATIO = 0.5;

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseActive: boolean;
  energy: number;
}

interface Edge {
  i: number;
  j: number;
  signal: number;
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const randSign = () => (Math.random() < 0.5 ? -1 : 1);

export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let vw = 0;
    let vh = 0;
    let dpr = 1;
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    const pointer = { x: 0, y: 0, active: false };
    let raf: number;

    function initNodes(count: number) {
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * vw,
        y: Math.random() * vh,
        vx: (SPEED_BASE + Math.random() * SPEED_JITTER) * randSign(),
        vy: (SPEED_BASE + Math.random() * SPEED_JITTER) * randSign(),
        baseActive: Math.random() < 0.5,
        energy: Math.random() * 0.6,
      }));
    }

    function buildEdges() {
      edges = [];
      const n = nodes.length;
      const pairs: [number, number][] = [];
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          if (Math.random() < CONNECTION_PROB) pairs.push([i, j]);
        }
      }
      // Shuffle
      for (let k = pairs.length - 1; k > 0; k--) {
        const r = Math.floor(Math.random() * (k + 1));
        [pairs[k], pairs[r]] = [pairs[r], pairs[k]];
      }
      const maxEdges = Math.floor(((n * (n - 1)) / 2) * MAX_EDGE_RATIO);
      const selected = pairs.slice(0, Math.min(maxEdges, pairs.length));
      for (const [i, j] of selected) {
        edges.push({ i, j, signal: Math.random() * 0.2 });
      }
    }

    function resize() {
      dpr = Math.max(1, Math.min(2.5, window.devicePixelRatio || 1));
      vw = window.innerWidth;
      vh = window.innerHeight;
      canvas!.style.width = vw + "px";
      canvas!.style.height = vh + "px";
      canvas!.width = Math.round(vw * dpr);
      canvas!.height = Math.round(vh * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const desired = Math.round((vw * vh) / AREA_PER_NODE);
      initNodes(desired);
      buildEdges();
    }

    function updateNodes() {
      for (const n of nodes) {
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
          if (dist < INTERACTION_RADIUS)
            pointerBoost = 1 - dist / INTERACTION_RADIUS;
        }
        const target = Math.max(n.baseActive ? 1 : 0.15, pointerBoost);
        if (n.energy < target) n.energy = lerp(n.energy, target, ENERGY_RISE);
        else n.energy = lerp(n.energy, target, ENERGY_DECAY);
      }
    }

    function draw() {
      ctx!.fillStyle = BG_COLOR;
      ctx!.fillRect(0, 0, vw, vh);
      // Edges
      for (const e of edges) {
        const a = nodes[e.i];
        const b = nodes[e.j];
        const bothActive = a.energy > 0.55 && b.energy > 0.55;
        if (bothActive) e.signal = Math.min(1, e.signal + SIGNAL_RISE);
        else e.signal = Math.max(0, e.signal - SIGNAL_DECAY);
        const alpha = clamp(
          ((a.energy + b.energy) * 0.5) * EDGE_ALPHA_SCALE * e.signal,
          0,
          1,
        );
        if (alpha <= 0.01) continue;
        ctx!.beginPath();
        ctx!.moveTo(a.x, a.y);
        ctx!.lineTo(b.x, b.y);
        ctx!.lineWidth = 0.5;
        ctx!.strokeStyle = `rgba(${EDGE_COLOR}, ${alpha})`;
        ctx!.stroke();
      }
      // Nodes
      for (const n of nodes) {
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, NODE_RADIUS, 0, Math.PI * 2);
        ctx!.fillStyle =
          n.energy > 0.5 ? NODE_COLOR_ACTIVE : NODE_COLOR_INACTIVE;
        ctx!.fill();
      }
    }

    function animate() {
      updateNodes();
      draw();
      raf = requestAnimationFrame(animate);
    }

    function onPointerMove(clientX: number, clientY: number) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = clientX - rect.left;
      pointer.y = clientY - rect.top;
      pointer.active = true;
    }
    function onPointerLeave() {
      pointer.active = false;
    }

    const handleMouseMove = (e: MouseEvent) =>
      onPointerMove(e.clientX, e.clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length) onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", onPointerLeave);
    canvas.addEventListener("touchstart", handleTouchMove, { passive: true });
    canvas.addEventListener("touchmove", handleTouchMove, { passive: true });
    canvas.addEventListener("touchend", onPointerLeave);
    window.addEventListener("resize", resize);

    resize();
    animate();

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", onPointerLeave);
      canvas.removeEventListener("touchstart", handleTouchMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("touchend", onPointerLeave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -1,
        backgroundColor: "#0E1113",
      }}
    />
  );
}
