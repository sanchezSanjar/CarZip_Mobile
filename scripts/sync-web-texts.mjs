// Copies the texts the app shares with the website (CarZip-next): enum labels and the server's error messages.
// Run from CarZip_Mobile after the website's texts change:  node scripts/sync-web-texts.mjs [path to CarZip-next]
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const web = process.argv[2] ?? '../CarZip-next';
const LANGUAGES = ['en', 'kr', 'ru', 'uz'];

for (const language of LANGUAGES) {
  const common = JSON.parse(readFileSync(join(web, 'public/locales', language, 'common.json'), 'utf8'));
  const shared = { enum: common.enum, errors: common.errors };
  writeFileSync(join('src/i18n/shared', `${language}.json`), JSON.stringify(shared, null, 2) + '\n');
  console.log(`${language}: ${Object.keys(shared.enum).length} enum labels, ${Object.keys(shared.errors).length} errors`);
}

// the server's English messages -> their keys in "errors" (the website's libs/serverMessages.ts)
const source = readFileSync(join(web, 'libs/serverMessages.ts'), 'utf8');
const map = Object.fromEntries([...source.matchAll(/^\s*'(.+?)': '(errors\.\w+)',$/gm)].map((m) => [m[1], m[2]]));
writeFileSync('src/i18n/shared/server-messages.json', JSON.stringify(map, null, 2) + '\n');
console.log(`server messages: ${Object.keys(map).length}`);
