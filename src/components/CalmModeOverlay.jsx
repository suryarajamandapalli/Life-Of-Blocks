import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import * as THREE from 'three';
import { sound } from '../services/sound';
import { pixabayService, CURATED_PIXABAY_VIDEOS } from '../services/pixabayVideo';

// Meaningful, peaceful completion copy randomly selected
const ZEN_MESSAGES = [
  "You made space.",
  "Breathe. You earned this moment.",
  "One step complete. Keep going gently.",
  "Nothing to rush. Just keep moving."
];

// Card geometric dimensions
const CARD_WIDTH = 340;
const CARD_HEIGHT = 210;
const CARD_RADIUS = 26;

// Sutherland-Hodgman Polygon Clipping with Perpendicular Bisector
function clipPolygonWithBisector(poly, pi, pj) {
  const mx = (pi.x + pj.x) / 2;
  const my = (pi.y + pj.y) / 2;
  const nx = pj.x - pi.x;
  const ny = pj.y - pi.y;

  function isInside(p) {
    return ((p.x - mx) * nx + (p.y - my) * ny) <= 0.0001;
  }

  function intersection(s, e) {
    const dsx = s.x - mx;
    const dsy = s.y - my;
    const dex = e.x - mx;
    const dey = e.y - my;
    const distS = dsx * nx + dsy * ny;
    const distE = dex * nx + dey * ny;
    const denom = distS - distE;
    if (Math.abs(denom) < 1e-6) return s;
    const t = Math.max(0, Math.min(1, distS / denom));
    return {
      x: s.x + t * (e.x - s.x),
      y: s.y + t * (e.y - s.y)
    };
  }

  const output = [];
  if (!poly || poly.length === 0) return output;
  let s = poly[poly.length - 1];
  for (let i = 0; i < poly.length; i++) {
    const e = poly[i];
    if (isInside(e)) {
      if (isInside(s)) {
        output.push(e);
      } else {
        output.push(intersection(s, e));
        output.push(e);
      }
    } else if (isInside(s)) {
      output.push(intersection(s, e));
    }
    s = e;
  }
  return output;
}

// Generate organic Voronoi polygon shards clustered at tap point
function generateVoronoiCells(W, H, tapX, tapY) {
  const halfW = W / 2;
  const halfH = H / 2;
  const relX = tapX - halfW;
  const relY = tapY - halfH;

  const points = [];
  points.push({ x: relX, y: relY });

  // Concentric organic rings with radial jitter
  const rings = [
    { count: 12, minR: 12, maxR: 38 },
    { count: 18, minR: 38, maxR: 85 },
    { count: 20, minR: 85, maxR: 155 },
    { count: 16, minR: 150, maxR: 250 }
  ];

  rings.forEach(({ count, minR, maxR }) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
      const r = minR + Math.random() * (maxR - minR);
      const px = Math.max(-halfW - 25, Math.min(halfW + 25, relX + Math.cos(angle) * r));
      const py = Math.max(-halfH - 25, Math.min(halfH + 25, relY + Math.sin(angle) * r));
      points.push({ x: px, y: py });
    }
  });

  const baseRect = [
    { x: -halfW, y: -halfH },
    { x: halfW, y: -halfH },
    { x: halfW, y: halfH },
    { x: -halfW, y: halfH }
  ];

  const cells = [];

  for (let i = 0; i < points.length; i++) {
    const pi = points[i];
    let cell = [...baseRect];

    for (let j = 0; j < points.length; j++) {
      if (i === j) continue;
      const pj = points[j];
      const distSq = (pi.x - pj.x) ** 2 + (pi.y - pj.y) ** 2;
      if (distSq > (Math.max(W, H) * 1.5) ** 2) continue;

      cell = clipPolygonWithBisector(cell, pi, pj);
      if (cell.length < 3) break;
    }

    if (cell.length >= 3) {
      let area = 0;
      let cx = 0;
      let cy = 0;
      for (let k = 0; k < cell.length; k++) {
        const p1 = cell[k];
        const p2 = cell[(k + 1) % cell.length];
        const cross = (p1.x * p2.y - p2.x * p1.y);
        area += cross;
        cx += (p1.x + p2.x) * cross;
        cy += (p1.y + p2.y) * cross;
      }
      area = Math.abs(area) / 2;
      if (area > 8) {
        cx /= (6 * area);
        cy /= (6 * area);
        const dist = Math.hypot(cx - relX, cy - relY);
        const angle = Math.atan2(cy - relY, cx - relX);
        const tier = dist <= 50 ? 1 : (dist <= 125 ? 2 : 3);
        cells.push({ vertices: cell, cx, cy, area, dist, angle, tier });
      }
    }
  }
  return cells;
}

