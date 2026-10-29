import { Page, Route } from '@playwright/test';

/**
 * API simulada para os testes de ponta a ponta. Só dados fictícios (são dados de saúde: nada de
 * dados reais nem do staging). Cada teste recebe um estado novo, que os fluxos podem alterar.
 */

export type Role = 'Patient' | 'Nutritionist' | 'Admin';

const iso = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const TACO = 'Tabela Brasileira de Composição de Alimentos (TACO), 4ª edição, NEPA/UNICAMP.';
const OFF = 'Dados do Open Food Facts (openfoodfacts.org), licença ODbL.';

function food(
  id: string,
  name: string,
  kcal: number,
  p: number,
  c: number,
  f: number,
  source = 'Taco',
) {
  return {
    id,
    name,
    brand: source === 'Taco' ? null : 'Marca Exemplo',
    barcode: source === 'Taco' ? null : '7891000315507',
    category: source === 'Taco' ? 'Cereais e derivados' : null,
    source,
    sourceReference: id,
    isActive: true,
    energyKcalPer100g: kcal,
    proteinPer100g: p,
    carbohydratePer100g: c,
    fatPer100g: f,
    fiberPer100g: source === 'Taco' ? 1.5 : null,
    sodiumMgPer100g: 5,
    attribution: source === 'Taco' ? TACO : OFF,
    isComplete: source === 'Taco',
  };
}

const total = (value: number, isComplete = true) => ({ value, isComplete });

function totals(foods: { portion: Record<string, number | null> }[]) {
  const sum = (key: string) => foods.reduce((acc, item) => acc + (item.portion[key] ?? 0), 0);
  return {
    energyKcal: total(sum('energyKcal')),
    protein: total(sum('protein')),
    carbohydrate: total(sum('carbohydrate')),
    fat: total(sum('fat')),
    fiber: total(sum('fiber')),
    sodiumMg: total(sum('sodiumMg')),
  };
}

export function createState() {
  const foods = [
    food('f1', 'Arroz, integral, cozido', 124, 2.6, 25.8, 1),
    food('f2', 'Frango, peito, sem pele, grelhado', 159, 32, 0, 2.5),
    food('f3', 'Iogurte natural desnatado', 41, 4.2, 5.9, 0, 'OpenFoodFacts'),
  ];
  const plan = {
    id: 'pl1',
    patientId: 'p1',
    patientName: 'Ana Exemplo',
    nutritionistId: 'n1',
    nutritionistName: 'Carla Exemplo',
    name: 'Plano de exemplo',
    description: 'Foco em proteína distribuída ao longo do dia.',
    startDate: iso(10),
    endDate: null as string | null,
    status: 'Draft',
    createdAt: new Date().toISOString(),
    targetEnergyKcal: 2000 as number | null,
    targetProteinGrams: 120 as number | null,
    targetCarbohydrateGrams: null as number | null,
    targetFatGrams: null as number | null,
  };
  type MealFood = ReturnType<typeof food> & {
    foodId: string;
    quantityInGrams: number;
    snapshotTakenAtUtc: string;
    portion: Record<string, number | null>;
  };
  const meals: {
    id: string;
    name: string;
    notes: string | null;
    suggestedTime: string | null;
    outsideRoutine: boolean | null;
    foods: MealFood[];
  }[] = [
    {
      id: 'm1',
      name: 'Café da manhã',
      notes: 'Beber água ao acordar.',
      suggestedTime: '07:00:00',
      outsideRoutine: false,
      foods: [],
    },
  ];
  return {
    foods,
    plan,
    meals,
    emailsSent: 0,
    users: [
      {
        id: 'p1',
        name: 'Ana Exemplo',
        email: 'ana@exemplo.com',
        isActive: true,
        isAdmin: false,
        isPatient: true,
        isNutritionist: false,
        createdAt: '2026-10-20T10:00:00Z',
      },
      {
        id: 'n1',
        name: 'Carla Exemplo',
        email: 'carla@exemplo.com',
        isActive: true,
        isAdmin: false,
        isPatient: false,
        isNutritionist: true,
        createdAt: '2026-10-10T10:00:00Z',
      },
      {
        id: 'a1',
        name: 'Admin Exemplo',
        email: 'admin@exemplo.com',
        isActive: true,
        isAdmin: true,
        isPatient: false,
        isNutritionist: false,
        createdAt: '2026-10-01T10:00:00Z',
      },
    ],
    mealFood(foodId: string, grams: number): MealFood {
      const base = foods.find((item) => item.id === foodId)!;
      const scale = (value: number | null) => (value === null ? null : (value * grams) / 100);
      return {
        ...base,
        id: `mf-${foodId}-${grams}`,
        foodId,
        quantityInGrams: grams,
        snapshotTakenAtUtc: new Date().toISOString(),
        portion: {
          energyKcal: scale(base.energyKcalPer100g),
          protein: scale(base.proteinPer100g),
          carbohydrate: scale(base.carbohydratePer100g),
          fat: scale(base.fatPer100g),
          fiber: scale(base.fiberPer100g),
          sodiumMg: scale(base.sodiumMgPer100g),
        },
      };
    },
    detail() {
      const fullMeals = meals.map((meal, index) => ({
        ...meal,
        order: index + 1,
        totals: totals(meal.foods),
      }));
      const day = totals(meals.flatMap((meal) => meal.foods));
      return {
        plan,
        meals: fullMeals,
        dailyTotals: day,
        target: plan.targetEnergyKcal
          ? {
              energyKcal: {
                target: plan.targetEnergyKcal,
                planned: day.energyKcal.value,
                difference: day.energyKcal.value - plan.targetEnergyKcal,
                isComplete: true,
              },
              protein: plan.targetProteinGrams
                ? {
                    target: plan.targetProteinGrams,
                    planned: day.protein.value,
                    difference: day.protein.value - plan.targetProteinGrams,
                    isComplete: true,
                  }
                : null,
              carbohydrate: null,
              fat: null,
            }
          : null,
      };
    },
  };
}

