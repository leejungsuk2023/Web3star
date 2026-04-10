import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const p = join(root, 'docs', 'PLAY_INTERNAL_TEST_CHECKLIST.txt');
console.log(readFileSync(p, 'utf8'));