// Render the completed Block onto a high-DPI 2D canvas texture
function renderCardTexture(canvas, { displayName, totalTasks = 0, width = CARD_WIDTH, height = CARD_HEIGHT, dpr = 2 }) {
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // 1. Smoked Glass Card Body with Rounded Corners
  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(0, 0, width, height, CARD_RADIUS);
  } else {
    ctx.rect(0, 0, width, height);
  }

  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, 'rgba(32, 38, 52, 0.94)');
  grad.addColorStop(1, 'rgba(14, 16, 24, 0.97)');
  ctx.fillStyle = grad;
  ctx.fill();

  // 2. Translucent Glass Border
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.stroke();

  // 3. Diagonal Specular Glass Reflection Sheen
  ctx.save();
  ctx.clip();
  const sheenGrad = ctx.createLinearGradient(0, 0, width, height);
  sheenGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
  sheenGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.05)');
  sheenGrad.addColorStop(0.7, 'transparent');
  sheenGrad.addColorStop(1, 'rgba(255, 255, 255, 0.04)');
  ctx.fillStyle = sheenGrad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();

  // 4. Status Indicator (Top Left: Emerald Glow Dot + COMPLETED)
  ctx.save();
  const glow = ctx.createRadialGradient(28, 28, 0, 28, 28, 10);
  glow.addColorStop(0, 'rgba(52, 211, 153, 0.9)');
  glow.addColorStop(1, 'rgba(52, 211, 153, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(28, 28, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#34d399';
  ctx.beginPath();
  ctx.arc(28, 28, 3.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = '600 11px ui-monospace, monospace';
  ctx.fillStyle = '#34d399';
  ctx.fillText('COMPLETED', 44, 32);
  ctx.restore();

  // 5. Emerald Checkmark Badge (Top Right)
  ctx.save();
  const checkX = width - 36;
  const checkY = 28;
  ctx.beginPath();
  ctx.arc(checkX, checkY, 11, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(checkX - 4.5, checkY - 0.5);
  ctx.lineTo(checkX - 1.2, checkY + 3.2);
  ctx.lineTo(checkX + 4.8, checkY - 3.2);
  ctx.strokeStyle = '#6ee7b7';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();

  // 6. Block Title
  ctx.save();
  ctx.font = '600 21px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;

  let title = displayName || 'Completed Block';
  if (ctx.measureText(title).width > width - 56) {
    while (title.length > 3 && ctx.measureText(title + '...').width > width - 56) {
      title = title.slice(0, -1);
    }
    title += '...';
  }
  ctx.fillText(title, 24, 86);
  ctx.restore();

  // 7. Glowing 100% Progress Bar
  const barY = 126;
  const barW = width - 48;
  const barH = 9;

  ctx.save();
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, barY, barW, barH, 4.5);
  else ctx.rect(24, barY, barW, barH);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.stroke();

  const barGrad = ctx.createLinearGradient(24, 0, 24 + barW, 0);
  barGrad.addColorStop(0, '#34d399');
  barGrad.addColorStop(0.5, '#2dd4bf');
  barGrad.addColorStop(1, '#fcd34d');
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(25, barY + 1, barW - 2, barH - 2, 3.5);
  else ctx.rect(25, barY + 1, barW - 2, barH - 2);
  ctx.fillStyle = barGrad;
  ctx.shadowColor = 'rgba(52, 211, 153, 0.65)';
  ctx.shadowBlur = 8;
  ctx.fill();
  ctx.restore();

  // 8. Progress Metrics Subtext
  ctx.save();
  ctx.font = '500 11px ui-monospace, monospace';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.fillText('100% DONE', 24, barY + 28);

  const taskText = totalTasks > 0 ? `${totalTasks} / ${totalTasks} TASKS` : 'ALL TASKS COMPLETED';
  const taskTextWidth = ctx.measureText(taskText).width;
  ctx.fillText(taskText, width - 24 - taskTextWidth, barY + 28);
  ctx.restore();

  ctx.restore();
}

export default function CalmModeOverlay({ isActive, block, blockName, totalTasks = 0, onClose }) {
  // Experience phases: 'break' -> 'shattering' -> 'zen'
  const [phase, setPhase] = useState('break');
  const [crackCount, setCrackCount] = useState(0); // 0 -> 1 -> 2 -> 3 (triggers Three.js shatter)
  const [zenVideos, setZenVideos] = useState(CURATED_PIXABAY_VIDEOS);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [zenMessage, setZenMessage] = useState(() => ZEN_MESSAGES[0]);

  const rootContainerRef = useRef(null);
  const blockCardWrapperRef = useRef(null);
  const interactiveCanvasRef = useRef(null);
  const textureCanvasRef = useRef(null);
  const threeMountRef = useRef(null);
  const videoRef = useRef(null);
  const stopMusicRef = useRef(null);
  const isClosingRef = useRef(false);
  const animationFrameRef = useRef(null);

  // Voronoi shards and optical ripples state
  const voronoiCellsRef = useRef([]);
  const impactCoordsRef = useRef({ x: CARD_WIDTH / 2, y: CARD_HEIGHT / 2 });
  const ripplesRef = useRef([]);
  const microSparksRef = useRef([]);

  // Three.js instances
  const threeSceneRef = useRef(null);
  const threeRendererRef = useRef(null);
  const shardMeshesRef = useRef([]);

  const displayName = blockName || block?.name || 'Completed Block';

  // Load and cache Pixabay 4K videos on mount
  useEffect(() => {
    let isMounted = true;
    pixabayService.getAllZenVideos().then(vids => {
      if (isMounted && Array.isArray(vids) && vids.length > 0) {
        setZenVideos(vids);
      }
    });
    return () => { isMounted = false; };
  }, []);

  // Initialize and Reset on Modal Activation
  useEffect(() => {
    if (!isActive) return;

    setPhase('break');
    setCrackCount(0);
    isClosingRef.current = false;
    voronoiCellsRef.current = [];
    ripplesRef.current = [];
    microSparksRef.current = [];
    shardMeshesRef.current = [];

    // Select random background video & calm message
    const vidList = zenVideos.length > 0 ? zenVideos : CURATED_PIXABAY_VIDEOS;
    setCurrentVideoIndex(Math.floor(Math.random() * vidList.length));
    const randomMsg = ZEN_MESSAGES[Math.floor(Math.random() * ZEN_MESSAGES.length)];
    setZenMessage(randomMsg);

    // Initial entrance animation for the Block
    if (blockCardWrapperRef.current) {
      gsap.fromTo(blockCardWrapperRef.current,
        { scale: 0.9, opacity: 0, y: 24 },
        { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.15)' }
      );
    }

    // Paint initial pristine intact card texture (Zero cracks)
    if (textureCanvasRef.current && interactiveCanvasRef.current) {
      renderCardTexture(textureCanvasRef.current, {
        displayName,
        totalTasks,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        dpr: 2
      });

      const displayCanvas = interactiveCanvasRef.current;
      displayCanvas.width = CARD_WIDTH * 2;
      displayCanvas.height = CARD_HEIGHT * 2;
      const ctx = displayCanvas.getContext('2d');
      ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
      ctx.drawImage(textureCanvasRef.current, 0, 0);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (stopMusicRef.current) {
        stopMusicRef.current();
        stopMusicRef.current = null;
      }
      cleanupThreeScene();
    };
  }, [isActive, displayName, totalTasks, zenVideos]);

  // Clean up Three.js WebGL scene completely
  const cleanupThreeScene = () => {
    if (threeSceneRef.current) {
      threeSceneRef.current.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
          else obj.material.dispose();
        }
      });
      threeSceneRef.current = null;
    }
    shardMeshesRef.current = [];
    if (threeRendererRef.current) {
      threeRendererRef.current.dispose();
      if (threeRendererRef.current.domElement && threeRendererRef.current.domElement.parentNode) {
        threeRendererRef.current.domElement.parentNode.removeChild(threeRendererRef.current.domElement);
      }
      threeRendererRef.current = null;
    }
  };

  // Rotate Pixabay background videos smoothly during Zen Mode
  useEffect(() => {
    if (!isActive || phase !== 'zen') return;

    const interval = setInterval(() => {
      setCurrentVideoIndex(prev => (prev + 1) % (zenVideos.length || 1));
    }, 15000);

    return () => clearInterval(interval);
  }, [isActive, phase, zenVideos]);

  // Draw the physical glass block with internal optical fissures, refraction, and shockwaves
  const renderInteractiveBlock = (currentCrack) => {
    const displayCanvas = interactiveCanvasRef.current;
    const texCanvas = textureCanvasRef.current;
    if (!displayCanvas || !texCanvas) return;

    const ctx = displayCanvas.getContext('2d');
    const dpr = 2;
    ctx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

    const cells = voronoiCellsRef.current;
    const halfW = CARD_WIDTH / 2;
    const halfH = CARD_HEIGHT / 2;

    if (currentCrack === 0 || cells.length === 0) {
      // Pristine Intact Card
      ctx.drawImage(texCanvas, 0, 0);
      return;
    }

    // For Hit 1 & Hit 2: Render cells with genuine physical displacement and cleavage
    cells.forEach(cell => {
      let offsetDist = 0;
      if (currentCrack === 1) {
        if (cell.tier === 1) offsetDist = 0.6;
      } else if (currentCrack === 2) {
        if (cell.tier === 1) offsetDist = 1.8;
        else if (cell.tier === 2) offsetDist = 0.9;
      }

      const ox = Math.cos(cell.angle) * offsetDist;
      const oy = Math.sin(cell.angle) * offsetDist;

      ctx.save();
      ctx.beginPath();
      cell.vertices.forEach((v, idx) => {
        const vx = (v.x + halfW + ox) * dpr;
        const vy = (v.y + halfH + oy) * dpr;
        if (idx === 0) ctx.moveTo(vx, vy);
        else ctx.lineTo(vx, vy);
      });
      ctx.closePath();
      ctx.clip();

      // Draw the card texture shifted by the cell's displacement
      ctx.drawImage(texCanvas, ox * dpr, oy * dpr);

      // Glass Edge Facet Cleavage on cracked boundaries
      if (
        (currentCrack === 1 && cell.tier === 1) ||
        (currentCrack === 2 && (cell.tier === 1 || cell.tier === 2))
      ) {
        // Internal dark optical shadow line (light trapped inside glass fracture)
        ctx.strokeStyle = currentCrack === 2 ? 'rgba(10, 14, 22, 0.85)' : 'rgba(12, 16, 26, 0.70)';
        ctx.lineWidth = currentCrack === 2 ? 2.4 : 1.6;
        ctx.stroke();

        // Faceted specular glint along cracked glass edge
        ctx.strokeStyle = currentCrack === 2 ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.40)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }

      ctx.restore();
    });

    // Render concentric optical shockwave ripples
    ripplesRef.current = ripplesRef.current.filter(r => r.alpha > 0.02);
    ripplesRef.current.forEach(r => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(r.x * dpr, r.y * dpr, r.radius * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${r.alpha * 0.7})`;
      ctx.lineWidth = 2.2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(r.x * dpr, r.y * dpr, Math.max(1, (r.radius - 2)) * dpr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(180, 225, 255, ${r.alpha * 0.4})`;
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.restore();

      r.radius += 2.8;
      r.alpha *= 0.88;
    });

    // Render micro glass dust sparkles near impact
    microSparksRef.current = microSparksRef.current.filter(sp => sp.alpha > 0.02);
    microSparksRef.current.forEach(sp => {
      ctx.save();
      ctx.beginPath();
      ctx.arc(sp.x * dpr, sp.y * dpr, sp.size * dpr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${sp.alpha})`;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.fill();
      ctx.restore();

      sp.x += sp.vx * 0.016;
      sp.y += sp.vy * 0.016;
      sp.vy += 220 * 0.016;
      sp.alpha -= 0.035;
    });

    if (ripplesRef.current.length > 0 || microSparksRef.current.length > 0) {
      animationFrameRef.current = requestAnimationFrame(() => renderInteractiveBlock(currentCrack));
    }
  };

  // Launch Three.js WebGL 3D Polygonal Shatter Simulation (Instant 60fps, 0 Floating Remnants)
  const launchThreeShatter = (impactX, impactY) => {
    if (!threeMountRef.current || !textureCanvasRef.current) return;

    cleanupThreeScene();

    const container = threeMountRef.current;
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight;

    // Three.js Scene, Camera, Renderer
    const scene = new THREE.Scene();
    threeSceneRef.current = scene;

    const fov = 45;
    const fovRad = (fov * Math.PI) / 180;
    const cameraZ = (viewHeight / 2) / Math.tan(fovRad / 2);

    const camera = new THREE.PerspectiveCamera(fov, viewWidth / viewHeight, 1, 5000);
    camera.position.set(0, 0, cameraZ);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    threeRendererRef.current = renderer;
    renderer.setSize(viewWidth, viewHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.transition = 'opacity 0.4s ease-out';
    container.appendChild(renderer.domElement);

    // Card Texture
    const cardTexture = new THREE.CanvasTexture(textureCanvasRef.current);
    cardTexture.flipY = true;
    cardTexture.needsUpdate = true;

    // Build 3D polygonal shard meshes for all Voronoi cells
    const cells = voronoiCellsRef.current;
    const shardMeshes = [];

    const W = CARD_WIDTH;
    const H = CARD_HEIGHT;

    const relTapX = impactX - W / 2;
    const relTapY = -(impactY - H / 2);

    cells.forEach((cell) => {
      const shape = new THREE.Shape();
      const loopPoints = [];

      cell.vertices.forEach((v, idx) => {
        if (idx === 0) shape.moveTo(v.x, -v.y);
        else shape.lineTo(v.x, -v.y);
        loopPoints.push(new THREE.Vector3(v.x, -v.y, 1));
      });
      shape.closePath();

      const geom = new THREE.ShapeGeometry(shape);
      const pos = geom.attributes.position;
      const uv = geom.attributes.uv;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const u = (x + W / 2) / W;
        const v = (y + H / 2) / H;
        uv.setXY(i, u, v);
      }
      uv.needsUpdate = true;

      // Each shard gets independent material with controlled opacity
      const shardMaterial = new THREE.MeshBasicMaterial({
        map: cardTexture,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geom, shardMaterial);

      // Lightweight LineLoop outline: 100x faster than EdgesGeometry, smooth 60fps
      const lineGeom = new THREE.BufferGeometry().setFromPoints(loopPoints);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.85
      });
      const line = new THREE.LineLoop(lineGeom, lineMaterial);
      mesh.add(line);

      // Fast explosive outward burst from tap point
      const dirX = cell.cx - relTapX;
      const dirY = -cell.cy - relTapY;
      const dist = Math.hypot(dirX, dirY) || 1;
      const normX = dirX / dist;
      const normY = dirY / dist;

      const isInner = cell.tier === 1;
      const speed = (isInner ? 700 : 480) + Math.random() * 450;

      mesh.userData = {
        line,
        vx: normX * speed + (Math.random() - 0.5) * 140,
        vy: normY * speed + 90 + Math.random() * 120, // upward burst
        vz: 160 + Math.random() * 420, // forward towards camera
        wx: (Math.random() - 0.5) * 9.0,
        wy: (Math.random() - 0.5) * 9.0,
        wz: (Math.random() - 0.5) * 7.5,
        alpha: 1.0
      };

      scene.add(mesh);
      shardMeshes.push(mesh);
    });

    shardMeshesRef.current = shardMeshes;

    // 70+ Floating micro glass sparkle dust particles in 3D
    const sparkCount = 70;
    const sparkGeom = new THREE.BufferGeometry();
    const sparkPositions = new Float32Array(sparkCount * 3);
    const sparkVelocities = [];

    for (let i = 0; i < sparkCount; i++) {
      sparkPositions[i * 3] = relTapX;
      sparkPositions[i * 3 + 1] = relTapY;
      sparkPositions[i * 3 + 2] = 10;

      const angle = Math.random() * Math.PI * 2;
      const spd = 320 + Math.random() * 650;
      sparkVelocities.push({
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd + 50,
        vz: 120 + Math.random() * 380,
        alpha: 1.0
      });
    }

    sparkGeom.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
    const sparkMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 3.5,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending
    });
    const sparkPoints = new THREE.Points(sparkGeom, sparkMaterial);
    scene.add(sparkPoints);

    let lastTime = performance.now();
    let cameraPushProgress = 0;

    // Smooth 60fps Physical Simulation Loop
    const animateSimulation = (time) => {
      const dt = Math.min(0.024, (time - lastTime) / 1000);
      lastTime = time;

      let anyShardAlive = false;

      // 1. Update 3D Shards
      shardMeshes.forEach((mesh) => {
        const u = mesh.userData;
        if (u.alpha <= 0.01) {
          mesh.visible = false;
          return;
        }
        anyShardAlive = true;

        // Position & strong gravitational downward pull
        mesh.position.x += u.vx * dt;
        mesh.position.y += u.vy * dt;
        mesh.position.z += u.vz * dt;

        u.vy -= 1400 * dt; // Strong gravity pulls all shards off screen
        u.vx *= 0.99;
        u.vz *= 0.988;

        // 3D Tumbling
        mesh.rotation.x += u.wx * dt;
        mesh.rotation.y += u.wy * dt;
        mesh.rotation.z += u.wz * dt;

        // Synchronous fade out: BOTH mesh face AND outline line fade to 0
        u.alpha -= dt * 0.92;
        const currentAlpha = Math.max(0, u.alpha);
        if (mesh.material) mesh.material.opacity = currentAlpha;
        if (u.line && u.line.material) u.line.material.opacity = currentAlpha * 0.85;
      });

      // 2. Update Sparkle Dust
      const positions = sparkGeom.attributes.position.array;
      for (let i = 0; i < sparkCount; i++) {
        const sp = sparkVelocities[i];
        if (sp.alpha <= 0.01) continue;

        positions[i * 3] += sp.vx * dt;
        positions[i * 3 + 1] += sp.vy * dt;
        positions[i * 3 + 2] += sp.vz * dt;

        sp.vy -= 600 * dt;
        sp.vx *= 0.985;
        sp.vz *= 0.985;
        sp.alpha -= dt * 1.1;
      }
      sparkGeom.attributes.position.needsUpdate = true;
      sparkMaterial.opacity = Math.max(0, sparkMaterial.opacity - dt * 0.85);

      // 3. Cinematic Camera Push forward through the broken glass
      cameraPushProgress = Math.min(1.0, cameraPushProgress + dt * 1.25);
      const pushEase = gsap.parseEase('power2.out')(cameraPushProgress);
      camera.position.z = cameraZ - pushEase * 340;

      renderer.render(scene, camera);

      if (anyShardAlive) {
        animationFrameRef.current = requestAnimationFrame(animateSimulation);
      } else {
        // All shards gone -> dispose immediately so nothing remains floating
        cleanupThreeScene();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animateSimulation);
  };

  // Handle User Clicking / Tapping the Physical Glass Block
  const handleBlockClick = (e) => {
    e.stopPropagation();
    if (phase !== 'break') return;

    const rect = interactiveCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = Math.max(0, Math.min(CARD_WIDTH, e.clientX - rect.left));
    const clickY = Math.max(0, Math.min(CARD_HEIGHT, e.clientY - rect.top));
    impactCoordsRef.current = { x: clickX, y: clickY };

    const nextCrack = crackCount + 1;

    if (nextCrack === 1) {
      // HIT 1: Real impact reaction, internal stress fracture, optical ripple, short vibration
      sound.playGlassCrack(1);
      navigator.vibrate?.(25);
      setCrackCount(1);

      // Partition card into Voronoi cells centered on tap point
      voronoiCellsRef.current = generateVoronoiCells(CARD_WIDTH, CARD_HEIGHT, clickX, clickY);

      // Optical shockwave ripple
      ripplesRef.current.push({ x: clickX, y: clickY, radius: 6, alpha: 0.9 });

      // 15 microscopic glass crystal sparks
      for (let i = 0; i < 15; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 60 + Math.random() * 140;
        microSparksRef.current.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 30,
          size: 1.0 + Math.random() * 1.5,
          alpha: 1.0
        });
      }

      renderInteractiveBlock(1);

      // Micro-recoil spring deformation
      gsap.fromTo(blockCardWrapperRef.current,
        { scale: 0.96, rotate: (Math.random() - 0.5) * 1.2 },
        { scale: 1, rotate: 0, duration: 0.35, ease: 'elastic.out(1.2, 0.4)' }
      );
    } else if (nextCrack === 2) {
      // HIT 2: Branching fractures spread, glass visually separates along boundaries, stronger feedback
      sound.playGlassCrack(2);
      navigator.vibrate?.([30, 40]);
      setCrackCount(2);

      ripplesRef.current.push({ x: clickX, y: clickY, radius: 8, alpha: 0.95 });

      for (let i = 0; i < 25; i++) {
        const a = Math.random() * Math.PI * 2;
        const spd = 90 + Math.random() * 210;
        microSparksRef.current.push({
          x: clickX,
          y: clickY,
          vx: Math.cos(a) * spd,
          vy: Math.sin(a) * spd - 40,
          size: 1.2 + Math.random() * 1.8,
          alpha: 1.0
        });
      }

      renderInteractiveBlock(2);

      // Surface flex vibration
      gsap.timeline()
        .to(blockCardWrapperRef.current, { scale: 0.93, duration: 0.05 })
        .to(blockCardWrapperRef.current, { x: -5, rotate: -1.6, duration: 0.04 })
        .to(blockCardWrapperRef.current, { x: 5, rotate: 1.6, duration: 0.04 })
        .to(blockCardWrapperRef.current, { x: -2, duration: 0.04 })
        .to(blockCardWrapperRef.current, { scale: 1, x: 0, rotate: 0, duration: 0.35, ease: 'elastic.out(1.1, 0.35)' });
    } else if (nextCrack >= 3) {
      // FINAL HIT: Entire block physically shatters into Three.js 3D polygonal shards -> Cinematic transition
      sound.playGlassShatter();
      navigator.vibrate?.([40, 60, 85]);
      setPhase('shattering');

      // Hide the intact 2D card so only the 3D flying shards exist
      if (blockCardWrapperRef.current) {
        blockCardWrapperRef.current.style.opacity = '0';
        blockCardWrapperRef.current.style.pointerEvents = 'none';
      }

      // Launch buttery smooth Three.js WebGL physics shatter
      launchThreeShatter(clickX, clickY);

      // Cinematic boom push
      if (rootContainerRef.current) {
        gsap.to(rootContainerRef.current, {
          scale: 1.04,
          duration: 1.2,
          ease: 'power2.out'
        });
      }

      // Transition seamlessly to full peaceful Zen environment with ZERO remnants
      setTimeout(() => {
        setPhase('zen');
        const stopFn = sound.playSoothingCalmMusic();
        stopMusicRef.current = stopFn;

        // Smoothly fade out and clean up Three.js WebGL canvas so ZERO shards can ever remain
        if (threeRendererRef.current?.domElement) {
          gsap.to(threeRendererRef.current.domElement, {
            opacity: 0,
            duration: 0.45,
            ease: 'power1.out',
            onComplete: () => {
              cleanupThreeScene();
            }
          });
        }
      }, 750);
    }
  };

  // Exit back to application
  const handleExit = (e) => {
    if (e) e.stopPropagation();
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    if (stopMusicRef.current) {
      stopMusicRef.current();
      stopMusicRef.current = null;
    }
    cleanupThreeScene();
    onClose?.();
  };

  // Keyboard dismiss (Escape, Space, Enter)
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || ((e.key === ' ' || e.key === 'Enter') && phase === 'zen')) {
        e.preventDefault();
        handleExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, phase]);

  if (!isActive) return null;

  const activeVideos = zenVideos.length > 0 ? zenVideos : CURATED_PIXABAY_VIDEOS;
  const currentVideo = activeVideos[currentVideoIndex] || activeVideos[0];

  return (
    <div
      ref={rootContainerRef}
      className="fixed inset-0 z-50 flex items-center justify-center select-none overflow-hidden bg-black transition-transform duration-700 ease-out"
      onClick={phase === 'zen' ? handleExit : undefined}
    >
      {/* ========================================================
          BACKGROUND 4K CINEMATIC NATURE / SPACE VIDEO (PIXABAY API)
          Watermark-free, 4K/Full HD, looping seamlessly
          ======================================================== */}
      {currentVideo && (
        <video
          ref={videoRef}
          key={currentVideo.id || currentVideo.url}
          src={currentVideo.url}
          poster={currentVideo.poster}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-1000 ease-in-out ${
            phase === 'zen' || phase === 'shattering' ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}

      {/* Atmospheric Soft Dark Scrim Overlay for Readability */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${
          phase === 'zen' ? 'bg-gradient-to-b from-black/55 via-black/35 to-black/75 opacity-100' : 'bg-black opacity-100'
        }`}
      />

      {/* Soft Light Bloom Expanding from Shatter Epicenter */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 ${
          phase === 'shattering' ? 'opacity-70 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.45)_0%,transparent_65%)]' : 'opacity-0'
        }`}
      />

      {/* ========================================================
          THREE.JS WEBGL FULLSCREEN CONTAINER FOR 3D SHATTER
          Cleaned up immediately on transition to zen
          ======================================================== */}
      {phase !== 'zen' && (
        <div
          ref={threeMountRef}
          className="fixed inset-0 pointer-events-none z-30 overflow-hidden"
        />
      )}

      {/* Offscreen Canvas for High-DPI Card Texture Generation */}
      <canvas
        ref={textureCanvasRef}
        className="hidden"
      />

      {/* ========================================================
          PHASE 1: THE INTACT PHYSICAL GLASS BLOCK
          ======================================================== */}
      {phase !== 'zen' && (
        <div className="relative z-20 flex flex-col items-center justify-center px-4 w-full max-w-lg">
          {/* Header Typography */}
          <div className="flex flex-col items-center text-center mb-7 pointer-events-none animate-modal-in">
            <span className="text-[11px] sm:text-xs font-mono uppercase tracking-[0.28em] text-emerald-400 font-semibold mb-2 drop-shadow-sm">
              YOU COMPLETED THIS BLOCK
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-white tracking-wide drop-shadow-lg">
              Break It
            </h2>
          </div>

          {/* The Single Premium Rounded Glass Block Container */}
          <div className="relative flex items-center justify-center">
            <div
              ref={blockCardWrapperRef}
              onClick={handleBlockClick}
              className="relative group cursor-pointer select-none transition-transform duration-150 active:scale-[0.98] rounded-[26px] overflow-hidden"
              style={{
                width: `${CARD_WIDTH}px`,
                height: `${CARD_HEIGHT}px`,
                boxShadow: `
                  0 30px 60px -12px rgba(0, 0, 0, 0.85),
                  0 12px 24px -6px rgba(0, 0, 0, 0.65),
                  inset 0 1px 1.5px rgba(255, 255, 255, 0.4),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.6)
                `
              }}
            >
              {/* Interactive High-DPI Glass Card Canvas */}
              <canvas
                ref={interactiveCanvasRef}
                style={{
                  width: `${CARD_WIDTH}px`,
                  height: `${CARD_HEIGHT}px`,
                  display: 'block'
                }}
                className="rounded-[26px] pointer-events-auto"
              />
            </div>
          </div>

          {/* Minimal Instruction Below */}
          {phase === 'break' && (
            <p className="mt-7 text-xs font-mono uppercase tracking-[0.22em] text-white/50 animate-pulse">
              {crackCount === 0 && '[ TAP TO BREAK ]'}
              {crackCount === 1 && '[ TAP AGAIN ]'}
              {crackCount === 2 && '[ ONE MORE HIT TO BREAK ]'}
            </p>
          )}
        </div>
      )}

      {/* ========================================================
          PHASE 2: FULL-SCREEN CINEMATIC ZEN EXPERIENCE
          Extremely minimal: Environment is the hero. No cards. No clutter. No floating shards.
          ======================================================== */}
      {phase === 'zen' && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-6 max-w-2xl pointer-events-auto animate-fade-in">
          {/* Calming Quote (Randomly Selected from the 4 requested) */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extralight tracking-wide text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] leading-relaxed sm:leading-snug mb-6">
            "{zenMessage}"
          </h2>

          {/* Understated Block Name Mention */}
          <div className="flex items-center gap-2 mb-10 text-white/70 font-light">
            <span className="text-sm sm:text-base font-medium text-white/90 tracking-wide">
              {displayName}
            </span>
            <span className="text-white/30">•</span>
            <span className="text-xs sm:text-sm font-mono tracking-widest text-emerald-400 font-medium">
              COMPLETED
            </span>
          </div>

          {/* Minimalist Continue Button */}
          <button
            onClick={handleExit}
            className="group inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/35 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            <span className="text-sm sm:text-base font-light tracking-wider text-white">
              Continue →
            </span>
          </button>

          {/* Subtle Dismiss Helper */}
          <p className="mt-5 text-[11px] font-mono tracking-widest uppercase text-white/30">
            Press Esc or tap anywhere to return
          </p>
        </div>
      )}
    </div>
  );
}
