// Проверяет, что JSON-блоки с текстом (задания чек-листа, вопросы ЧАВО)
// не сломаны — пропущенная скобка/кавычка/запятая будет найдена ЗДЕСЬ,
// на этапе коммита, а не после того, как страница уже опустела у бабушек.
//
// Запускается автоматически GitHub Action'ом при каждом push.
// Ничего не публикует и не трогает сам сайт — только читает файлы и проверяет.

import { readFileSync } from 'node:fs';

const CHECKS = [
  { file: 'checklist.html', blockId: 'templateData' },
  { file: 'checklist.html', blockId: 'appConfig' },
  { file: 'index.html', blockId: 'faqTemplate' },
];

let hasError = false;

function extractBlock(html, blockId) {
  const marker = `id="${blockId}"`;
  const markerIndex = html.indexOf(marker);
  if (markerIndex === -1) return null;
  const openTagEnd = html.indexOf('>', markerIndex) + 1;
  const closeTagStart = html.indexOf('</script>', openTagEnd);
  if (openTagEnd <= 0 || closeTagStart === -1) return null;
  return { text: html.slice(openTagEnd, closeTagStart), offset: openTagEnd };
}

function describePosition(rawText, position) {
  const before = rawText.slice(0, position);
  const line = before.split('\n').length;
  const col = position - before.lastIndexOf('\n');
  const contextStart = Math.max(0, position - 40);
  const contextEnd = Math.min(rawText.length, position + 40);
  const snippet = rawText.slice(contextStart, contextEnd).replace(/\s+/g, ' ');
  return { line, col, snippet };
}

for (const { file, blockId } of CHECKS) {
  let html;
  try {
    html = readFileSync(file, 'utf8');
  } catch (error) {
    console.error(`❌ Не удалось открыть файл ${file}: ${error.message}`);
    hasError = true;
    continue;
  }

  const block = extractBlock(html, blockId);
  if (!block) {
    console.error(`❌ В файле ${file} не найден блок с id="${blockId}" (проверь, что он не переименован и не удалён).`);
    hasError = true;
    continue;
  }

  try {
    JSON.parse(block.text);
    console.log(`✅ ${file} → #${blockId}: JSON корректен`);
  } catch (error) {
    hasError = true;
    const match = /position (\d+)/.exec(error.message);
    console.error(`\n❌ ${file} → #${blockId}: ${error.message}`);
    if (match) {
      const position = Number(match[1]);
      const { line, col, snippet } = describePosition(block.text, position);
      console.error(`   Похоже на строку ${line}, столбец ${col} внутри этого блока.`);
      console.error(`   Текст рядом с ошибкой: ...${snippet}...`);
    }
    console.error('   Частые причины: пропущенная запятая между полями, лишняя запятая перед } или ], незакрытая кавычка.\n');
  }
}

if (hasError) {
  console.error('\nИтог: найдены поломанные JSON-блоки. Коммит принят, но сайт с этими данными не заработает — исправь и запушь ещё раз.');
  process.exit(1);
} else {
  console.log('\nИтог: все текстовые блоки целы, можно спокойно публиковать.');
}
