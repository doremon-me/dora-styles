import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';
import { log, readDoraConfig } from '../utils/common';
import { DORA_STYLES_URL } from '../utils/const';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fetchStyleFromGitHub(stylePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(stylePath, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(`Error: Received status code ${res.statusCode}`);
                    }
                });
            })
            .on('error', reject);
    });
}

export async function runAddStyle(styleName?: string) {
    if (!styleName) {
        log('❌ Please specify a style name. Example: dora-styles add styles button');
        process.exit(1);
    }

    const config = readDoraConfig();

    if (!config) {
        log('❌ dora.config.json not found. Run `dora-styles init` first.');
        process.exit(1);
    }

    const { styleLanguage, globalStylePath, aliases } = config;
    const styleDir = path.resolve(aliases.styles); // e.g., src/styles
    const targetFileName = `${styleName}.${styleLanguage}`;
    const targetFile = path.join(styleDir, targetFileName);

    // Ensure styles folder exists
    fs.mkdirSync(styleDir, { recursive: true });

    // Build the GitHub URL
    const styleURL = `${DORA_STYLES_URL}/${styleLanguage}/${styleName}.${styleLanguage}`;

    try {
        const fileContent = await fetchStyleFromGitHub(styleURL);
        fs.writeFileSync(targetFile, fileContent);
        log(`✅ Style "${styleName}" added to ${targetFile}`);
    } catch (error) {
        log(`❌ Failed to fetch style "${styleName}" from GitHub.\n${error}`);
        process.exit(1);
    }

    // Link to global stylesheet
    const absGlobalPath = path.resolve(globalStylePath);
    let relativeImportPath = path
        .relative(path.dirname(absGlobalPath), targetFile)
        .replace(/\\/g, '/');

    if (!relativeImportPath.startsWith('.')) {
        relativeImportPath = './' + relativeImportPath;
    }

    const importStatement = `@import '${relativeImportPath}';`;

    let globalContent = '';
    if (fs.existsSync(absGlobalPath)) {
        globalContent = fs.readFileSync(absGlobalPath, 'utf-8');
    } else {
        fs.mkdirSync(path.dirname(absGlobalPath), { recursive: true });
    }

    if (!globalContent.includes(importStatement)) {
        const newContent = `${importStatement}\n${globalContent}`;
        fs.writeFileSync(absGlobalPath, newContent);
        log(`🔗 Linked "${styleName}" in ${globalStylePath}`);
    } else {
        log(`ℹ️ "${styleName}" already linked in ${globalStylePath}`);
    }
}
