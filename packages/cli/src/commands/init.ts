import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import https from 'https';
import { DORA_VARIABLES_URL } from '../utils/const';
import { log } from '../utils/common';

type AliasMap = Record<string, string>;

const DORA_CONFIG_FILENAME = 'dora.config.json';

async function promptSetup() {
    const { usesAlias } = await inquirer.prompt([
        {
            name: 'usesAlias',
            type: 'confirm',
            message: 'Do you use import aliases like "@/components" in your project?',
            default: true,
        },
    ]);

    const { styleType } = await inquirer.prompt([
        {
            name: 'styleType',
            type: 'list',
            message: 'Which styling language do you prefer?',
            choices: ['scss', 'css'],
        },
    ]);

    const { globalPath } = await inquirer.prompt([
        {
            name: 'globalPath',
            type: 'input',
            message: `Enter the path for your global.${styleType} file (relative to root):`,
            default: `src/styles/global.${styleType}`,
        },
    ]);

    const baseFolders = {
        styles: './src/styles',
        utils: './src/lib/utils',
        components: './src/components',
        lib: './src/lib',
        hooks: './src/hooks',
    };

    return { usesAlias, styleType, globalPath, baseFolders };
}

function installScssIfNeeded() {
    try {
        require.resolve('sass');
        log('✅ SCSS is already installed.');
    } catch {
        log('Installing SCSS support...');
        execSync('npm install sass -D', { stdio: 'inherit' });
        log('✅ SCSS installed.');
    }
}

function writeDoraConfig(
    version: string,
    aliases: AliasMap,
    iconLibrary = 'lucide',
    styleLanguage: 'scss' | 'css' = 'css',
    globalStylePath: string
) {
    const config = {
        'dora-styles': version,
        aliases,
        iconLibrary,
        styleLanguage,
        globalStylePath,
    };

    fs.writeFileSync(DORA_CONFIG_FILENAME, JSON.stringify(config, null, 2));
    log(`✅ ${DORA_CONFIG_FILENAME} created.`);
}

function fetchVariables(): Promise<string> {
    return new Promise((resolve, reject) => {
        https
            .get(DORA_VARIABLES_URL, (res) => {
                let data = '';
                res.on('data', (chunk) => (data += chunk));
                res.on('end', () => resolve(data));
            })
            .on('error', reject);
    });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPackageVersion(): string {
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return pkg.version || '0.0.0';
}

export async function runInit() {
    log('Welcome to Dora Styles ✨');

    if (fs.existsSync(DORA_CONFIG_FILENAME)) {
        log(`⚠️ ${DORA_CONFIG_FILENAME} already exists. Skipping configuration.`);
        return;
    }

    const { usesAlias, styleType, globalPath, baseFolders } = await promptSetup();

    const aliases = {
        styles: usesAlias ? '@/styles' : baseFolders.styles,
        utils: usesAlias ? '@/lib/utils' : baseFolders.utils,
        components: usesAlias ? '@/components' : baseFolders.components,
        lib: usesAlias ? '@/lib' : baseFolders.lib,
        hooks: usesAlias ? '@/hooks' : baseFolders.hooks,
    };

    if (styleType === 'scss') {
        installScssIfNeeded();
    }

    const version = getPackageVersion();
    writeDoraConfig(version, aliases, 'lucide', styleType, globalPath);

    const absGlobalPath = path.resolve(globalPath);
    const globalDir = path.dirname(absGlobalPath);

    // Always put variables file inside src/styles/
    const stylesDir = path.resolve('src/styles');
    const variablesFileName = `variables.${styleType}`;
    const variablesFilePath = path.join(stylesDir, variablesFileName);

    if (!fs.existsSync(variablesFilePath)) {
        fs.mkdirSync(stylesDir, { recursive: true });
        const variables = await fetchVariables();
        fs.writeFileSync(
            variablesFilePath,
            `/* Dora Styles Variables */\n\n${variables}`
        );
        log(`✅ Created ${path.relative(process.cwd(), variablesFilePath)}`);
    } else {
        log(`ℹ️  ${variablesFileName} already exists in styles folder.`);
    }

    // Inject import line in global style sheet
    const relativeImport = path.relative(globalDir, variablesFilePath).replace(/\\/g, '/');
    const importLine = `@import './${relativeImport}';`;

    if (!fs.existsSync(absGlobalPath)) {
        fs.mkdirSync(globalDir, { recursive: true });
        fs.writeFileSync(
            absGlobalPath,
            `/* ${styleType.toUpperCase()} created by Dora Styles */\n${importLine}\n`
        );
        log(`✅ Created ${globalPath} and linked variables.`);
    } else {
        const content = fs.readFileSync(absGlobalPath, 'utf-8');
        if (!content.includes(importLine)) {
            const updated = `${importLine}\n${content}`;
            fs.writeFileSync(absGlobalPath, updated);
            log(`✅ Linked ${variablesFileName} to ${globalPath}`);
        } else {
            log(`ℹ️  ${variablesFileName} already imported in ${globalPath}`);
        }
    }

    log('🎉 Dora Styles setup complete!');
}
