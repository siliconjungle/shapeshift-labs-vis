'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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

const alignBottoms = (targets: Float32Array[]) => {
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

const shuffle = <T,>(arr: T[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const randomInt = (minInclusive: number, maxExclusive: number) =>
  minInclusive + Math.floor(Math.random() * (maxExclusive - minInclusive));

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const diagramRef = useRef<HTMLDivElement | null>(null);
  const basePositionsRef = useRef<Float32Array | null>(null);

  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return;

    const container = containerRef.current;
    const wrapper = wrapperRef.current;
    const diagram = diagramRef.current;

    wrapper.style.setProperty('--diagram-phase', '0');
    wrapper.style.setProperty('--mouse-x', '0.5');
    wrapper.style.setProperty('--mouse-y', '0.5');

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer | undefined;
    let mesh: THREE.Points | undefined;
    let morphTargets: Float32Array[] = [];
    let currentTargetIndex = 0;
    let morphTime = 0;
    let lastTimestamp: number | null = null;
    let animationId: number | null = null;
    let currentRotX = 0;
    let currentRotY = 0;
    let audioStarted = false;
    let totalTime = 0;
    let jitterSeeds: Float32Array | null = null;
    let scatterVelocities: Float32Array | null = null;

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerWorldPos: THREE.Vector3 | null = null;

    const audioCtxRef = { current: null as AudioContext | null };
    const analyserRef = { current: null as AnalyserNode | null };
    const audioDataRef = { current: null as Uint8Array | null };
    const audioLevelRef = { current: 0 };
    const audioSourceRef = { current: null as AudioBufferSourceNode | null };

    type NodeEntry = {
      index: number;
      square: HTMLElement;
      label: HTMLElement;
    };
    const nodeEntries: NodeEntry[] = [];
    const lineEntries: HTMLElement[] = [];

    const tempLocal = new THREE.Vector3();
    const tempWorld = new THREE.Vector3();
    const tempProjected = new THREE.Vector3();

    const resize = () => {
      if (!renderer || !camera) return;
      const wrapperWidth = wrapper.clientWidth || 1;
      const wrapperHeight = wrapper.clientHeight || 1;
      const fullWidth = window.innerWidth || wrapperWidth;

      camera.aspect = fullWidth / wrapperHeight;
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

    const startAudio = async () => {
      if (audioStarted) return;
      audioStarted = true;
      try {
        const ctx = new AudioContext();
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

        source.connect(analyser);
        analyser.connect(ctx.destination);
        source.start();

        analyserRef.current = analyser;
        audioDataRef.current = data;
        audioSourceRef.current = source;
      } catch (err) {
        console.error('Audio start failed:', err);
      }
    };

    const buildOverlayNodes = () => {
      if (!diagram || !mesh) return;
      clearOverlayNodes();

      const vertexCount =
        (mesh.geometry.getAttribute('position') as THREE.BufferAttribute)?.count ?? 0;
      if (!vertexCount) return;

      const count = randomInt(minNodes, maxNodes + 1);
      const used = new Set<number>();

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
      array: Float32Array,
      basePositions: Float32Array | null,
      seeds: Float32Array | null,
      level: number
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

        const wave = Math.sin(wavePhase + baseX * 1.2 + baseY * 0.8) +
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

        array[idx3] =
          baseX + wobbleX + waveOffset * 0.8 + windX + rx * pulse;
        array[idx3 + 1] =
          baseY + wobbleY + waveOffset + windY + ry * pulse;
        array[idx3 + 2] =
          baseZ + wobbleZ + waveOffset * 0.6 + windZ + rz * pulse;
      }
    };

    const applyScatter = (array: Float32Array) => {
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

    const updateOverlayPositions = () => {
      if (!mesh || !diagram || nodeEntries.length === 0) return;

      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight || 1;
      const positionAttr = mesh.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const positions = positionAttr.array as Float32Array;
      const vertexCount = positionAttr.count;

      const screenPositions: { x: number; y: number }[] = [];
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
      const currentPositionAttribute = mesh.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const array = currentPositionAttribute.array as Float32Array;
      array.set(positions);
      basePositionsRef.current = array.slice();
      applyJitter(array, basePositionsRef.current, jitterSeeds, audioLevelRef.current);
      applyScatter(array);
      currentPositionAttribute.needsUpdate = true;
    };

    const updateMorphing = (
      deltaMs: number,
      effectiveDuration: number,
      audioLevel: number
    ) => {
      const numTargets = morphTargets.length;
      if (numTargets < 2 || !mesh) return;

      morphTime += deltaMs;
      let phase = morphTime / effectiveDuration;
      let stepped = false;

      if (phase >= 1) {
        const steps = Math.floor(phase);
        if (steps > 0) {
          currentTargetIndex = (currentTargetIndex + steps) % numTargets;
          stepped = true;
        }
        morphTime -= Math.floor(phase) * effectiveDuration;
        phase = morphTime / effectiveDuration;
      }

      const factor = 0.5 - 0.5 * Math.cos(Math.PI * phase);
      wrapper.style.setProperty('--diagram-phase', factor.toString());

      const sourceIndex = currentTargetIndex % numTargets;
      const targetIndex = (currentTargetIndex + 1) % numTargets;
      const sourcePositions = morphTargets[sourceIndex];
      const targetPositions = morphTargets[targetIndex];
      const currentPositionAttribute = mesh.geometry.getAttribute(
        'position'
      ) as THREE.BufferAttribute;
      const array = currentPositionAttribute.array as Float32Array;

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
      currentPositionAttribute.needsUpdate = true;

      if (stepped) {
        buildOverlayNodes();
      }
    };

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const cappedDelta = Math.min(delta, 100);
      const deltaSeconds = cappedDelta / 1000;

      if (mesh) {
        totalTime += cappedDelta;
        // audio-reactive morph speed
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
        const speedFactor = 1 - Math.min(0.4, level * 0.5); // faster with louder beats
        const effectiveDuration = morphDurationBase * speedFactor;

        // ensure we always have some avoidance point (center if mouse never moved)
        if (!pointerWorldPos && renderer) {
          pointer.set(0, 0);
          raycaster.setFromCamera(pointer, camera);
          const origin = raycaster.ray.origin;
          const dir = raycaster.ray.direction;
          const t = 2.5;
          pointerWorldPos = new THREE.Vector3(
            origin.x + dir.x * t,
            origin.y + dir.y * t,
            origin.z + dir.z * t
          );
        }

        // continuous pointer avoidance field as a cylinder around the mouse ray
        if (scatterVelocities) {
          const positionAttr = mesh.geometry.getAttribute(
            'position'
          ) as THREE.BufferAttribute;
          const vertexCount = positionAttr.count;
          const radius = 0.9;
          const radiusSq = radius * radius;
          const baseStrength = (1.2 + level * 1.3) * deltaSeconds;

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
            const falloff = 1 - dist / radius;
            const strength =
              baseStrength * (0.4 + 0.6 * falloff) * (1 / (0.15 + dist));

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
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 4;

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
      geometry.setAttribute('position', new THREE.BufferAttribute(initialPositions, 3));

      const material = new THREE.PointsMaterial({
        color: 0xcccccc,
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
        const models: { name: string; bin: string }[] = Array.isArray(
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
              return new Float32Array(buf);
            } catch (e) {
              console.error(`Error loading ${m.bin}:`, e);
              return null;
            }
          })
        );

        const valid = results.filter((p): p is Float32Array => !!p);
        if (!valid.length) return;

        morphTargets = alignBottoms(valid);

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

        mesh!.updateMatrixWorld(true);
        const vertexCount = morphTargets[0].length / 3;
        jitterSeeds = new Float32Array(vertexCount);
        for (let i = 0; i < vertexCount; i++) {
          jitterSeeds[i] = Math.random() * Math.PI * 2;
        }
        scatterVelocities = new Float32Array(vertexCount * 3);
        basePositionsRef.current = new Float32Array(morphTargets[0]);
        buildOverlayNodes();

        container.classList.add('loaded');
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };

    initScene();

    const handlePointerMove = (event: PointerEvent) => {
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
    wrapper.addEventListener('pointerdown', startAudio, { once: true });
    loadModels();
    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      wrapper.removeEventListener('pointermove', handlePointerMove);
      wrapper.removeEventListener('pointerdown', startAudio);
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
      scatterVelocities = null;

      if (mesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      if (container && renderer?.domElement?.parentElement === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
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
      </div>
    </div>
  );
}
