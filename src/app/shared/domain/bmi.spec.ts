import { bmiClassification } from './bmi';

describe('bmiClassification', () => {
  it('usa os pontos de corte da OMS para adultos de 20 a 59 anos', () => {
    expect(bmiClassification(18.4, 30)).toBe('Baixo peso');
    expect(bmiClassification(18.5, 30)).toBe('Eutrofia');
    expect(bmiClassification(24.9, 20)).toBe('Eutrofia');
    expect(bmiClassification(25, 59)).toBe('Sobrepeso');
    expect(bmiClassification(30, 40)).toBe('Obesidade grau I');
    expect(bmiClassification(35, 40)).toBe('Obesidade grau II');
    expect(bmiClassification(40, 40)).toBe('Obesidade grau III');
  });

  it('usa Lipschitz (SISVAN) a partir dos 60 anos', () => {
    expect(bmiClassification(21.9, 60)).toBe('Baixo peso');
    expect(bmiClassification(22, 60)).toBe('Eutrofia');
    expect(bmiClassification(26.9, 75)).toBe('Eutrofia');
    expect(bmiClassification(27, 75)).toBe('Sobrepeso');
    expect(bmiClassification(32, 75)).toBe('Sobrepeso');
  });

  it('não classifica abaixo de 20 anos (avaliação por percentil da idade)', () => {
    expect(bmiClassification(29.1, 19)).toBeNull();
  });

  it('classifica o valor como aparece na tela, com uma casa', () => {
    expect(bmiClassification(24.96, 30)).toBe('Sobrepeso');
    expect(bmiClassification(24.94, 30)).toBe('Eutrofia');
  });
});
