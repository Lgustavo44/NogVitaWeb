/** Fotos de evolução do paciente (o nutricionista só vê). */

export type PhotoAngle = 'Front' | 'Side' | 'Back';

/** Ordem da API e das vagas de cada dia. */
export const PHOTO_ANGLES: readonly PhotoAngle[] = ['Front', 'Side', 'Back'];

export const PHOTO_ANGLE_LABELS: Record<PhotoAngle, string> = {
  Front: 'Frente',
  Side: 'Lado',
  Back: 'Costas',
};

/** `url` é assinada e expira em minutos: recarregue a lista para ter URLs novas. */
export interface ProgressPhoto {
  id: string;
  /** Data sem hora (AAAA-MM-DD). */
  takenOn: string;
  angle: PhotoAngle;
  url: string;
}

/** Um dia com as fotos dele. A API manda do dia mais recente para o mais antigo. */
export interface ProgressPhotoDay {
  takenOn: string;
  photos: ProgressPhoto[];
}

export interface ProgressPhotoConsent {
  version: string;
  text: string;
  accepted: boolean;
  acceptedAtUtc: string | null;
}

export interface UploadProgressPhoto {
  file: File;
  takenOn: string;
  angle: PhotoAngle;
}

/** Limites da API: uma foto por ângulo por dia, até 90 no total, de hoje até 365 dias atrás. */
export const PROGRESS_PHOTOS_MAX = 90;
export const PROGRESS_PHOTO_MAX_DAYS_BACK = 365;

export type ProgressPhotosPerspective = 'patient' | 'nutritionist';

/** A foto daquele dia e ângulo, se houver. */
export function photoAt(
  days: readonly ProgressPhotoDay[],
  takenOn: string,
  angle: PhotoAngle,
): ProgressPhoto | null {
  return (
    days.find((day) => day.takenOn === takenOn)?.photos.find((photo) => photo.angle === angle) ??
    null
  );
}
