/**
 * Geometria do recorte. A imagem fica centrada na área de corte e é desenhada com:
 * deslocamento (x, y) em px da área, giro em graus e escala = cobertura × zoom.
 * A escala de cobertura é a menor que ainda cobre a área inteira; o zoom vai de 1 a MAX_ZOOM.
 */

export type Rotation = 0 | 90 | 180 | 270;

export interface CropState {
  x: number;
  y: number;
  zoom: number;
  rotation: Rotation;
}

export interface Size {
  width: number;
  height: number;
}

export const MAX_ZOOM = 4;
export const INITIAL_CROP: CropState = { x: 0, y: 0, zoom: 1, rotation: 0 };

/** Largura e altura da imagem depois do giro. */
export function rotatedSize(image: Size, rotation: Rotation): Size {
  return rotation % 180 === 0 ? image : { width: image.height, height: image.width };
}

/** Menor escala que faz a imagem (girada) cobrir a área inteira. */
export function coverScale(image: Size, rotation: Rotation, area: Size): number {
  const { width, height } = rotatedSize(image, rotation);
  return Math.max(area.width / width, area.height / height);
}

/** Zoom dentro dos limites e deslocamento sem deixar sobrar espaço vazio na área. */
export function clampCrop(state: CropState, image: Size, area: Size): CropState {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, state.zoom));
  const scale = coverScale(image, state.rotation, area) * zoom;
  const { width, height } = rotatedSize(image, state.rotation);
  const maxX = Math.max(0, (width * scale - area.width) / 2);
  const maxY = Math.max(0, (height * scale - area.height) / 2);
  return {
    rotation: state.rotation,
    zoom,
    x: Math.min(maxX, Math.max(-maxX, state.x)),
    y: Math.min(maxY, Math.max(-maxY, state.y)),
  };
}

/** Zoom em torno do centro da área: o ponto no centro continua no centro. */
export function zoomTo(state: CropState, zoom: number, image: Size, area: Size): CropState {
  const next = Math.min(MAX_ZOOM, Math.max(1, zoom));
  const ratio = next / state.zoom;
  return clampCrop({ ...state, zoom: next, x: state.x * ratio, y: state.y * ratio }, image, area);
}

/** Gira 90° no sentido horário, mantendo o zoom. */
export function rotateClockwise(state: CropState, image: Size, area: Size): CropState {
  const rotation = ((state.rotation + 90) % 360) as Rotation;
  return clampCrop({ ...state, rotation, x: state.y * -1, y: state.x }, image, area);
}
