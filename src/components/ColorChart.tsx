import { useRef, useEffect } from 'react';
import { findClosestColorIndexL, rgbToLab, polarToLab, labToRgb, RGB } from '../lib/colors';

type Props = {
  palette: RGB[];
  size: number;
};

const ColorChart = ({ palette, size }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const maxRadius = size * 0.5;
    const imageData = ctx.createImageData(size, size);
    const data = imageData.data;

    if (!palette.length) {
      for (let i = 0; i < 4 * size * size; i++) {
        data[i] = 0;
      }
      ctx.putImageData(imageData, 0, 0);
      return;
    }

    const paletteLab = palette.map((color) => rgbToLab(color));

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - maxRadius;
        const dy = y - maxRadius;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius + 2) continue;

        const angle = Math.atan2(dy, dx);
        const labColor = polarToLab(distance, angle, maxRadius);
        const closestColorIndex = findClosestColorIndexL(labColor, paletteLab);
        const rgbColor = labToRgb(paletteLab[closestColorIndex]);

        const position = (x + y * imageData.width) * 4;
        data[position] = Math.round(rgbColor.r);
        data[position + 1] = Math.round(rgbColor.g);
        data[position + 2] = Math.round(rgbColor.b);
        data[position + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [palette, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        imageRendering: 'pixelated',
        overflow: 'hidden',
      }}
    />
  );
};

export default ColorChart;

