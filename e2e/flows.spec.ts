import { expect, test } from '@playwright/test';
import { createState, signIn, useFakeApi } from './support/fake-api';

/** Fluxos principais de cada papel, com a API simulada (dados fictícios). */

test.describe('entrada', () => {
  test('sem sessão, a área protegida manda para o login', async ({ page }) => {
    await useFakeApi(page, []);
    await page.goto('/paciente/plano');

    await expect(page).toHaveURL(/\/login/);
  });

  test('login só pelo teclado: senha errada avisa, senha certa abre a área', async ({ page }) => {
    await useFakeApi(page, ['Patient']);
    await page.goto('/login');

    await page.getByLabel('E-mail').focus();
    await page.keyboard.type('ana@exemplo.com');
    // A ordem do foco segue a visual: o link "Esqueci minha senha" fica acima do campo de senha.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Senha', { exact: true })).toBeFocused();
    await page.keyboard.type('senha-errada');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('alert')).toContainText('E-mail ou senha inválidos');

    await page.getByLabel('Senha', { exact: true }).fill('senha-correta');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/paciente$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('nutricionista', () => {
  test('monta o plano: refeição, alimento da busca, totais e ativação', async ({ page }) => {
    await signIn(page, ['Nutritionist']);
    await page.goto('/nutricionista/planos/pl1');
    await expect(page.getByRole('heading', { name: 'Plano de exemplo' })).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar refeição' }).click();
    const mealDialog = page.getByRole('dialog');
    await mealDialog.getByLabel('Nome da refeição').fill('Almoço');
    await mealDialog.getByLabel('Horário sugerido (opcional)').fill('12:30');
    await mealDialog.getByRole('button', { name: 'Adicionar refeição' }).click();
    await expect(page.getByRole('heading', { name: /Almoço/ })).toBeVisible();

    await page.getByRole('button', { name: 'Adicionar alimento em Almoço' }).click();
    const foodDialog = page.getByRole('dialog');
    await foodDialog.getByRole('searchbox').fill('arroz');
    await foodDialog.getByRole('button', { name: /Arroz, integral, cozido/ }).click();
    // Escolhido o alimento, o foco vai para a quantidade.
    await expect(foodDialog.getByLabel('Quantidade')).toBeFocused();
    await foodDialog.getByLabel('Quantidade').fill('150');
    await expect(foodDialog).toContainText('186 kcal');
    await foodDialog.getByRole('button', { name: 'Adicionar à refeição' }).click();

    const lunch = page
      .getByRole('article')
      .filter({ has: page.getByRole('heading', { name: /Almoço/ }) });
    await expect(lunch).toContainText('Arroz, integral, cozido');
    await expect(lunch).toContainText('150 g');
    await expect(page.getByRole('complementary', { name: 'Resumo do dia' })).toContainText(
      '186 kcal',
    );

    await page.getByRole('button', { name: 'Ativar plano' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Ativar plano' }).click();
    await expect(page.getByText('Ativo', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finalizar plano' })).toBeVisible();
  });

  test('o modal fecha com Esc e devolve o foco ao botão que o abriu', async ({ page }) => {
    await signIn(page, ['Nutritionist']);
    await page.goto('/nutricionista/planos/pl1');
    const opener = page.getByRole('button', { name: 'Adicionar refeição' });

    await opener.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');

    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});

test.describe('paciente', () => {
  test('vê o plano ativo e recebe por e-mail até o limite', async ({ page }) => {
    const state = createState();
    state.plan.status = 'Active';
    state.meals[0].foods.push(state.mealFood('f1', 150));
    state.emailsSent = 2;
    await signIn(page, ['Patient'], state);
    await page.goto('/paciente/plano');

    await expect(page.getByRole('heading', { name: 'Plano de exemplo' })).toBeVisible();
    await expect(page.getByText('Arroz, integral, cozido')).toBeVisible();
    await expect(page.getByLabel('Fonte dos dados nutricionais')).toContainText('TACO');

    const send = page.getByRole('button', { name: 'Receber por e-mail' });
    await send.click();
    await expect(page.getByText('Enviamos o PDF para o e-mail da sua conta.')).toBeVisible();
    await send.click();
    await expect(page.getByText(/3 vezes na última hora/)).toBeVisible();
  });

  test('sem plano ativo, mostra o estado vazio (o 404 não é erro)', async ({ page }) => {
    await signIn(page, ['Patient']);
    await page.goto('/paciente/plano');

    await expect(page.getByText('Você ainda não tem um plano ativo')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
  });
});

test.describe('admin', () => {
  test('desativa um paciente e o encontra no filtro de desativadas', async ({ page }) => {
    await signIn(page, ['Admin']);
    await page.goto('/admin/usuarios/p1');

    await page.getByRole('button', { name: 'Desativar conta' }).click();
    await expect(page.getByRole('alertdialog')).toContainText('o paciente some da lista');
    await page.getByRole('alertdialog').getByRole('button', { name: 'Desativar conta' }).click();
    await expect(page.getByRole('button', { name: 'Reativar conta' })).toBeVisible();

    await page.goto('/admin/usuarios');
    await page.getByRole('button', { name: 'Desativadas' }).click();
    await expect(page.getByRole('link', { name: /Ana Exemplo/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Carla Exemplo/ })).toHaveCount(0);
  });

  test('não oferece desativar a própria conta', async ({ page }) => {
    await signIn(page, ['Admin']);
    await page.goto('/admin/usuarios/a1');

    await expect(page.getByText('Você não pode desativar a própria conta.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Desativar conta' })).toHaveCount(0);
  });
});
