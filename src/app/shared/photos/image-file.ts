/** O que a API aceita (ela confere o conteúdo, não a extensão). */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Para o `accept` do seletor: no iPhone, faz o sistema converter HEIC em JPEG. */
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',');
/** Limite do envio na API (acima disso ela responde 413). */
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
/**
 * Limite da foto escolhida quando ela passa pelo recorte: o que vai para a API é o recorte
 * em JPEG, bem menor. 25 MB cobre as fotos de celular sem pesar demais na memória.
 */
export const IMAGE_SOURCE_MAX_BYTES = 25 * 1024 * 1024;

/** Confere tipo e tamanho. Devolve a mensagem de erro, ou null se a imagem servir. */
export function imageFileError(file: File, maxBytes = IMAGE_MAX_BYTES): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Envie uma imagem JPEG, PNG ou WebP.';
  }
  if (file.size > maxBytes) {
    return `A imagem passa de ${Math.round(maxBytes / 1024 / 1024)} MB. Escolha uma foto menor.`;
  }
  return null;
}

/** Primeiro arquivo de um <input type="file"> (e limpa o campo para dar para escolher o mesmo de novo). */
export function takeFile(event: Event): File | null {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0] ?? null;
  input.value = '';
  return file;
}
