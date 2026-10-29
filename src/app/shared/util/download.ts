/**
 * Salva um arquivo que veio da API (ex.: PDF). Rotas com token não podem ser abertas por link
 * direto (dariam 401), então o arquivo vem pelo HttpClient e é salvo por aqui.
 */
export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** "Plano de hipertrofia" → "plano-de-hipertrofia". */
export function slugify(text: string, fallback = 'arquivo'): string {
  return (
    text
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || fallback
  );
}
