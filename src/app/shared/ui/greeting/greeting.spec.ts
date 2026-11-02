import { dayPeriod, greetingText } from './greeting';

const at = (hour: number, minute = 0) => new Date(2026, 10, 2, hour, minute);

describe('saudação pelo período do dia', () => {
  it('manhã das 5h às 11h59, tarde das 12h às 17h59, noite no resto', () => {
    expect(dayPeriod(at(4, 59))).toBe('night');
    expect(dayPeriod(at(5))).toBe('morning');
    expect(dayPeriod(at(11, 59))).toBe('morning');
    expect(dayPeriod(at(12))).toBe('afternoon');
    expect(dayPeriod(at(17, 59))).toBe('afternoon');
    expect(dayPeriod(at(18))).toBe('night');
    expect(dayPeriod(at(0))).toBe('night');
  });

  it('usa o primeiro nome quando ele já chegou', () => {
    expect(greetingText('morning', 'Ana')).toBe('Bom dia, Ana');
    expect(greetingText('afternoon', null)).toBe('Boa tarde');
    expect(greetingText('night', 'Rui')).toBe('Boa noite, Rui');
  });
});
