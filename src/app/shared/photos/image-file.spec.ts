import { IMAGE_MAX_BYTES, IMAGE_SOURCE_MAX_BYTES, imageFileError } from './image-file';

const file = (type: string, size = 1000) => new File([new Uint8Array(size)], 'foto', { type });

describe('imageFileError', () => {
  it('aceita JPEG, PNG e WebP até 5 MB', () => {
    expect(imageFileError(file('image/jpeg'))).toBeNull();
    expect(imageFileError(file('image/png'))).toBeNull();
    expect(imageFileError(file('image/webp', IMAGE_MAX_BYTES))).toBeNull();
  });

  it('recusa outros formatos (HEIC, GIF, PDF)', () => {
    expect(imageFileError(file('image/heic'))).toBe('Envie uma imagem JPEG, PNG ou WebP.');
    expect(imageFileError(file('image/gif'))).toBe('Envie uma imagem JPEG, PNG ou WebP.');
    expect(imageFileError(file('application/pdf'))).toBe('Envie uma imagem JPEG, PNG ou WebP.');
  });

  it('recusa acima do limite (5 MB no envio direto, 25 MB antes do recorte)', () => {
    expect(imageFileError(file('image/jpeg', IMAGE_MAX_BYTES + 1))).toBe(
      'A imagem passa de 5 MB. Escolha uma foto menor.',
    );
    expect(
      imageFileError(file('image/jpeg', IMAGE_MAX_BYTES + 1), IMAGE_SOURCE_MAX_BYTES),
    ).toBeNull();
    expect(
      imageFileError(file('image/jpeg', IMAGE_SOURCE_MAX_BYTES + 1), IMAGE_SOURCE_MAX_BYTES),
    ).toBe('A imagem passa de 25 MB. Escolha uma foto menor.');
  });
});
