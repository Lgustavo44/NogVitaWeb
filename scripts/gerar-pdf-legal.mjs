/**
 * Gera public/legal/politica-de-privacidade.pdf e termos-de-uso.pdf a partir dos .md da API.
 *
 * Uso:  npm run legal:pdf -- <pasta docs/legal da NogVitaApi>
 *       (ex.: npm run legal:pdf -- ../NogVitaApi/docs/legal)
 *
 * Os textos ficam na API (docs/legal), e os PDFs são publicados aqui. Rode de novo sempre que um texto mudar.
 * Imprime com o Edge instalado (o mesmo dos testes e2e), pelo Playwright.
 */
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { marked } from 'marked';
import { chromium } from '@playwright/test';

const DOCUMENTS = {
  'politica-de-privacidade': 'Política de Privacidade',
  'termos-de-uso': 'Termos de Uso',
};

const CSS = `
@page { size: A4; margin: 18mm 18mm 20mm; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font: 10pt/1.55 "Segoe UI", Arial, sans-serif; color: #1D2A24; }
header { border-top: 6px solid #F28C28; padding-top: 14px; margin-bottom: 18px; display: flex; align-items: center; justify-content: space-between; }
header img { width: 150px; }
header .kind { font-size: 8pt; font-weight: 700; letter-spacing: .08em; color: #5B6B63; text-transform: uppercase; }
h1 { font-size: 20pt; line-height: 1.2; margin: 0 0 6px; }
h2 { font-size: 13pt; margin: 22px 0 8px; padding-left: 10px; border-left: 4px solid #F28C28; break-after: avoid; }
h3 { font-size: 11pt; margin: 16px 0 6px; break-after: avoid; }
p { margin: 0 0 8px; }
ul, ol { margin: 0 0 10px; padding-left: 20px; }
li { margin-bottom: 4px; }
li::marker { color: #F28C28; }
a { color: #C96A0E; text-decoration: none; }
blockquote { margin: 10px 0 14px; padding: 10px 14px; background: #FFF4E3; border-left: 4px solid #F28C28; break-inside: avoid; }
blockquote > :last-child { margin-bottom: 0; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 9pt; }
thead { display: table-header-group; }
th { background: #FFF4E3; text-align: left; padding: 6px 8px; }
td { padding: 6px 8px; border-bottom: 1px solid #E3E8E5; vertical-align: top; }
tr { break-inside: avoid; }
`;

const footer = (title) => `
  <div style="width: 100%; padding: 0 18mm; display: flex; justify-content: space-between; font: 8pt 'Segoe UI', Arial, sans-serif; color: #5B6B63;">
    <span>NogVita · ${title}</span>
    <span>Página <span class="pageNumber"></span> de <span class="totalPages"></span></span>
  </div>`;

const source = process.argv[2];
if (!source) {
  console.error(
    'Informe a pasta docs/legal da API. Ex.: npm run legal:pdf -- ../NogVitaApi/docs/legal',
  );
  process.exit(1);
}

const logo = await readFile(resolve('public/brand/logo.svg'));
const logoUrl = `data:image/svg+xml;base64,${logo.toString('base64')}`;
const browser = await chromium.launch({ channel: process.env['CI'] ? undefined : 'msedge' });

try {
  const page = await browser.newPage();

  for (const [name, title] of Object.entries(DOCUMENTS)) {
    const markdown = await readFile(join(source, `${name}.md`), 'utf8');
    // Os links entre os documentos apontam para os PDFs, e não para os .md.
    const body = marked.parse(markdown.replace(/\(([\w-]+)\.md\)/g, '($1.pdf)'));

    await page.setContent(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
      <title>${title} · NogVita</title><style>${CSS}</style></head>
      <body><header><img src="${logoUrl}" alt="NogVita"><span class="kind">${title}</span></header>${body}</body></html>`);

    const output = resolve('public/legal', `${name}.pdf`);
    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<span></span>',
      footerTemplate: footer(title),
      margin: { top: '18mm', bottom: '20mm', left: '18mm', right: '18mm' },
    });
    console.log(output);
  }
} finally {
  await browser.close();
}
