#!/usr/bin/env node
/**
 * Precomputes morph-ready vertex data from GLB models in public/models.
 * - Normalizes/centers/scales
 * - Trims bottom 1% of points
 * - Clamps to MAX_VERTEX_COUNT
 * - Unifies vertex count across all models and aligns vertices to nearest neighbors
 * Writes Float32Array binaries + metadata into public/precomputed.
 */
import fs from 'fs/promises';
import path from 'path';
import * as THREE from 'three';

const INPUT_DIR = path.join(process.cwd(), 'public', 'models');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'precomputed');
const MAX_VERTEX_COUNT = 20000;

// --- Helpers (ported from runtime logic) ---
const normalizePositions = (positions) => {
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    const y = positions[i + 1];
    const z = positions[i + 2];
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeY, sizeZ);
  const scale = maxDim > 0 ? 3.0 / maxDim : 1.0;

  const normalized = new Float32Array(positions.length);
  for (let i = 0; i < positions.length; i += 3) {
    normalized[i] = (positions[i] - centerX) * scale;
    normalized[i + 1] = (positions[i + 1] - centerY) * scale;
    normalized[i + 2] = (positions[i + 2] - centerZ) * scale;
  }
  return normalized;
};

const trimBottomRow = (positions) => {
  if (positions.length < 3) return positions;

  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 1; i < positions.length; i += 3) {
    const y = positions[i];
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  const height = maxY - minY;
  const threshold = minY + height * 0.01; // trim bottom 1%

  const kept = [];
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 1];
    if (y <= threshold) continue;
    kept.push(positions[i], positions[i + 1], positions[i + 2]);
  }

  return kept.length >= 3 ? new Float32Array(kept) : positions;
};

const clampPositions = (positions, maxVertices) => {
  const vertCount = positions.length / 3;
  if (vertCount <= maxVertices) return positions;

  const stride = Math.ceil(vertCount / maxVertices);
  const keptVertices = Math.floor(vertCount / stride);
  const result = new Float32Array(keptVertices * 3);
  let ri = 0;
  for (let i = 0; i < vertCount && ri < result.length / 3; i += stride) {
    const pi = i * 3;
    result[ri * 3] = positions[pi];
    result[ri * 3 + 1] = positions[pi + 1];
    result[ri * 3 + 2] = positions[pi + 2];
    ri++;
  }
  return result;
};

const adjustVertexCount = (positions, finalCount) => {
  const finalLength = finalCount * 3;
  const adjustedPositions = new Float32Array(finalLength);

  const copyLength = Math.min(positions.length, finalLength);
  for (let i = 0; i < copyLength; i++) {
    adjustedPositions[i] = positions[i];
  }

  const loadedVertices = copyLength / 3;
  if (loadedVertices < finalCount) {
    const lastX = adjustedPositions[copyLength - 3] || 0;
    const lastY = adjustedPositions[copyLength - 2] || 0;
    const lastZ = adjustedPositions[copyLength - 1] || 0;
    let pIndex = loadedVertices * 3;

    while (pIndex < finalLength) {
      adjustedPositions[pIndex++] = lastX;
      adjustedPositions[pIndex++] = lastY;
      adjustedPositions[pIndex++] = lastZ;
    }
  }

  return adjustedPositions;
};

const reorderToNearest = (referencePositions, targetPositions) => {
  const len = referencePositions.length / 3;
  if (targetPositions.length !== referencePositions.length) {
    throw new Error('reorderToNearest requires equal-length position arrays.');
  }

  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
  const updateBounds = (arr) => {
    for (let i = 0; i < arr.length; i += 3) {
      const x = arr[i], y = arr[i + 1], z = arr[i + 2];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (z < minZ) minZ = z;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      if (z > maxZ) maxZ = z;
    }
  };
  updateBounds(referencePositions);
  updateBounds(targetPositions);

  const sizeX = maxX - minX;
  const sizeY = maxY - minY;
  const sizeZ = maxZ - minZ;
  const maxDim = Math.max(sizeX, sizeY, sizeZ);
  const cellSize = maxDim > 0 ? maxDim / 20 : 1;

  const buckets = new Map();
  const available = new Array(len).fill(true);
  const bucketKey = (ix, iy, iz) => `${ix}|${iy}|${iz}`;

  for (let i = 0; i < len; i++) {
    const x = targetPositions[i * 3];
    const y = targetPositions[i * 3 + 1];
    const z = targetPositions[i * 3 + 2];
    const ix = Math.floor((x - minX) / cellSize);
    const iy = Math.floor((y - minY) / cellSize);
    const iz = Math.floor((z - minZ) / cellSize);
    const key = bucketKey(ix, iy, iz);
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(i);
  }

  const reordered = new Float32Array(targetPositions.length);

  const removeFromBucket = (idx) => {
    const x = targetPositions[idx * 3];
    const y = targetPositions[idx * 3 + 1];
    const z = targetPositions[idx * 3 + 2];
    const ix = Math.floor((x - minX) / cellSize);
    const iy = Math.floor((y - minY) / cellSize);
    const iz = Math.floor((z - minZ) / cellSize);
    const key = bucketKey(ix, iy, iz);
    const arr = buckets.get(key);
    if (!arr) return;
    const pos = arr.indexOf(idx);
    if (pos >= 0) arr.splice(pos, 1);
  };

  const findNearest = (rx, ry, rz) => {
    const cx = Math.floor((rx - minX) / cellSize);
    const cy = Math.floor((ry - minY) / cellSize);
    const cz = Math.floor((rz - minZ) / cellSize);

    const maxRadius = 2;
    let bestIdx = -1;
    let bestDist2 = Infinity;

    for (let r = 0; r <= maxRadius && bestIdx === -1; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          for (let dz = -r; dz <= r; dz++) {
            const arr = buckets.get(bucketKey(cx + dx, cy + dy, cz + dz));
            if (!arr || arr.length === 0) continue;
            for (let k = 0; k < arr.length; k++) {
              const idx = arr[k];
              if (!available[idx]) continue;
              const tx = targetPositions[idx * 3];
              const ty = targetPositions[idx * 3 + 1];
              const tz = targetPositions[idx * 3 + 2];
              const dist2 = (tx - rx) ** 2 + (ty - ry) ** 2 + (tz - rz) ** 2;
              if (dist2 < bestDist2) {
                bestDist2 = dist2;
                bestIdx = idx;
              }
            }
          }
        }
      }
    }

    if (bestIdx === -1) {
      for (let idx = 0; idx < len; idx++) {
        if (!available[idx]) continue;
        const tx = targetPositions[idx * 3];
        const ty = targetPositions[idx * 3 + 1];
        const tz = targetPositions[idx * 3 + 2];
        const dist2 = (tx - rx) ** 2 + (ty - ry) ** 2 + (tz - rz) ** 2;
        if (dist2 < bestDist2) {
          bestDist2 = dist2;
          bestIdx = idx;
        }
      }
    }

    return bestIdx;
  };

  for (let i = 0; i < len; i++) {
    const rx = referencePositions[i * 3];
    const ry = referencePositions[i * 3 + 1];
    const rz = referencePositions[i * 3 + 2];

    const nearestIdx = findNearest(rx, ry, rz);
    if (nearestIdx === -1) continue;

    available[nearestIdx] = false;
    removeFromBucket(nearestIdx);

    reordered[i * 3] = targetPositions[nearestIdx * 3];
    reordered[i * 3 + 1] = targetPositions[nearestIdx * 3 + 1];
    reordered[i * 3 + 2] = targetPositions[nearestIdx * 3 + 2];
  }

  return reordered;
};

