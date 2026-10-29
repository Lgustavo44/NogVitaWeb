/**
 * Datas sem hora (AAAA-MM-DD) no fuso de quem usa o app.
 * Não use `toISOString()` para isso: ele converte para UTC, e depois das 21h no horário de
 * Brasília já é o dia seguinte (a API recusaria um registro "no futuro").
 */
export function localIsoDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysAgoIsoDate(days: number, from: Date = new Date()): string {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return localIsoDate(date);
}

/** "2026-10-29" → Date local (meia-noite), sem o deslocamento de fuso de `new Date(iso)`. */
export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(year, month - 1, day);
}
