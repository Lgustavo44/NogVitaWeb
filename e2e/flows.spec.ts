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

test.describe('fotos de evolução', () => {
  test('paciente aceita o termo, envia uma foto e a vê na galeria', async ({ page }) => {
    const state = createState();
    state.progress.consentAccepted = false;
    state.progress.photos = [];
    await signIn(page, ['Patient'], state);
    await page.goto('/paciente/peso');

    await page.getByRole('button', { name: 'Aceitar e continuar' }).click();
    await page.getByRole('button', { name: 'Adicionar primeira foto' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: 'Costas' }).click();
    await dialog.locator('input[type="file"]').setInputFiles({
      name: 'costas.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4//r9fwAJGAPYrWWRxAAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await expect(dialog.getByRole('group', { name: 'Ajuste da foto de evolução' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Enviar foto' }).click();

    await expect(page.getByRole('button', { name: /Ver foto de costas de/ })).toBeVisible();
    await expect(page.getByText('1 de 90 fotos')).toBeVisible();
    // Foi o recorte (JPEG) que subiu, não o PNG original.
    expect(state.uploads.at(-1)?.toString('latin1')).toContain('Content-Type: image/jpeg');
  });

  test('foto de perfil: ajusta o recorte (arrastar e zoom) e envia o JPEG', async ({ page }) => {
    const state = createState();
    await signIn(page, ['Patient'], state);
    await page.goto('/paciente/perfil');

    await page.locator('app-profile-photo-card input[type="file"]').setInputFiles({
      name: 'eu.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP4//r9fwAJGAPYrWWRxAAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    const dialog = page.getByRole('dialog', { name: 'Ajustar foto de perfil' });
    const area = dialog.getByRole('group', { name: 'Ajuste da foto de perfil' });
    await expect(area).toBeVisible();

    // Zoom pela barra e pelo teclado, e arrasto com o mouse.
    await dialog.getByRole('button', { name: 'Aumentar zoom' }).click();
    await expect(dialog.getByRole('slider', { name: 'Zoom' })).toHaveAttribute(
      'aria-valuetext',
      '120%',
    );
    await area.focus();
    await page.keyboard.press('+');
    await expect(dialog.getByRole('slider', { name: 'Zoom' })).toHaveAttribute(
      'aria-valuetext',
      '130%',
    );
    const box = (await area.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 20, { steps: 4 });
    await page.mouse.up();

    await dialog.getByRole('button', { name: 'Salvar foto' }).click();
    await expect(dialog).toHaveCount(0);
    expect(state.uploads.at(-1)?.toString('latin1')).toContain('Content-Type: image/jpeg');
  });

  test('nutricionista vê as fotos do paciente, sem enviar nem apagar', async ({ page }) => {
    await signIn(page, ['Nutritionist']);
    await page.goto('/nutricionista/pacientes/p1');

    await expect(page.getByRole('button', { name: /Ver foto de frente de/ })).toHaveCount(2);
    await expect(page.getByRole('button', { name: /Adicionar foto/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Comparar' }).click();
    await expect(page.getByRole('dialog').getByRole('img')).toHaveCount(2);
  });
});

test.describe('anamnese e macros', () => {
  test('paciente responde a anamnese pendente e vê as respostas', async ({ page }) => {
    const state = createState();
    await signIn(page, ['Patient'], state);
    // O início avisa da anamnese pendente e leva direto a ela.
    await page.goto('/paciente');
    await expect(page.getByText('Você tem uma anamnese para responder')).toBeVisible();
    await page.getByRole('link', { name: 'Responder agora' }).click();
    await page.getByLabel(/Tem alguma alergia alimentar/).fill('Lactose');
    await page
      .getByRole('group', { name: /Pratica atividade física/ })
      .getByLabel('Sim')
      .check();
    await page.getByLabel('4 ou 5').check();
    await page.getByLabel('Água').check();
    await page.getByLabel('Café').check();
    await page.getByRole('button', { name: 'Enviar respostas' }).click();

    await expect(page.getByText('Respondida')).toBeVisible();
    await expect(page.getByText('Lactose')).toBeVisible();
    await expect(page.getByText('Água, Café')).toBeVisible();
    await page.goto('/paciente');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('Você tem uma anamnese para responder')).toHaveCount(0);
    expect(state.anamnesis.answers).toContainEqual({
      questionId: 'qc',
      text: null,
      yesNo: null,
      options: ['4 ou 5'],
    });
  });

  test('nutricionista libera os macros do plano para o paciente', async ({ page }) => {
    await signIn(page, ['Nutritionist']);
    await page.goto('/nutricionista/planos/pl1');

    const request = page.waitForRequest(
      (r) => r.url().endsWith('/patient-view') && r.method() === 'PUT',
    );
    await page.getByLabel(/O paciente vê proteínas, carboidratos e gorduras/).check();
    expect((await request).postDataJSON()).toEqual({ patientSeesMacros: true });
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
