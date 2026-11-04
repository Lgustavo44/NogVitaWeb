import { Meal } from '../../../shared/domain/nutrition-plan';
import { nextMealAt } from './patient-home';

const meal = (name: string, suggestedTime: string | null) => ({ name, suggestedTime }) as Meal;

describe('próxima refeição', () => {
  const meals = [meal('Jantar', '19:30:00'), meal('Café', '07:00:00'), meal('Lanche', null)];

  it('pega a próxima de hoje pelo horário, sem depender da ordem', () => {
    expect(nextMealAt(meals, '12:00')).toEqual({ meal: meals[0], tomorrow: false });
    expect(nextMealAt(meals, '07:00')).toEqual({ meal: meals[1], tomorrow: false });
  });

  it('depois da última, é a primeira de amanhã; sem horários, nenhuma', () => {
    expect(nextMealAt(meals, '21:00')).toEqual({ meal: meals[1], tomorrow: true });
    expect(nextMealAt([meal('Lanche', null)], '12:00')).toBeNull();
  });
});
