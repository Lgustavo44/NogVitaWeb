import { basalMetabolicRate } from './energy';

describe('basalMetabolicRate (Mifflin-St Jeor)', () => {
  it('soma 5 para o sexo masculino e subtrai 161 para o feminino', () => {
    // 10 × 80 + 6,25 × 180 − 5 × 30 = 1.775
    expect(basalMetabolicRate('Male', 80, 180, 30)).toBe(1780);
    expect(basalMetabolicRate('Female', 80, 180, 30)).toBe(1614);
  });

  it('arredonda para kcal inteiras', () => {
    // 10 × 72,5 + 6,25 × 165 − 5 × 31 = 1.601,25 → 1.440,25
    expect(basalMetabolicRate('Female', 72.5, 165, 31)).toBe(1440);
  });
});
