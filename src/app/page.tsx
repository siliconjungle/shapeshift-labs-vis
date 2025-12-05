'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const morphDuration = 4500; // ms per transition

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

export default function Page() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!containerRef.current || !wrapperRef.current) return;

    const container = containerRef.current;
    const wrapper = wrapperRef.current;

    let scene: THREE.Scene;
    let camera: THREE.PerspectiveCamera;
    let renderer: THREE.WebGLRenderer;
    let mesh: THREE.Points | undefined;
    let morphTargets: Float32Array[] = [];
    let targetVertexCount = 0;
    let currentTargetIndex = 0;
    let morphTime = 0;
    let lastTimestamp: number | null = null;
    let animationId: number | null = null;

    const resize = () => {
      const width = wrapper.clientWidth;
      const height = wrapper.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const updateMorphing = (deltaMs: number) => {
      const numTargets = morphTargets.length;
      if (numTargets < 2 || !mesh) return;

      morphTime += deltaMs;
      let phase = morphTime / morphDuration;
      if (phase >= 1) {
        const steps = Math.floor(phase);
        currentTargetIndex = (currentTargetIndex + steps) % numTargets;
        morphTime -= steps * morphDuration;
        phase = morphTime / morphDuration;
      }

      const factor = 0.5 - 0.5 * Math.cos(Math.PI * phase);
      const sourceIndex = currentTargetIndex % numTargets;
      const targetIndex = (currentTargetIndex + 1) % numTargets;
      const sourcePositions = morphTargets[sourceIndex];
      const targetPositions = morphTargets[targetIndex];
      const currentPositionAttribute = mesh.geometry.attributes.position as THREE.BufferAttribute;
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

      currentPositionAttribute.needsUpdate = true;
    };

    const updateSingleTarget = () => {
      if (!mesh || morphTargets.length === 0) return;
      const positions = morphTargets[0];
      const currentPositionAttribute = mesh.geometry.attributes.position as THREE.BufferAttribute;
      const array = currentPositionAttribute.array as Float32Array;
      array.set(positions);
      currentPositionAttribute.needsUpdate = true;
    };

    const animate = (timestamp: number) => {
      if (lastTimestamp === null) lastTimestamp = timestamp;
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;
      const cappedDelta = Math.min(delta, 100); // cap to avoid large jumps

      if (mesh) {
        if (morphTargets.length > 1) {
          updateMorphing(cappedDelta);
        } else if (morphTargets.length === 1) {
          updateSingleTarget();
        }
      }

      renderer.render(scene, camera);
      animationId = requestAnimationFrame(animate);
    };

    const initScene = () => {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
      camera.position.z = 4;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
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
        color: 0xffffff,
        size: 0.02,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.9,
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
        const models: { name: string; bin: string }[] = Array.isArray(data.models)
          ? data.models
          : [];
        targetVertexCount = data.vertexCount || 0;
        if (!models.length || !targetVertexCount) {
          console.warn('Manifest missing models or vertexCount');
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

        // Shuffle to vary morph order
        if (morphTargets.length > 1) {
          const ref = morphTargets[0];
          const rest = shuffle(morphTargets.slice(1));
          morphTargets = [ref, ...rest];
        }

        currentTargetIndex = 0;
        morphTime = morphDuration * 0.2; // start partway through first transition for consistency
        lastTimestamp = null;

        if (!mesh) {
          initMesh();
        } else {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.BufferAttribute(morphTargets[0], 3));
          mesh.geometry.dispose();
          mesh.geometry = geometry;
        }

        container.classList.add('loaded');
      } catch (err) {
        console.error('Error loading models:', err);
      }
    };

    initScene();
    loadModels();
    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      if (renderer) renderer.dispose();
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
        <h1 id="title-shape" className="title-text">
          SHAPE
        </h1>
        <h1 id="title-shift" className="title-text">
          <span>S</span>
          <span>H</span>
          <span>I</span>
          <span>F</span>
          <span>T</span>
        </h1>
        <div id="container" ref={containerRef}></div>
      </div>
    </div>
  );
}
