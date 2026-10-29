import AxeBuilder from '@axe-core/playwright';
import { Page, expect, test } from '@playwright/test';
import { Role, createState, signIn, useFakeApi } from './support/fake-api';

/** WCAG 2.0, 2.1 e 2.2, níveis A e AA (o mínimo do projeto). */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const PUBLIC = [
  '/login',
  '/cadastro',
  '/esqueci-senha',
  '/redefinir-senha',
  '/confirmar-email',
  '/sem-permissao',
  '/rota-que-nao-existe',
];

const AREAS: Record<Role, string[]> = {
  Patient: [
    '/paciente',
    '/paciente/plano',
    '/paciente/peso',
    '/paciente/encontrar-nutricionista',
    '/paciente/minhas-solicitacoes',
    '/paciente/meu-nutricionista',
    '/paciente/perfil',
  ],
  Nutritionist: [
    '/nutricionista',
    '/nutricionista/solicitacoes',
    '/nutricionista/pacientes',
    '/nutricionista/pacientes/p1',
    '/nutricionista/planos?paciente=p1',
    '/nutricionista/planos/pl1',
    '/nutricionista/alimentos?busca=arroz',
    '/nutricionista/alimentos/f1',
    '/nutricionista/alimentos/codigo-de-barras',
    '/nutricionista/perfil',
  ],
  Admin: [
    '/admin',
    '/admin/usuarios',
    '/admin/usuarios/p1',
    '/admin/nutricionistas',
    '/admin/pacientes',
    '/admin/alimentos',
  ],
};

async function audit(page: Page, url: string): Promise<void> {
  await page.goto(url);
  await page.locator('h1').first().waitFor();
  // Esqueletos e animações de entrada terminam antes da análise.
  await page.waitForTimeout(600);
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = results.violations.map(
    (violation) =>
      `${violation.id} (${violation.impact}): ${violation.help}\n` +
      violation.nodes
        .slice(0, 3)
        .map(
          (node) => `    ${node.target.join(' ')} → ${node.failureSummary?.split('\n')[1]?.trim()}`,
        )
        .join('\n'),
  );
  expect(summary, `Violações em ${url}`).toEqual([]);
}

test.describe('acessibilidade (axe, WCAG 2.2 AA)', () => {
  for (const url of PUBLIC) {
    test(`público ${url}`, async ({ page }) => {
      await useFakeApi(page, []);
      await audit(page, url);
    });
  }

  for (const [role, urls] of Object.entries(AREAS) as [Role, string[]][]) {
    for (const url of urls) {
      test(`${role} ${url}`, async ({ page }) => {
        const state = createState();
        // Com plano ativo, a tela do paciente mostra o plano inteiro (e não só o estado vazio).
        if (role === 'Patient') {
          state.plan.status = 'Active';
          state.meals[0].foods.push(state.mealFood('f1', 150), state.mealFood('f3', 170));
        }
        await signIn(page, [role], state);
        await audit(page, url);
      });
    }
  }

  test('modal aberto (adicionar alimento ao plano)', async ({ page }) => {
    await signIn(page, ['Nutritionist']);
    await page.goto('/nutricionista/planos/pl1');
    await page.getByRole('button', { name: /Adicionar alimento em Café da manhã/ }).click();
    await page.getByRole('dialog').getByRole('searchbox').fill('arroz');
    await expect(page.getByRole('dialog').getByText('Arroz, integral, cozido')).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(TAGS)
      .include('[role="dialog"]')
      .analyze();
    expect(results.violations.map((violation) => violation.id)).toEqual([]);
  });
});
