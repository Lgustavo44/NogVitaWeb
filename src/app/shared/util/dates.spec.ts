import { daysAgoIsoDate, localIsoDate, parseIsoDate } from './dates';

describe('datas sem hora', () => {
  it('usa a data local, não a UTC (às 22h em Brasília ainda é o mesmo dia)', () => {
    const lateEvening = new Date(2026, 9, 29, 22, 30);

    expect(localIsoDate(lateEvening)).toBe('2026-10-29');
  });

  it('volta N dias atravessando o mês', () => {
    expect(daysAgoIsoDate(30, new Date(2026, 9, 29))).toBe('2026-09-29');
  });

  it('lê AAAA-MM-DD como meia-noite local', () => {
    const date = parseIsoDate('2026-01-05');

    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([
      2026, 0, 5, 0,
    ]);
  });
});
