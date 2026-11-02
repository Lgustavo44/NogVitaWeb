import {
  INITIAL_CROP,
  MAX_ZOOM,
  clampCrop,
  coverScale,
  rotateClockwise,
  rotatedSize,
  zoomTo,
} from './crop-math';

const landscape = { width: 4000, height: 3000 };
const square = { width: 300, height: 300 };

describe('geometria do recorte', () => {
  it('a escala de cobertura preenche a área pelo lado mais curto', () => {
    expect(coverScale(landscape, 0, square)).toBeCloseTo(0.1); // 300 / 3000
    // Girada, a foto fica em pé (3000 × 4000): agora o lado curto é a largura.
    expect(rotatedSize(landscape, 90)).toEqual({ width: 3000, height: 4000 });
    expect(coverScale(landscape, 90, square)).toBeCloseTo(0.1);
    expect(coverScale(landscape, 0, { width: 300, height: 400 })).toBeCloseTo(400 / 3000);
  });

  it('não deixa sobrar espaço vazio: o deslocamento para na borda da imagem', () => {
    // Escala 0,1 → imagem de 400 × 300 numa área de 300 × 300: sobra 50 px de cada lado em x.
    const clamped = clampCrop({ ...INITIAL_CROP, x: 999, y: 999 }, landscape, square);
    expect(clamped.x).toBeCloseTo(50);
    expect(clamped.y).toBe(0);
  });

  it('zoom fica entre 1 e o máximo, em torno do centro', () => {
    expect(clampCrop({ ...INITIAL_CROP, zoom: 0.2 }, landscape, square).zoom).toBe(1);
    expect(clampCrop({ ...INITIAL_CROP, zoom: 99 }, landscape, square).zoom).toBe(MAX_ZOOM);

    const moved = clampCrop({ ...INITIAL_CROP, x: 40 }, landscape, square);
    const zoomed = zoomTo(moved, 2, landscape, square);
    expect(zoomed.zoom).toBe(2);
    expect(zoomed.x).toBeCloseTo(80);
  });

  it('girar mantém o zoom e reposiciona dentro dos limites', () => {
    const state = zoomTo(INITIAL_CROP, 2, landscape, square);
    const rotated = rotateClockwise({ ...state, x: 100 }, landscape, square);
    expect(rotated.rotation).toBe(90);
    expect(rotated.zoom).toBe(2);
    expect(rotated.x).toBeCloseTo(0);
    expect(rotated.y).toBe(100);
    expect(rotateClockwise({ ...rotated, rotation: 270 }, landscape, square).rotation).toBe(0);
  });
});