export type FakeState = ReturnType<typeof createState>;

const paged = <T>(items: T[]) => ({ items, page: 1, pageSize: 20, totalItems: items.length });

function routeFor(roles: Role[], state: FakeState) {
  return async (route: Route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api/v1', '');
    const json = (body: unknown, status = 200) => route.fulfill({ status, json: body });
    const empty = (status = 204) => route.fulfill({ status, body: '' });

    if (path === '/auth/login') {
      const body = request.postDataJSON() as { password: string };
      return body.password === 'senha-correta'
        ? json(tokens())
        : json({ title: 'E-mail ou senha inválidos.', status: 401 }, 400);
    }
    if (path === '/auth/me') return json({ userId: roles.includes('Admin') ? 'a1' : 'u1', roles });
    if (path === '/auth/logout') return empty();

    // Paciente
    if (path === '/patients/me')
      return json({
        userId: 'p1',
        name: 'Ana Exemplo',
        email: 'ana@exemplo.com',
        cpf: '529.982.247-25',
        birthDate: '1995-04-20',
        age: 31,
        biologicalSex: 'Female',
        heightInCm: 165,
        goal: 'WeightLoss',
        wakeUpTime: '07:00:00',
        bedTime: '23:00:00',
        trainingTime: null,
      });
    if (path === '/patients/me/care-relationship')
      return json({
        relationshipId: 'r1',
        nutritionistId: 'n1',
        nutritionistName: 'Carla Exemplo',
        crnRegion: 3,
        crnNumber: '12345',
        bio: 'Nutricionista esportiva.',
        startedAtUtc: '2026-10-01T10:00:00Z',
      });
    if (path === '/patients/me/nutritionist-requests') return json(paged([]));
    if (path === '/patients/me/weight-records' || path.endsWith('/weight-records'))
      return json(
        paged(
          [0, 7, 14, 21].map((d, i) => ({
            id: `w${i}`,
            recordedOn: iso(d),
            weightKg: 70 + i * 0.4,
            notes: null,
            recordedByPatient: true,
            recordedByName: 'Ana Exemplo',
          })),
        ),
      );
    if (path === '/patients/me/nutrition-plans/current')
      return state.plan.status === 'Active'
        ? json(state.detail())
        : json({ title: 'Você não tem um plano ativo.' }, 404);
    if (path === '/patients/me/nutrition-plans')
      return json(paged(state.plan.status === 'Active' ? [state.plan] : []));
    if (path.endsWith('/pdf/email')) {
      state.emailsSent++;
      return state.emailsSent > 3 ? json({ title: 'Muitas tentativas.' }, 429) : empty();
    }
    if (path === '/nutritionists')
      return json(
        paged([
          {
            userId: 'n1',
            name: 'Carla Exemplo',
            crnRegion: 3,
            crnNumber: '12345',
            bio: 'Nutricionista esportiva.',
          },
        ]),
      );

    // Nutricionista
    if (path === '/nutritionists/me')
      return json({
        userId: 'n1',
        name: 'Carla Exemplo',
        email: 'carla@exemplo.com',
        crnRegion: 3,
        crnNumber: '12345',
        bio: null,
      });
    if (path === '/nutritionists/me/requests') return json(paged([]));
    if (path === '/nutritionists/me/patients')
      return json(
        paged([
          {
            patientId: 'p1',
            name: 'Ana Exemplo',
            goal: 'WeightLoss',
            startedAtUtc: '2026-10-01T10:00:00Z',
          },
        ]),
      );
    if (path === '/nutritionists/me/patients/p1')
      return json({
        patientId: 'p1',
        name: 'Ana Exemplo',
        age: 31,
        biologicalSex: 'Female',
        heightInCm: 165,
        goal: 'WeightLoss',
        wakeUpTime: '07:00:00',
        bedTime: '23:00:00',
        trainingTime: null,
        bodyMassIndex: 25.7,
        latestWeight: { weightKg: 70, recordedOn: iso(0) },
      });
    if (path === '/nutritionists/me/patients/p1/nutrition-plans') return json(paged([state.plan]));
    const planPath = '/nutritionists/me/nutrition-plans/pl1';
    if (path === planPath) return json(state.detail());
    if (path === `${planPath}/activate`) {
      state.plan.status = 'Active';
      return empty();
    }
    if (path === `${planPath}/meals` && method === 'POST') {
      const body = request.postDataJSON() as {
        name: string;
        notes: string | null;
        suggestedTime: string | null;
      };
      const id = `m${state.meals.length + 1}`;
      state.meals.push({
        id,
        name: body.name,
        notes: body.notes,
        suggestedTime: body.suggestedTime ? `${body.suggestedTime}:00` : null,
        outsideRoutine: false,
        foods: [],
      });
      return json({ id }, 201);
    }
    const addFood = path.match(/^\/nutritionists\/me\/nutrition-plans\/pl1\/meals\/(\w+)\/foods$/);
    if (addFood && method === 'POST') {
      const body = request.postDataJSON() as { foodId: string; quantityInGrams: number };
      const item = state.mealFood(body.foodId, body.quantityInGrams);
      state.meals.find((meal) => meal.id === addFood[1])!.foods.push(item);
      return json({ id: item.id }, 201);
    }

    // Alimentos
    if (path === '/foods' || path === '/admin/foods') {
      const term = (url.searchParams.get('search') ?? '').toLowerCase();
      return json(paged(state.foods.filter((item) => item.name.toLowerCase().includes(term))));
    }
    const foodDetail = path.match(/^\/foods\/(f\d)$/);
    if (foodDetail) return json(state.foods.find((item) => item.id === foodDetail[1]));

    // Admin
    if (path === '/admin/users') {
      const active = url.searchParams.get('isActive');
      const items = state.users.filter(
        (user) => active === null || String(user.isActive) === active,
      );
      return json({ ...paged(items), pageSize: Number(url.searchParams.get('pageSize') ?? 20) });
    }
    if (path === '/admin/patients')
      return json(
        paged([
          {
            id: 'p1',
            name: 'Ana Exemplo',
            email: 'ana@exemplo.com',
            isActive: state.users[0].isActive,
            birthDate: '1995-04-20',
            goal: 'WeightLoss',
            createdAt: '2026-10-20T10:00:00Z',
          },
        ]),
      );
    if (path === '/admin/nutritionists')
      return json(
        paged([
          {
            id: 'n1',
            name: 'Carla Exemplo',
            email: 'carla@exemplo.com',
            isActive: true,
            crnRegion: 3,
            crnNumber: '12345',
            isProfileActive: true,
            createdAt: '2026-10-10T10:00:00Z',
          },
        ]),
      );
    const adminUser = path.match(/^\/admin\/users\/(\w+)(\/(activate|deactivate))?$/);
    if (adminUser) {
      const user = state.users.find((item) => item.id === adminUser[1]);
      if (!user) return json({ title: 'Usuário não encontrado.' }, 404);
      if (adminUser[3]) {
        user.isActive = adminUser[3] === 'activate';
        return empty();
      }
      return json({
        id: user.id,
        name: user.name,
        email: user.email,
        cpf: '529.982.247-25',
        isActive: user.isActive,
        isAdmin: user.isAdmin,
        patient: user.isPatient
          ? {
              birthDate: '1995-04-20',
              biologicalSex: 'Female',
              heightInCm: 165,
              goal: 'WeightLoss',
            }
          : null,
        nutritionist: user.isNutritionist
          ? { crnRegion: 3, crnNumber: '12345', isActive: true }
          : null,
        createdAt: user.createdAt,
        updatedAt: null,
      });
    }

    return json({ title: 'Não encontrado (API simulada).' }, 404);
  };
}

function tokens() {
  return {
    accessToken: 'token-de-teste',
    accessTokenExpiresAtUtc: new Date(Date.now() + 3600e3).toISOString(),
    refreshToken: 'refresh-de-teste',
    refreshTokenExpiresAtUtc: new Date(Date.now() + 86400e3).toISOString(),
  };
}

/** Liga a API simulada (sem sessão). */
export async function useFakeApi(
  page: Page,
  roles: Role[],
  state = createState(),
): Promise<FakeState> {
  await page.route('**/api/v1/**', routeFor(roles, state));
  await page.route('**/health', (route) => route.fulfill({ status: 200, body: 'ok' }));
  return state;
}

/** Já entra com a sessão aberta (pula a tela de login). */
export async function signIn(page: Page, roles: Role[], state = createState()): Promise<FakeState> {
  await page.addInitScript((session) => {
    sessionStorage.setItem('nogvita-session', JSON.stringify(session));
  }, tokens());
  return useFakeApi(page, roles, state);
}
