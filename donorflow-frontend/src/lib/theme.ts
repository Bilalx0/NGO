import { converter, type Color } from 'culori';

type OklchComponents = {
  l: number;
  c: number;
  h: number;
};

const FALLBACK_OKLCH = 'oklch(0.55 0.2 264)';

const toOklch = converter('oklch') as (value: Color) => OklchComponents | null;

function normalizeHex(hex: string): string {
  const trimmed = hex.trim();

  if (!trimmed) {
    return '';
  }

  const withoutHash = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed;

  if (/^[0-9a-fA-F]{3}$/.test(withoutHash)) {
    return withoutHash
      .split('')
      .map((char) => `${char}${char}`)
      .join('');
  }

  if (/^[0-9a-fA-F]{6}$/.test(withoutHash)) {
    return withoutHash;
  }

  return '';
}

function convertHexToOklch(hex: string, amount = 0): string {
  const normalizedHex = normalizeHex(hex);

  if (!normalizedHex) {
    return FALLBACK_OKLCH;
  }

  try {
    const parsed = toOklch(`#${normalizedHex}`);

    if (!parsed || typeof parsed !== 'object') {
      return FALLBACK_OKLCH;
    }

    const lightness = Number(parsed.l);
    const chroma = Number(parsed.c);
    const hue = Number(parsed.h);

    if (!Number.isFinite(lightness) || !Number.isFinite(chroma) || !Number.isFinite(hue)) {
      return FALLBACK_OKLCH;
    }

    const adjustedLightness = Math.min(1, lightness + amount);
    const roundedLightness = Number(adjustedLightness.toFixed(3));
    const roundedChroma = Number(chroma.toFixed(3));
    const roundedHue = Number(hue.toFixed(1));

    return `oklch(${roundedLightness} ${roundedChroma} ${roundedHue})`;
  } catch {
    return FALLBACK_OKLCH;
  }
}

export function hexToOklch(hex: string): string {
  return convertHexToOklch(hex, 0);
}

export function hexToOklchLight(hex: string, amount = 0.1): string {
  return convertHexToOklch(hex, amount);
}
