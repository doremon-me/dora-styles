import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { log, readDoraConfig } from '../utils/common';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_ROOT = path.resolve(__dirname, '../../');

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

    // Resolve full absolute path to styles folder from aliases
    const stylesDir = path.resolve(aliases.styles); // Typically src/styles
    const styleFileName = `${styleName}.${styleLanguage}`;
    const targetFile = path.join(stylesDir, styleFileName);

    // CLI source file
    const sourceFile = path.join(
        CLI_ROOT,
        `library/styles/${styleLanguage}/${styleFileName}`
    );

    if (!fs.existsSync(sourceFile)) {
        log(`❌ Style "${styleName}" not found in Dora styles library.`);
        process.exit(1);
    }

    // Ensure styles folder exists
    fs.mkdirSync(stylesDir, { recursive: true });

    // Copy the style file to styles folder
    const fileContent = fs.readFileSync(sourceFile, 'utf-8');
    fs.writeFileSync(targetFile, fileContent);
    log(`✅ Style "${styleName}" added to ${path.relative(process.cwd(), targetFile)}`);

    // Prepare linking into global stylesheet
    const absGlobalPath = path.resolve(globalStylePath);
    const relativeImportPath = path.relative(path.dirname(absGlobalPath), targetFile).replace(/\\/g, '/');
    const importStatement = `@import './${relativeImportPath}';`;

    let globalContent = '';
    if (fs.existsSync(absGlobalPath)) {
        globalContent = fs.readFileSync(absGlobalPath, 'utf-8');
    } else {
        // Ensure directory exists
        fs.mkdirSync(path.dirname(absGlobalPath), { recursive: true });
    }

    // Inject import if not already present
    if (!globalContent.includes(importStatement)) {
        const updatedContent = `${importStatement}\n${globalContent}`;
        fs.writeFileSync(absGlobalPath, updatedContent);
        log(`🔗 Linked "${styleName}" to ${globalStylePath}`);
    } else {
        log(`ℹ️ "${styleName}" already linked in ${globalStylePath}`);
    }
}
