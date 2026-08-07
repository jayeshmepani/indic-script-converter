import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const destDir = path.resolve(root, '../shared/verification-output');
const jobs = [
    ['latn-iast-to-deva-test.js', 'latn_iast_to_deva_output.txt'],
    ['latn-iast-to-gujr-test.js', 'latn_iast_to_gujr_output.txt'],
    ['latn-iast-transcription-test.js', 'latn_iast_transcription_output.txt'],
    ['deva-to-latn-iast-test.js', 'deva_to_latn_iast_output.txt'],
    ['gujr-to-latn-iast-test.js', 'gujr_to_latn_iast_output.txt'],
    ['deva-to-gujr-test.js', 'deva_to_gujr_output.txt'],
    ['gujr-to-deva-test.js', 'gujr_to_deva_output.txt'],
];

for (const [script, output] of jobs) {
    const result = spawnSync(process.execPath, [path.join(here, script)], {
        cwd: root,
        encoding: 'utf8',
    });
    if (result.status !== 0) {
        process.stderr.write(result.stderr);
        process.exit(result.status ?? 1);
    }
    fs.mkdirSync(destDir, { recursive: true });
    fs.writeFileSync(path.join(destDir, output), result.stdout, 'utf8');
    console.log(`generated ${output} in shared/verification-output/`);
}