let GLTFLoader;

const loadGLB = async (filePath) => {
  const buffer = await fs.readFile(filePath);
  const arrayBuffer = buffer.buffer.slice(
    buffer.byteOffset,
    buffer.byteOffset + buffer.byteLength
  );

  // GLTFLoader relies on a browser-like global `self`; provide a stub in Node.
  if (typeof globalThis.self === 'undefined') {
    globalThis.self = globalThis;
  }
  if (!GLTFLoader) {
    ({ GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js'));
  }

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.parse(
      arrayBuffer,
      '',
      (gltf) => {
        const mergedPositions = [];
        gltf.scene.updateMatrixWorld(true);
        gltf.scene.traverse((child) => {
          const c = child;
          if (!c.isMesh || !c.geometry || !c.geometry.attributes.position) return;
          let geometry = c.geometry.clone();
          if (geometry.index) geometry = geometry.toNonIndexed();
          geometry.applyMatrix4(c.matrixWorld);
          const positions = geometry.attributes.position.array;
          for (let i = 0; i < positions.length; i++) {
            mergedPositions.push(positions[i]);
          }
        });

        if (!mergedPositions.length) {
          reject(new Error('No vertices found in GLB'));
          return;
        }

        let normalized = normalizePositions(new Float32Array(mergedPositions));
        normalized = trimBottomRow(normalized);
        normalized = clampPositions(normalized, MAX_VERTEX_COUNT);
        resolve(normalized);
      },
      (err) => reject(err)
    );
  });
};

async function main() {
  const entries = await fs.readdir(INPUT_DIR).catch(() => []);
  const glbFiles = entries.filter((f) => f.toLowerCase().endsWith('.glb'));
  if (!glbFiles.length) {
    console.error(`No .glb files found in ${INPUT_DIR}`);
    process.exit(1);
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const loaded = [];
  for (const name of glbFiles) {
    const filePath = path.join(INPUT_DIR, name);
    process.stdout.write(`Loading ${name}...\n`);
    const positions = await loadGLB(filePath);
    loaded.push({ name, positions });
  }

  const targetVertexCount = Math.max(...loaded.map((l) => l.positions.length / 3));

  const processed = [];
  const reference = adjustVertexCount(loaded[0].positions, targetVertexCount);
  processed.push({ name: loaded[0].name, positions: reference });

  for (let i = 1; i < loaded.length; i++) {
    const adjusted = adjustVertexCount(loaded[i].positions, targetVertexCount);
    const aligned = reorderToNearest(reference, adjusted);
    processed.push({ name: loaded[i].name, positions: aligned });
  }

  const manifest = {
    vertexCount: targetVertexCount,
    models: [],
  };

  for (const { name, positions } of processed) {
    const base = path.basename(name, path.extname(name));
    const binPath = path.join(OUTPUT_DIR, `${base}.bin`);
    const metaPath = path.join(OUTPUT_DIR, `${base}.json`);
    await fs.writeFile(binPath, Buffer.from(positions.buffer));
    await fs.writeFile(
      metaPath,
      JSON.stringify({ name: base, vertexCount: targetVertexCount }, null, 2)
    );
    manifest.models.push({ name: base, bin: `${base}.bin`, meta: `${base}.json` });
  }

  await fs.writeFile(
    path.join(OUTPUT_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(
    `Precomputed ${processed.length} models to ${OUTPUT_DIR} (vertexCount=${targetVertexCount}).`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
