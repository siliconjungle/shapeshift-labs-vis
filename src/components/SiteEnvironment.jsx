'use client';

import { useEffect } from 'react';

const THEME_STORAGE_KEY = 'shapeshift-theme';

const readThemePreference = () => {
  let stored = null;
  try {
    stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  } catch {
    stored = null;
  }

  if (stored === 'light' || stored === 'dark') {
    return { theme: stored, hasOverride: true };
  }

  const prefersDark =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false;

  return { theme: prefersDark ? 'dark' : 'light', hasOverride: false };
};

const createGrainLayer = (size, contrast) => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const imageData = ctx.createImageData(size, size);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const gaussian =
      (Math.random() + Math.random() + Math.random() + Math.random()) / 4 - 0.5;
    const base = 150;
    let value = base + gaussian * 90 * contrast;

    const sparkle = Math.random();
    if (sparkle < 0.012) {
      value += 55;
    } else if (sparkle > 0.988) {
      value -= 65;
    }

    value = Math.max(85, Math.min(225, value));
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
    data[i + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
  return `url(${canvas.toDataURL('image/png')})`;
};

const updateFilmGrain = () => {
  try {
    const fine = createGrainLayer(96, 0.7);
    const coarse = createGrainLayer(192, 1.0);
    const rootStyle = document.documentElement.style;

    if (fine) {
      rootStyle.setProperty('--grain-texture-fine', fine);
    }
    if (coarse) {
      rootStyle.setProperty('--grain-texture-coarse', coarse);
    }
  } catch {
    // Keep the CSS fallback grain if canvas generation is unavailable.
  }
};

export default function SiteEnvironment() {
  useEffect(() => {
    const root = document.documentElement;
    const initial = readThemePreference();
    root.setAttribute('data-theme', initial.theme);

    const media =
      typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)')
        : null;

    const handleSystemChange = (event) => {
      const current = readThemePreference();
      if (current.hasOverride) return;
      root.setAttribute('data-theme', event.matches ? 'dark' : 'light');
    };

    if (media) {
      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', handleSystemChange);
      } else if (typeof media.addListener === 'function') {
        media.addListener(handleSystemChange);
      }
    }

    updateFilmGrain();

    return () => {
      if (!media) return;
      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', handleSystemChange);
      } else if (typeof media.removeListener === 'function') {
        media.removeListener(handleSystemChange);
      }
    };
  }, []);

  return null;
}
