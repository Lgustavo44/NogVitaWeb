/**
 * Classificação do IMC pela idade:
 * - 20 a 59 anos: OMS (1995/2000);
 * - 60 anos ou mais: Lipschitz (1994), o ponto de corte que o SISVAN usa para idosos.
 * Abaixo de 20 anos o IMC se avalia por percentil/escore-z da idade, então não há rótulo.
 * Classifica o valor arredondado em uma casa, o mesmo que aparece na tela.
 */
export function bmiClassification(bmi: number, ageInYears: number): string | null {
  if (!Number.isFinite(bmi) || ageInYears < 20) return null;
  const value = Math.round(bmi * 10) / 10;

  if (ageInYears >= 60) {
    if (value < 22) return 'Baixo peso';
    if (value < 27) return 'Eutrofia';
    return 'Sobrepeso';
  }

  if (value < 18.5) return 'Baixo peso';
  if (value < 25) return 'Eutrofia';
  if (value < 30) return 'Sobrepeso';
  if (value < 35) return 'Obesidade grau I';
  if (value < 40) return 'Obesidade grau II';
  return 'Obesidade grau III';
}
