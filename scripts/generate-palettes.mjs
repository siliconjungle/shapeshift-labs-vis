import fs from 'node:fs/promises';
import path from 'node:path';
import ColorThief from 'colorthief';

const RGB = (colorArray) => ({
  r: colorArray[0],
  g: colorArray[1],
  b: colorArray[2],
});

async function main() {
  const projectRoot = process.cwd();
  const srefsDir = path.join(projectRoot, 'public', 'srefs');
  const outputPath = path.join(projectRoot, 'public', 'palettes.json');

  const entries = await fs.readdir(srefsDir, { withFileTypes: true });
  const imageFiles = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        /\.(jpe?g)$/i.test(entry.name)
    )
    .map((entry) => entry.name)
    .sort();

  const result = {};

  for (const filename of imageFiles) {
    const fullPath = path.join(srefsDir, filename);
    try {
      const palette = await ColorThief.getPalette(fullPath, 64);
      result[filename] = palette.map(RGB);
      console.log(`Extracted palette for ${filename} (${palette.length} colors)`);
    } catch (err) {
      console.warn(`Failed to extract palette for ${filename}:`, err?.message || err);
    }
  }

  await fs.writeFile(outputPath, JSON.stringify(result, null, 2), 'utf8');
  console.log(`Wrote palettes for ${Object.keys(result).length} images to ${outputPath}`);
}

main().catch((err) => {
  console.error('Error generating palettes:', err);
  process.exit(1);
});

