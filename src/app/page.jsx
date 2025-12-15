'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { IoVolumeHigh, IoVolumeMute } from 'react-icons/io5';
import * as THREE from 'three';

const taupePalette = [
  { r: 233, g: 221, b: 199 },
  { r: 211, g: 192, b: 166 },
  { r: 183, g: 156, b: 124 },
  { r: 139, g: 112, b: 86 },
];

const morphDurationBase = 4500; // ms per transition
const minNodes = 2;
const maxNodes = 5;
const windDir = (() => {
  const x = 0.65;
  const y = 0.25;
  const z = 0.08;
  const len = Math.max(1e-6, Math.hypot(x, y, z));
  return { x: x / len, y: y / len, z: z / len };
})();

const alignBottoms = (targets) => {
  if (!targets.length) return targets;
  const mins = targets.map((t) => {
    let minY = Infinity;
    for (let i = 1; i < t.length; i += 3) {
      if (t[i] < minY) minY = t[i];
    }
    return minY;
  });
  const baseline = Math.min(...mins);
  return targets.map((t, idx) => {
    const delta = mins[idx] - baseline;
    if (Math.abs(delta) < 1e-6) return t;
    const shifted = new Float32Array(t.length);
    for (let i = 0; i < t.length; i += 3) {
      shifted[i] = t[i];
      shifted[i + 1] = t[i + 1] - delta;
      shifted[i + 2] = t[i + 2];
    }
    return shifted;
  });
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const randomInt = (minInclusive, maxExclusive) =>
  minInclusive + Math.floor(Math.random() * (maxExclusive - minInclusive));

const doubleVertices = (targets) =>
  targets.map((src) => {
    const vertCount = src.length / 3;
    const extraVerts = Math.floor(vertCount / 3); // add ~1/3 more points
    const newVertCount = vertCount + extraVerts; // ~4/3 of original
    const dst = new Float32Array(newVertCount * 3);
    dst.set(src, 0);
    // duplicate a subset of vertices; scatter/jitter will separate them later
    for (let i = 0; i < extraVerts; i++) {
      const srcIdx = i * 3;
      const dstIdx = (vertCount + i) * 3;
      dst[dstIdx] = src[srcIdx];
      dst[dstIdx + 1] = src[srcIdx + 1];
      dst[dstIdx + 2] = src[srcIdx + 2];
    }
    return dst;
  });

const boostSaturationAndBrightness = (r, g, b) => {
  const rn = r;
  const gn = g;
  const bn = b;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  let l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }

  // boost saturation and brightness more for dark background
  s = Math.min(1, s * 1.9 + 0.05);
  l = Math.min(1, l * 1.1 + 0.02);

  if (s === 0) {
    return { r: l, g: l, b: l };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const rr = hue2rgb(p, q, h + 1 / 3);
  const gg = hue2rgb(p, q, h);
  const bb = hue2rgb(p, q, h - 1 / 3);

  return { r: rr, g: gg, b: bb };
};

const randomTag = () => {
  const digitsCount = Math.random() < 0.5 ? 2 : 3;
  let tag = '';
  for (let i = 0; i < digitsCount; i++) {
    tag += Math.floor(Math.random() * 10).toString();
  }
  const lastChar =
    Math.random() < 0.5
      ? String.fromCharCode(65 + Math.floor(Math.random() * 26))
      : Math.floor(Math.random() * 10).toString();
  if (tag.length === 3) {
    tag = tag.slice(0, 2) + lastChar;
  } else {
    tag += lastChar;
  }
  return tag.slice(0, 3);
};

export default function Page() {
  const containerRef = useRef(null);
  const wrapperRef = useRef(null);
  const diagramRef = useRef(null);
  const basePositionsRef = useRef(null);
  const paletteRef = useRef(taupePalette);
  const morphNamesRef = useRef([]);
  const audioStartedRef = useRef(false);
  const startAudioRef = useRef(null);

  const [isMuted, setIsMuted] = useState(true);
  const gainRef = useRef(null);
  const [barcodeData, setBarcodeData] = useState('00');
  const [signalLabel, setSignalLabel] = useState('Signal 00');
  const [barcodeTransform, setBarcodeTransform] = useState('translate3d(18px, -10px, 0)');
  const [isBarcodeGlitch, setIsBarcodeGlitch] = useState(false);
  const barcode = useMemo(() => {
    // deterministic fixed-length barcode from the payload string
    const targetWidth = 210;
    const barHeight = 78;
    const barCount = 26;
    const baseSpacing = 3.4; // more negative space

    const text = (barcodeData || '').toUpperCase();
    // simple hash seed
    let seed = 0;
    for (let i = 0; i < text.length; i++) {
      seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
    }
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 0xffffffff;
    };

    const widths = [];
    for (let i = 0; i < barCount; i++) {
      const raw = 3 + Math.floor(Math.pow(rand(), 0.6) * 12); // bias toward thicker strokes
      widths.push(raw);
    }

    // variable spacing to create bigger voids between clusters
    const spacings = widths.map(() => baseSpacing * (1 + rand() * 2.4));
    const baseTotal =
      widths.reduce((sum, w) => sum + w, 0) +
      spacings.reduce((sum, s) => sum + s, 0);
    const scale = targetWidth / baseTotal;

    let x = 0;
    const bars = widths.map((w, i) => {
      const width = w * scale;
      const bar = { x, width, height: barHeight };
      x += width + spacings[i] * scale;
      // occasional additional void for larger gaps
      if (i % 5 === 4) {
        x += baseSpacing * scale * 3;
      }
      return bar;
    });

    return { bars, width: targetWidth };
  }, [barcodeData]);

  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return;

    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    const diagram = diagramRef.current;
    const barcodeConfig = {
      tree: {
        payload: '02',
        signal: 'Signal 02',
        transform: 'translate3d(18px, -10px, 0)',
      },
      goddess: {
        payload: '03',
        signal: 'Signal 03',
        transform: 'translate3d(18px, -10px, 0)',
      },
      face: {
        payload: '01',
        signal: 'Signal 01',
        transform: 'translate3d(18px, -10px, 0)',
      },
      face2: {
        payload: '01',
        signal: 'Signal 01',
        transform: 'translate3d(18px, -10px, 0)',
      },
      default: {
        payload: '00',
        signal: 'Signal 00',
        transform: 'translate3d(18px, -10px, 0)',
      },
    };

    const firstLoad = { current: true };

    const setBarcodeForModel = (name) => {
      const entry = barcodeConfig[name] || barcodeConfig.default;
      setBarcodeData(entry.payload.toUpperCase());
      setSignalLabel(entry.signal);
      setBarcodeTransform(entry.transform);
      if (firstLoad.current) {
        firstLoad.current = false;
        return;
      }
      setIsBarcodeGlitch(true);
      setTimeout(() => setIsBarcodeGlitch(false), 320);
    };

    setBarcodeForModel('default');

    wrapper.style.setProperty('--diagram-phase', '0');
    // start with mouse "outside" the canvas so steering waits for first move
    wrapper.style.setProperty('--mouse-x', '-0.2');
    wrapper.style.setProperty('--mouse-y', '-0.2');
    wrapper.style.setProperty('--glitch-amount', '0');

    const updateFilmGrain = () => {
      try {
        const createLayer = (size, contrast) => {
          const canvas = document.createElement('canvas');
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) return '';

          const imageData = ctx.createImageData(size, size);
          const data = imageData.data;
          for (let i = 0; i < data.length; i += 4) {
            // approximate a soft Gaussian brightness distribution
            const gaussian =
              (Math.random() +
                Math.random() +
                Math.random() +
                Math.random()) /
                4 -
              0.5;
            const base = 150;
            let v = base + gaussian * 90 * contrast;

            // sparse bright and dark specks for a more film-like texture
            const sparkle = Math.random();
            if (sparkle < 0.012) {
              v += 55; // highlight speck
            } else if (sparkle > 0.988) {
              v -= 65; // dark speck
            }

            v = Math.max(85, Math.min(225, v));
            data[i] = v;
            data[i + 1] = v;
            data[i + 2] = v;
            data[i + 3] = 255;
          }
          ctx.putImageData(imageData, 0, 0);
          return `url(${canvas.toDataURL('image/png')})`;
        };

        const fine = createLayer(96, 0.7);
        const coarse = createLayer(192, 1.0);
        const rootStyle = document.documentElement.style;
        if (fine) {
          rootStyle.setProperty('--grain-texture-fine', fine);
        }
        if (coarse) {
          rootStyle.setProperty('--grain-texture-coarse', coarse);
        }
      } catch {
        // fall through on failure
      }
    };

    updateFilmGrain();

    let scene;
    let camera;
    let renderer;
    let mesh;
    let morphTargets = [];
    let currentTargetIndex = 0;
    let morphTime = 0;
    let lastTimestamp = null;
    let animationId = null;
    let currentRotX = 0;
    let currentRotY = 0;
    let audioStarted = audioStartedRef.current;
    let totalTime = 0;
    let jitterSeeds = null;
    let scatterVelocities = null;

    // --- subtle glitch control (softer) ---
    let glitchAmount = 0; // 0..1
    let glitchTimeRemaining = 0;
    let glitchDuration = 0;
    let nextGlitchIn = 6000 + Math.random() * 7000; // ms until next glitch window

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerWorldPos = null;

    const audioCtxRef = { current: null };
    const analyserRef = { current: null };
    const audioDataRef = { current: null };
    const audioLevelRef = { current: 0 };
    const audioSourceRef = { current: null };

    const nodeEntries = [];
    const lineEntries = [];

    const tempLocal = new THREE.Vector3();
    const tempWorld = new THREE.Vector3();
    const tempProjected = new THREE.Vector3();

    const resize = () => {
      if (!renderer || !camera) return;
      const wrapperWidth = wrapper.clientWidth || 1;
      const wrapperHeight = wrapper.clientHeight || 1;
      const fullWidth = window.innerWidth || wrapperWidth;

      const aspect = fullWidth / wrapperHeight;
      const frustumSize = 6;
      camera.left = (-frustumSize * aspect) / 2;
      camera.right = (frustumSize * aspect) / 2;
      camera.top = frustumSize / 2;
      camera.bottom = -frustumSize / 2;
      camera.updateProjectionMatrix();
      renderer.setSize(fullWidth, wrapperHeight);

      // make the canvas span full viewport width but keep it centered
      const canvas = renderer.domElement;
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '50%';
      canvas.style.transform = 'translateX(-50%)';
    };

    const clearOverlayNodes = () => {
      nodeEntries.splice(0, nodeEntries.length).forEach((entry) => {
        entry.square.remove();
        entry.label.remove();
      });
      lineEntries.splice(0, lineEntries.length).forEach((line) => line.remove());
    };

    const startAudio = async (initialMuted) => {
      if (audioStarted) return;
      audioStarted = true;
      audioStartedRef.current = true;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          console.error('Web Audio API not supported in this browser');
          return;
        }
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }
        const res = await fetch('/bg.mp3');
        const buf = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(buf);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.loop = true;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 2048;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const gain = ctx.createGain();
        const muted = typeof initialMuted === 'boolean' ? initialMuted : isMuted;
        gain.gain.value = muted ? 0 : 1;

        source.connect(analyser);
        analyser.connect(gain);
        gain.connect(ctx.destination);
        source.start();

        analyserRef.current = analyser;
        audioDataRef.current = data;
        audioSourceRef.current = source;
        gainRef.current = gain;
      } catch (err) {
        console.error('Audio start failed:', err);
      }
    };

    // Expose startAudio so other handlers (like the mute button) can trigger it
    startAudioRef.current = startAudio;

    const buildOverlayNodes = () => {
      if (!diagram || !mesh) return;
      clearOverlayNodes();

      const positionAttr = mesh.geometry.getAttribute('position');
      const vertexCount = positionAttr ? positionAttr.count : 0;
      if (!vertexCount) return;

      const count = randomInt(minNodes, maxNodes + 1);
      const used = new Set();

      for (let i = 0; i < count; i++) {
        const idx = (() => {
          let candidate = 0;
          let tries = 0;
          do {
            candidate = randomInt(0, vertexCount);
            tries++;
          } while (used.has(candidate) && tries < 20);
          if (used.has(candidate)) {
            for (let j = 0; j < vertexCount; j++) {
              if (!used.has(j)) {
                candidate = j;
                break;
              }
            }
          }
          return candidate;
        })();
        used.add(idx);

        const square = document.createElement('div');
        const filled = Math.random() < 0.5;
        square.className = filled ? 'mesh-node mesh-node--filled' : 'mesh-node mesh-node--outline';
        const size = 10 + Math.random() * 16;
        square.style.width = `${size}px`;
        square.style.height = `${size}px`;

        const label = document.createElement('div');
        label.className = 'mesh-label';
        label.textContent = randomTag();

        diagram.appendChild(square);
        diagram.appendChild(label);
        nodeEntries.push({ index: idx, square, label });
      }

      for (let i = 0; i < nodeEntries.length - 1; i++) {
        const line = document.createElement('div');
        line.className = 'mesh-line';
        diagram.appendChild(line);
        lineEntries.push(line);
      }
    };

    const applyJitter = (
      array,
      basePositions,
      seeds,
      level
    ) => {
      if (!seeds || !basePositions) return;
      const vertCount = array.length / 3;
      if (seeds.length !== vertCount || basePositions.length !== array.length) return;
      const amp = 0.006 * (0.35 + Math.min(1, level) * 0.75); // scale with audio energy
      const freq = 0.005; // wobble speed
      const waveAmp = 0.004 + 0.012 * Math.min(1, level);
      const wavePhase = totalTime * 0.003;
      // push the cloud sideways with a stronger, audio-reactive wind
      const windBase = 0.01;
      const windAudio = 0.06 * Math.min(1, level);
      const windGust = 0.4 + 0.6 * Math.sin(totalTime * 0.0011);
      const windMag = windBase + windAudio * windGust;

      for (let i = 0; i < vertCount; i++) {
        const idx3 = i * 3;
        const baseX = basePositions[idx3];
        const baseY = basePositions[idx3 + 1];
        const baseZ = basePositions[idx3 + 2];

        const seed = seeds[i];
        const t = totalTime * freq + seed;

        const wobbleX = Math.sin(t) * amp;
        const wobbleY = Math.cos(t * 1.1 + 0.5) * amp;
        const wobbleZ = Math.sin(t * 0.9 + 1.3) * amp;

        const wave =
          Math.sin(wavePhase + baseX * 1.2 + baseY * 0.8) +
          Math.cos(wavePhase * 1.1 + baseY * 1.4 + baseZ * 0.6);
        const waveOffset = waveAmp * 0.5 * wave;

        const windX = windMag * windDir.x;
        const windY = windMag * windDir.y;
        const windZ = windMag * windDir.z;

        // evaporative outward push and return
        const radialLen = Math.max(1e-4, Math.hypot(baseX, baseY, baseZ));
        const rx = (baseX / radialLen) * 0.02 * (0.3 + level * 0.9);
        const ry = (baseY / radialLen) * 0.02 * (0.3 + level * 0.9);
        const rz = (baseZ / radialLen) * 0.02 * (0.3 + level * 0.9);
        const pulse = 0.5 + 0.5 * Math.sin(totalTime * 0.0008 + seed);

        array[idx3] = baseX + wobbleX + waveOffset * 0.8 + windX + rx * pulse;
        array[idx3 + 1] = baseY + wobbleY + waveOffset + windY + ry * pulse;
        array[idx3 + 2] = baseZ + wobbleZ + waveOffset * 0.6 + windZ + rz * pulse;
      }
    };

    const applyScatter = (array) => {
      if (!scatterVelocities) return;
      if (scatterVelocities.length !== array.length) return;
      const vertCount = array.length / 3;
      const damping = 0.8;
      for (let i = 0; i < vertCount; i++) {
        const idx3 = i * 3;
        array[idx3] += scatterVelocities[idx3];
        array[idx3 + 1] += scatterVelocities[idx3 + 1];
        array[idx3 + 2] += scatterVelocities[idx3 + 2];
        scatterVelocities[idx3] *= damping;
        scatterVelocities[idx3 + 1] *= damping;
        scatterVelocities[idx3 + 2] *= damping;
      }
    };

    // softer banded glitch displacement, uses base positions so it feels structural
    const applyGlitchStripes = (array, amount) => {
      if (amount <= 0 || !basePositionsRef.current) return;
      const base = basePositionsRef.current;
      const vertCount = array.length / 3;

      const bandScale = 0.015 + 0.05 * amount; // much smaller than before
      const bandHeight = 0.28; // fewer bands across the height

      for (let i = 0; i < vertCount; i++) {
        const idx3 = i * 3;

        const baseX = base[idx3];
        const baseY = base[idx3 + 1];
        const baseZ = base[idx3 + 2];

        const bandIndex = Math.floor((baseY + 2.0) / bandHeight);
        const dir = bandIndex % 2 === 0 ? 1 : -1;

        const phase = Math.sin(baseX * 9.3 + baseZ * 6.1 + totalTime * 0.018);
        const strength = bandScale * (0.4 + 0.6 * Math.abs(phase)) * 0.6;

        const offset = dir * strength;

        array[idx3] += offset;
        array[idx3 + 2] += offset * 0.08;
      }
    };

    const updateOverlayPositions = () => {
      if (!mesh || !diagram || nodeEntries.length === 0) return;

      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight || 1;
      const positionAttr = mesh.geometry.getAttribute('position');
      const positions = positionAttr.array;
      const vertexCount = positionAttr.count;

      const screenPositions = [];
      mesh.updateMatrixWorld();

      nodeEntries.forEach((entry, i) => {
        const idx = entry.index;
        if (idx < 0 || idx >= vertexCount) return;

        const vx = positions[idx * 3];
        const vy = positions[idx * 3 + 1];
        const vz = positions[idx * 3 + 2];

        tempLocal.set(vx, vy, vz);
        tempWorld.copy(tempLocal).applyMatrix4(mesh.matrixWorld);
        tempProjected.copy(tempWorld).project(camera);

        const tx = (tempProjected.x * 0.5 + 0.5) * width;
        const ty = (1 - (tempProjected.y * 0.5 + 0.5)) * height;
        screenPositions[i] = { x: tx, y: ty };

        entry.square.style.left = `${tx}px`;
        entry.square.style.top = `${ty}px`;
        entry.square.style.transform = 'translate(-50%, -50%)';

        entry.label.style.left = `${tx}px`;
        entry.label.style.top = `${ty - 14}px`;
        entry.label.style.transform = 'translate(-50%, -100%)';
      });

      lineEntries.forEach((line, i) => {
        if (i + 1 >= screenPositions.length) return;
        const start = screenPositions[i];
        const end = screenPositions[i + 1];
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const len = Math.hypot(dx, dy);
        const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

        line.style.left = `${start.x}px`;
        line.style.top = `${start.y}px`;
        line.style.width = `${len}px`;
        line.style.transform = `translate(0, -50%) rotate(${angle}deg)`;
      });
    };

    const updateSingleTarget = () => {
      if (!mesh || morphTargets.length === 0) return;
      const positions = morphTargets[0];
      const currentPositionAttribute = mesh.geometry.getAttribute('position');
      const array = currentPositionAttribute.array;
      array.set(positions);
      basePositionsRef.current = array.slice();
      applyJitter(array, basePositionsRef.current, jitterSeeds, audioLevelRef.current);
      applyScatter(array);
      applyGlitchStripes(array, glitchAmount);
      currentPositionAttribute.needsUpdate = true;
    };

    const updateMorphing = (deltaMs, effectiveDuration, audioLevel) => {
      const numTargets = morphTargets.length;
      if (numTargets < 2 || !mesh) return;

      morphTime += deltaMs;
      let phase = morphTime / effectiveDuration;
      const isComplete = phase >= 1;
      if (phase > 1) phase = 1;

      const factor = 0.5 - 0.5 * Math.cos(Math.PI * phase);
      wrapper.style.setProperty('--diagram-phase', factor.toString());

      const sourceIndex = currentTargetIndex % numTargets;
      const targetIndex = (currentTargetIndex + 1) % numTargets;
      const sourcePositions = morphTargets[sourceIndex];
      const targetPositions = morphTargets[targetIndex];
      const currentPositionAttribute = mesh.geometry.getAttribute('position');
      const array = currentPositionAttribute.array;

      for (let i = 0; i < array.length; i += 3) {
        const sx = sourcePositions[i];
        const sy = sourcePositions[i + 1];
        const sz = sourcePositions[i + 2];
        const tx = targetPositions[i];
        const ty = targetPositions[i + 1];
        const tz = targetPositions[i + 2];

        array[i] = sx + (tx - sx) * factor;
        array[i + 1] = sy + (ty - sy) * factor;
        array[i + 2] = sz + (tz - sz) * factor;
      }

      basePositionsRef.current = array.slice();
      applyJitter(array, basePositionsRef.current, jitterSeeds, audioLevel);
      applyScatter(array);
      applyGlitchStripes(array, glitchAmount);
      currentPositionAttribute.needsUpdate = true;

      if (isComplete) {
        buildOverlayNodes();
        const activeName = morphNamesRef.current[targetIndex] || 'default';
        setBarcodeForModel(activeName);
        currentTargetIndex = targetIndex;
        morphTime = 0;
        return; // start the next morph on the following frame so the barcode waits for completion
      }
    };

    const animate = (timestamp) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const cappedDelta = Math.min(delta, 100);
      const deltaSeconds = cappedDelta / 1000;

      if (mesh) {
        totalTime += cappedDelta;
        if (analyserRef.current && audioDataRef.current) {
          analyserRef.current.getByteFrequencyData(audioDataRef.current);
          const data = audioDataRef.current;
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = sum / data.length;
          const level = avg / 255; // 0..1
          audioLevelRef.current = audioLevelRef.current * 0.85 + level * 0.15;
        }
        const level = audioLevelRef.current || 0;

        // --- glitch timing: short, rare-ish bursts, but visible ---
        if (glitchTimeRemaining > 0) {
          glitchTimeRemaining -= cappedDelta;
          const phase = Math.max(0, 1 - glitchTimeRemaining / (glitchDuration || 1));
          glitchAmount = Math.sin(phase * Math.PI);
          if (glitchTimeRemaining <= 0) {
            glitchAmount = 0;
            nextGlitchIn = 7000 + Math.random() * 9000;
          }
        } else {
          nextGlitchIn -= cappedDelta;
          if (nextGlitchIn <= 0) {
            glitchDuration = 120 + Math.random() * 220; // very short
            glitchTimeRemaining = glitchDuration;
          }
        }

        wrapper.style.setProperty('--glitch-amount', glitchAmount.toFixed(3));
        if (glitchAmount > 0.05) {
          wrapper.classList.add('is-glitching');
        } else {
          wrapper.classList.remove('is-glitching');
        }

        const effectiveDuration = morphDurationBase; // fixed morph pacing (no audio-reactive speed)

        // continuous pointer avoidance field as a cylinder around the mouse ray
        // only becomes active after the pointer has moved at least once
        if (scatterVelocities && pointerWorldPos) {
          const positionAttr = mesh.geometry.getAttribute(
            'position'
          );
          const vertexCount = positionAttr.count;
          const radius = 0.9 + level * 2.4;
          const radiusSq = radius * radius;
          const baseStrength = (1.8 + level * 2.2) * deltaSeconds;

          mesh.updateMatrixWorld();

          const rayOrigin = raycaster.ray.origin.clone();
          const rayDir = raycaster.ray.direction.clone().normalize();

          for (let i = 0; i < vertexCount; i++) {
            const idx3 = i * 3;
            tempLocal.set(
              positionAttr.array[idx3],
              positionAttr.array[idx3 + 1],
              positionAttr.array[idx3 + 2]
            );
            tempWorld.copy(tempLocal).applyMatrix4(mesh.matrixWorld);

            // distance from vertex to mouse ray (cylindrical region)
            const vx = tempWorld.x - rayOrigin.x;
            const vy = tempWorld.y - rayOrigin.y;
            const vz = tempWorld.z - rayOrigin.z;

            const proj = vx * rayDir.x + vy * rayDir.y + vz * rayDir.z;
            const cx = rayOrigin.x + rayDir.x * proj;
            const cy = rayOrigin.y + rayDir.y * proj;
            const cz = rayOrigin.z + rayDir.z * proj;

            const dx = tempWorld.x - cx;
            const dy = tempWorld.y - cy;
            const dz = tempWorld.z - cz;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq > radiusSq || distSq === 0) continue;

            const dist = Math.sqrt(distSq);
            const r = dist / radius;
            const falloff = 1 - r * r;
            const strength = baseStrength * Math.max(0, falloff);

            const invDist = 1 / dist;
            const rx = dx * invDist;
            const ry = dy * invDist;
            const rz = dz * invDist;

            scatterVelocities[idx3] += rx * strength;
            scatterVelocities[idx3 + 1] += ry * strength;
            scatterVelocities[idx3 + 2] += rz * strength;
          }
        }

        if (morphTargets.length > 1) {
          updateMorphing(cappedDelta, effectiveDuration, level);
        } else if (morphTargets.length === 1) {
          updateSingleTarget();
        }

        // Re-color particles each frame based on current positions and palette
        const activePalette = paletteRef.current;
        if (activePalette.length) {
          const positionAttr = mesh.geometry.getAttribute(
            'position'
          )
          const vertexCount = positionAttr.count;

          let colorAttr = mesh.geometry.getAttribute(
            'color'
          );

          if (!colorAttr || colorAttr.count !== vertexCount) {
            const colors = new Float32Array(vertexCount * 3);
            mesh.geometry.setAttribute(
              'color',
              new THREE.BufferAttribute(colors, 3)
            );
            colorAttr = mesh.geometry.getAttribute(
              'color'
            );
          }

          const colorsArray = colorAttr.array;

          let minX = Infinity;
          let maxX = -Infinity;
          let minZ = Infinity;
          let maxZ = -Infinity;

          for (let i = 0; i < vertexCount; i++) {
            const idx3 = i * 3;
            const x = positionAttr.array[idx3];
            const z = positionAttr.array[idx3 + 2];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (z < minZ) minZ = z;
            if (z > maxZ) maxZ = z;
          }

          const spanX = maxX - minX || 1;
          const spanZ = maxZ - minZ || 1;

          for (let i = 0; i < vertexCount; i++) {
            const idx3 = i * 3;
            const x = positionAttr.array[idx3];
            const z = positionAttr.array[idx3 + 2];

            const nx = (x - minX) / spanX;
            const nz = (z - minZ) / spanZ;

            const t = Math.min(1, Math.max(0, nx * 0.7 + nz * 0.3));

            const scaled = t * (activePalette.length - 1);
            const i0 = Math.floor(scaled);
            const i1 = Math.min(activePalette.length - 1, i0 + 1);
            const localT = scaled - i0;

            const c0 = activePalette[i0];
            const c1 = activePalette[i1];

            const rBase = (c0.r + (c1.r - c0.r) * localT) / 255;
            const gBase = (c0.g + (c1.g - c0.g) * localT) / 255;
            const bBase = (c0.b + (c1.b - c0.b) * localT) / 255;

            const boosted = boostSaturationAndBrightness(rBase, gBase, bBase);
            colorsArray[idx3] = boosted.r;
            colorsArray[idx3 + 1] = boosted.g;
            colorsArray[idx3 + 2] = boosted.b;
          }

          colorAttr.needsUpdate = true;
          const pointsMat = mesh.material;
          if (!pointsMat.vertexColors) {
            pointsMat.vertexColors = true;
            pointsMat.needsUpdate = true;
          }
        }

        const baseRotX = Math.sin(totalTime * 0.0004) * 0.35;
        const baseRotY = Math.cos(totalTime * 0.0005) * 0.45;
        const audioTwist = level * 0.4;
        currentRotX = baseRotX + audioTwist * 0.25 * Math.sin(totalTime * 0.0012);
        currentRotY = baseRotY + audioTwist * 0.35 * Math.cos(totalTime * 0.0015);
        mesh.rotation.x = currentRotX;
        mesh.rotation.y = currentRotY;
        mesh.rotation.z =
          Math.sin(totalTime * 0.0012) * 0.04 * (0.2 + level * 0.8);

        updateOverlayPositions();
      }

      if (renderer) {
        renderer.render(scene, camera);
      }
      animationId = requestAnimationFrame(animate);
    };

    const initScene = () => {
      scene = new THREE.Scene();

      const wrapperWidth = wrapper.clientWidth || 1;
      const wrapperHeight = wrapper.clientHeight || 1;
      const fullWidth = window.innerWidth || wrapperWidth;
      const aspect = fullWidth / wrapperHeight;
      const frustumSize = 6;

      camera = new THREE.OrthographicCamera(
        (-frustumSize * aspect) / 2,
        (frustumSize * aspect) / 2,
        frustumSize / 2,
        -frustumSize / 2,
        0.1,
        1000
      );
      camera.position.z = 4;
      camera.lookAt(0, 0, 0);

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);
      resize();

      scene.add(new THREE.AmbientLight(0xaaaaaa, 1.5));
      scene.add(new THREE.PointLight(0xffffff, 1.0, 100));

      window.addEventListener('resize', resize);
    };

    const initMesh = () => {
      const initialPositions = morphTargets[0];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(initialPositions, 3)
      );

      const activePalette = paletteRef.current;
      if (activePalette.length) {
        const vertexCount = initialPositions.length / 3;
        const colors = new Float32Array(vertexCount * 3);

        let minX = Infinity;
        let maxX = -Infinity;
        let minZ = Infinity;
        let maxZ = -Infinity;

        for (let i = 0; i < initialPositions.length; i += 3) {
          const x = initialPositions[i];
          const z = initialPositions[i + 2];
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (z < minZ) minZ = z;
          if (z > maxZ) maxZ = z;
        }

        const spanX = maxX - minX || 1;
        const spanZ = maxZ - minZ || 1;

        for (let i = 0; i < vertexCount; i++) {
          const idx3 = i * 3;
          const x = initialPositions[idx3];
          const z = initialPositions[idx3 + 2];

          const nx = (x - minX) / spanX;
          const nz = (z - minZ) / spanZ;

          const t = Math.min(1, Math.max(0, nx * 0.7 + nz * 0.3));

          const scaled = t * (activePalette.length - 1);
          const i0 = Math.floor(scaled);
          const i1 = Math.min(activePalette.length - 1, i0 + 1);
          const localT = scaled - i0;

          const c0 = activePalette[i0];
          const c1 = activePalette[i1];

          const rBase = (c0.r + (c1.r - c0.r) * localT) / 255;
          const gBase = (c0.g + (c1.g - c0.g) * localT) / 255;
          const bBase = (c0.b + (c1.b - c0.b) * localT) / 255;

          const boosted = boostSaturationAndBrightness(rBase, gBase, bBase);
          colors[idx3] = boosted.r;
          colors[idx3 + 1] = boosted.g;
          colors[idx3 + 2] = boosted.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      }

      const material = new THREE.PointsMaterial({
        vertexColors: paletteRef.current.length ? true : false,
        color: paletteRef.current.length ? undefined : 0xe9ddc7,
        size: 0.018,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
      });
      mesh = new THREE.Points(geometry, material);
      mesh.scale.set(1.2, 1.2, 1.2);
      scene.add(mesh);
    };

    const loadModels = async () => {
      try {
        const resp = await fetch('/precomputed/manifest.json');
        if (!resp.ok) {
          console.warn('No precomputed manifest found at /precomputed/manifest.json');
          return;
        }
        const data = await resp.json();
        const models = Array.isArray(
          data.models
        )
          ? data.models
          : [];

        if (!models.length) {
          console.warn('Manifest missing models');
          return;
        }

        const results = await Promise.all(
          models.map(async (m) => {
            try {
              const res = await fetch(`/precomputed/${m.bin}`);
              const buf = await res.arrayBuffer();
              return { name: m.name, positions: new Float32Array(buf) };
            } catch (e) {
              console.error(`Error loading ${m.bin}:`, e);
              return null;
            }
          })
        );

        const valid = results.filter((p) => !!p);
        if (!valid.length) return;

        const aligned = alignBottoms(valid.map((v) => v.positions));
        const doubled = doubleVertices(aligned);

        let targets = doubled;
        let names = valid.map((v) => v.name || 'default');

        if (targets.length > 1) {
          const restIndices = Array.from({ length: targets.length - 1 }, (_, i) => i + 1);
          shuffle(restIndices);
          targets = [targets[0], ...restIndices.map((idx) => targets[idx])];
          names = [names[0], ...restIndices.map((idx) => names[idx])];
        }

        morphTargets = targets;
        morphNamesRef.current = names;

        if (morphTargets.length > 1) {
          const ref = morphTargets[0];
          const rest = shuffle(morphTargets.slice(1));
          morphTargets = [ref, ...rest];
        }

        currentTargetIndex = 0;
        morphTime = morphDurationBase * 0.2;
        lastTimestamp = null;

        if (!mesh) {
          initMesh();
        } else {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(morphTargets[0], 3)
          );
          mesh.geometry.dispose();
          mesh.geometry = geometry;
        }

        mesh.updateMatrixWorld(true);
        const vertexCount = morphTargets[0].length / 3;
        jitterSeeds = new Float32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
          jitterSeeds[i] = Math.random() * Math.PI * 2;
        }
        scatterVelocities = new Float32Array(vertexCount * 3);
        basePositionsRef.current = new Float32Array(morphTargets[0]);
        buildOverlayNodes();
        const initialName = morphNamesRef.current[0] || 'default';
        setBarcodeForModel(initialName);

        container.classList.add('loaded');
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };

    initScene();

    const handlePointerMove = (event) => {
      const rect = wrapper.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      wrapper.style.setProperty('--mouse-x', x.toFixed(3));
      wrapper.style.setProperty('--mouse-y', y.toFixed(3));

      if (!renderer || !camera || !mesh) return;
      const canvasRect = renderer.domElement.getBoundingClientRect();
      if (!canvasRect.width || !canvasRect.height) return;

      const nx =
        ((event.clientX - canvasRect.left) / canvasRect.width) * 2 - 1;
      const ny =
        -(((event.clientY - canvasRect.top) / canvasRect.height) * 2 - 1);

      pointer.set(nx, ny);
      raycaster.setFromCamera(pointer, camera);
      raycaster.params.Points = raycaster.params.Points || {};
      raycaster.params.Points.threshold = 0.06;

      const intersects = raycaster.intersectObject(mesh);
      if (intersects.length) {
        const hit = intersects[0];
        pointerWorldPos = hit.point.clone();
      } else {
        // fall back to a point along the view ray near the mesh
        const origin = raycaster.ray.origin;
        const dir = raycaster.ray.direction;
        const t = 2.5; // roughly around the particle cloud depth
        pointerWorldPos = new THREE.Vector3(
          origin.x + dir.x * t,
          origin.y + dir.y * t,
          origin.z + dir.z * t
        );
      }
    };

    wrapper.addEventListener('pointermove', handlePointerMove);
    loadModels();
    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      wrapper.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('resize', resize);
      clearOverlayNodes();

      if (renderer) {
        renderer.dispose();
      }
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
        audioSourceRef.current.disconnect();
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      analyserRef.current = null;
      audioDataRef.current = null;
      audioSourceRef.current = null;
      audioStarted = false;
      audioStartedRef.current = false;
      scatterVelocities = null;

      if (mesh) {
        mesh.geometry.dispose();
        mesh.material.dispose();
      }
      if (container && renderer?.domElement?.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  useEffect(() => {
    paletteRef.current = taupePalette;
  }, []);

  const toggleMute = () => {
    const next = !isMuted;

    // Ensure audio context is started on first user interaction (desktop + mobile)
    if (!audioStartedRef.current && startAudioRef.current) {
      startAudioRef.current(next);
    } else {
      const gain = gainRef.current;
      if (gain) {
        gain.gain.value = next ? 0 : 1;
      }
    }

    setIsMuted(next);
  };

  return (
    <>
      <div className="bg-diagonal" aria-hidden="true" />

      <div id="page">
        <div id="model-wrapper" ref={wrapperRef}>
          <div className="diagram-layer" ref={diagramRef}>
            <div className="diagram-grid" />
          </div>

          <h1 id="title-shape" className="title-text">
            <span className="title-shape-text">SHAPE</span>
          </h1>
          <h1 id="title-shift" className="title-text">
            <span>S</span>
            <span>H</span>
            <span>I</span>
            <span>F</span>
            <span>T</span>
          </h1>

          <div id="container" ref={containerRef} />

          <div id="palette-wrapper">
            <div className="palette-inner">
              <div
                className="barcode-card"
                aria-hidden="true"
                style={{ transform: barcodeTransform }}
              >
                <div className="barcode-meta">
                  <div className="barcode-meta__title">
                    <span>Shapeshift Labs</span>
                    <span>{signalLabel}</span>
                  </div>
                </div>
                <svg
                  className="barcode"
                  viewBox={`0 0 ${barcode.width} 76`}
                  preserveAspectRatio="none"
                  className={isBarcodeGlitch ? 'barcode barcode--glitch' : 'barcode'}
                >
                  {barcode.bars.map((bar, idx) => (
                    <rect
                      key={`${bar.x}-${idx}`}
                      x={bar.x}
                      y={4}
                      width={bar.width}
                      height={bar.height}
                      rx="0.4"
                    />
                  ))}
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="content-section">
        <h2>everything is a source of inspiration</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum nec lectus
          nunc. Nullam eget feugiat purus, at pulvinar odio.
        </p>
        <p>
          Integer egestas, arcu eget varius scelerisque, enim enim iaculis sapien, in
          pharetra neque mi ac arcu. Sed hendrerit justo non mi venenatis, in placerat
          augue ultrices.
        </p>
      </section>

      <section className="content-section">
        <h2>your environment shapes your thoughts</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque habitant
          morbi tristique senectus et netus et malesuada fames ac turpis egestas.
        </p>
        <p>
          Mauris pellentesque, ipsum ut pulvinar tincidunt, risus augue tincidunt dolor,
          sit amet imperdiet mauris tellus ac metus. Integer aliquet faucibus tellus sed
          dignissim.
        </p>
      </section>

      <section className="content-section">
        <h2>creation as wayfinding</h2>
        <p>
          Sed sit amet consectetur elit. Duis et leo a nunc bibendum sodales. Maecenas
          tincidunt congue mi, nec imperdiet tortor vehicula sit amet.
        </p>
        <p>
          Phasellus maximus, nibh id accumsan molestie, orci arcu faucibus elit, sed
          faucibus nibh metus a libero. Cras non nisl quis neque congue viverra.
        </p>
      </section>

      <section className="content-section">
        <h2>humanity is in the imperfections</h2>
        <p>
          Maecenas consequat nisl id augue consequat, quis dignissim nulla sollicitudin.
          Phasellus vitae arcu vel nisl suscipit vulputate sit amet non sem.
        </p>
        <p>
          Donec id sollicitudin ipsum. Integer non dolor volutpat, bibendum dui in,
          facilisis nisl.
        </p>
      </section>

      <section className="content-section">
        <h2>computation is the medium of process</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent finibus, sem
          at faucibus tempor, arcu justo condimentum lorem, nec facilisis urna odio ac
          arcu.
        </p>
        <p>
          Integer ornare, risus id vulputate aliquam, mauris erat vulputate libero, id
          pulvinar magna ligula in diam. Proin faucibus nibh in elit lacinia, sit amet
          feugiat tortor viverra.
        </p>
      </section>

      <section className="content-section">
        <h2>we adapt to technology, then it adapts to us</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec dictum luctus
          mauris, id rhoncus velit malesuada vel. Pellentesque a lacus nec dui tempor
          scelerisque.
        </p>
        <p>
          Aliquam erat volutpat. Cras a velit mi. In vitae nunc efficitur, ultricies
          ipsum non, faucibus eros. Vivamus ac nisl non augue vestibulum tincidunt.
        </p>
      </section>

      <section className="content-section">
        <h2>stories, archetypes &amp; symbols carry meaning with high fidelity</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras eu sem a urna
          accumsan hendrerit. Integer tincidunt, sapien non luctus mollis, justo mauris
          pulvinar nisl, eget dapibus massa purus at justo.
        </p>
        <p>
          Vivamus finibus, est quis molestie elementum, enim nulla pharetra lacus, vel
          volutpat dolor arcu id felis. Donec fringilla, erat eget aliquam accumsan,
          ligula urna interdum est, et euismod erat arcu a enim.
        </p>
      </section>

      <section className="content-section">
        <h2>history is beautiful</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer auctor, lectus
          vitae laoreet luctus, tortor lacus cursus nisl, vitae gravida arcu erat at
          lectus.
        </p>
        <p>
          Donec a sollicitudin orci. Vestibulum ante ipsum primis in faucibus orci luctus
          et ultrices posuere cubilia curae; Sed rhoncus quis lectus non congue.
        </p>
      </section>

      <section className="content-section">
        <h2>and so is what is lost</h2>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed congue elit id
          sapien venenatis, ac tincidunt sapien volutpat. Nunc feugiat, urna sed
          efficitur condimentum, lorem ligula pharetra nisl, nec cursus tortor ligula ut
          felis.
        </p>
        <p>
          Curabitur ut tincidunt lorem. Praesent consequat, ipsum at dictum gravida, nisl
          nulla commodo erat, non bibendum eros nisi ac leo.
        </p>
      </section>

      <button
        type="button"
        className="audio-toggle"
        onClick={toggleMute}
        aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
      >
        {isMuted ? <IoVolumeMute size={26} /> : <IoVolumeHigh size={26} />}
      </button>

      <div className="film-grain-overlay" aria-hidden="true" />
    </>
  );
}
