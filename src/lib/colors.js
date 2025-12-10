import ColorThief from 'colorthief';
import munkres from 'munkres-js';

export const findClosestColorIndex = (labColor, paletteLab) => {
  let closestIndex = 0;
  let smallestDistance = Number.MAX_VALUE;

  for (let i = 0; i < paletteLab.length; i++) {
    const distance = Math.sqrt(
      Math.pow(labColor.l - paletteLab[i].l, 2) +
        Math.pow(labColor.a - paletteLab[i].a, 2) +
        Math.pow(labColor.b - paletteLab[i].b, 2)
    );

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
};

export const findClosestColorIndexAB = (labColor, paletteLab) => {
  let closestIndex = 0;
  let smallestDistance = Number.MAX_VALUE;

  for (let i = 0; i < paletteLab.length; i++) {
    let distance = Math.sqrt(
      Math.pow(labColor.l - paletteLab[i].l, 2) +
        Math.pow(labColor.a - paletteLab[i].a, 2) +
        Math.pow(labColor.b - paletteLab[i].b, 2)
    );

    distance =
      distance * 0.5 +
      2 *
        Math.sqrt(
          Math.pow(labColor.a - paletteLab[i].a, 2) +
            Math.pow(labColor.b - paletteLab[i].b, 2)
        );

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
};

export const findClosestColorIndexL = (labColor, paletteLab) => {
  let closestIndex = 0;
  let smallestDistance = Number.MAX_VALUE;

  for (let i = 0; i < paletteLab.length; i++) {
    let distance = Math.sqrt(
      Math.pow(labColor.l - paletteLab[i].l, 2) +
        Math.pow(labColor.a - paletteLab[i].a, 2) +
        Math.pow(labColor.b - paletteLab[i].b, 2)
    );

    distance = distance * 0.5 + Math.abs(labColor.l - paletteLab[i].l);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      closestIndex = i;
    }
  }

  return closestIndex;
};

const t1 = 6 / 29;
const t2 = 3 * t1 * t1;
const t3 = t1 * t1 * t1;

export const rgb2lrgb = (x) => {
  const x2 = x / 255;
  return x2 <= 0.04045 ? x2 / 12.92 : Math.pow((x2 + 0.055) / 1.055, 2.4);
};

export const xyz2lab = (t) =>
  t > t3 ? Math.pow(t, 1 / 3) : t / t2 + 4 / 29;

export const rgbToLab = (color) => {
  const r = rgb2lrgb(color.r);
  const g = rgb2lrgb(color.g);
  const b = rgb2lrgb(color.b);
  const y = xyz2lab(0.2225045 * r + 0.7168786 * g + 0.0606169 * b);

  const x =
    r === g && g === b
      ? y
      : xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / 0.96422);
  const z =
    r === g && g === b
      ? y
      : xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / 0.82521);

  return {
    l: 116 * y - 16,
    a: 500 * (x - y),
    b: 200 * (y - z),
  };
};

export const lrgb2rgb = (x) =>
  Math.round(
    255 *
      (x <= 0.0031308
        ? 12.92 * x
        : 1.055 * Math.pow(x, 1 / 2.4) - 0.055)
  ) || 0;

export const lab2xyz = (t) =>
  t > t1 ? t * t * t : t2 * (t - 4 / 29);

export const labToRgb = ({ l, a, b }) => {
  const baseY = (l + 16) / 116;
  const x = 0.96422 * lab2xyz(baseY + a / 500);
  const y = lab2xyz(baseY);
  const z = 0.82521 * lab2xyz(baseY - b / 200);

  return {
    r: lrgb2rgb(3.1338561 * x - 1.6168667 * y - 0.4906146 * z),
    g: lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.033454 * z),
    b: lrgb2rgb(0.0719453 * x - 0.2289914 * y + 1.4052427 * z),
  };
};

export const colorDistance = (color1, color2) => {
  const lab1 = rgbToLab(color1);
  const lab2 = rgbToLab(color2);
  const deltaL = lab1.l - lab2.l;
  const deltaA = lab1.a - lab2.a;
  const deltaB = lab1.b - lab2.b;
  return Math.sqrt(deltaL ** 2 + deltaA ** 2 + deltaB ** 2);
};

export const createDistanceMatrix = (colors1, colors2) => {
  const distanceMatrix = [];

  for (let i = 0; i < colors1.length; i++) {
    distanceMatrix[i] = [];
    for (let j = 0; j < colors2.length; j++) {
      distanceMatrix[i][j] = colorDistance(colors1[i], colors2[j]);
    }
  }

  return distanceMatrix;
};

export const sortColorsByPairing = (colors1, colors2) => {
  const distanceMatrix = createDistanceMatrix(colors1, colors2);
  const results = munkres(distanceMatrix);
  return results.map((result) => colors2[result[1]]);
};

export const interpolatePalette = (
  palette1,
  palette2,
  i
) => {
  const newPalette = palette1.map((color1, index) => {
    const color2 = palette2[index];
    return {
      r: Math.round(color1.r + (color2.r - color1.r) * i),
      g: Math.round(color1.g + (color2.g - color1.g) * i),
      b: Math.round(color1.b + (color2.b - color1.b) * i),
    };
  });
  return newPalette;
};

export const hslToRgb = ({ h, s, l }) => {
  let r;
  let g;
  let b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
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

    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return { r: r * 255, g: g * 255, b: b * 255 };
};

export const polarToHsl = (
  radius,
  angle,
  maxRadius
) => {
  const luminosity = radius / maxRadius;
  return { h: angle, s: 0.5, l: luminosity };
};

export const polarToLab = (
  radius,
  angle,
  maxRadius
) => {
  const luminosity = radius / maxRadius;
  const hslColor = polarToHsl(radius, angle, maxRadius);
  const rgbColor = hslToRgb(hslColor);
  const labColor = rgbToLab(rgbColor);

  // Using polar coordinates directly for a/b, fixed scaling
  return {
    l: 100 * luminosity,
    a: 128 * Math.cos(angle),
    b: 128 * Math.sin(angle),
  };
};

export const extractPalette = async (
  imagePath,
  colorCount
) => {
  return new Promise((resolve, reject) => {
    const sourceImage = new Image();
    sourceImage.crossOrigin = 'Anonymous';
    sourceImage.src = imagePath;

    sourceImage.onload = () => {
      try {
        // Instantiate ColorThief – getPalette is an instance method
        const colorThief = new ColorThief();
        const palette = colorThief.getPalette(
          sourceImage,
          colorCount
        );

        const formattedPalette = (palette || []).map((color) => ({
          r: color[0],
          g: color[1],
          b: color[2],
        }));

        resolve(formattedPalette);
      } catch (err) {
        reject(err);
      }
    };

    sourceImage.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
};

