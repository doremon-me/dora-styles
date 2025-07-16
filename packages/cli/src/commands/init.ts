#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import https from 'https';
import { DORA_VARIABLES_URL } from '../utils/const';

type AliasMap = Record<string, string>;

const DORA_CONFIG_FILENAME = 'dora.config.json';

function log(msg: string) {
    console.log(`\x1b[36m[📦 Dora Styles]\x1b[0m ${msg}`);
}

function getDefaultAliases(): AliasMap {
    return {
        styles: "@/styles",
        utils: "@/lib/utils",
        components: "@/components",
        lib: "@/lib",
        hooks: "@/hooks"
    };
}

async function promptSetup() {
    const { styleType } = await inquirer.prompt([
        {
            name: 'styleType',
            type: 'list',
            message: 'Which styling language do you prefer?',
            choices: ['scss', 'css']
        }
    ]);

    const { globalPath } = await inquirer.prompt([
        {
            name: 'globalPath',
            type: 'input',
            message: `Enter the path for your global.${styleType} file (relative to root):`,
            default: `src/styles/global.${styleType}`
        }
    ]);

    return { styleType, globalPath };
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
        globalStylePath
    };

    fs.writeFileSync(DORA_CONFIG_FILENAME, JSON.stringify(config, null, 2));
    log(`✅ ${DORA_CONFIG_FILENAME} created.`);
}

function fetchVariables(): Promise<string> {
    return new Promise((resolve, reject) => {
        https.get(DORA_VARIABLES_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getPackageVersion(): string {
    const packageJsonPath = path.resolve(__dirname, "../package.json");
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return pkg.version || '0.0.0';
}

export async function runInit() {
    log('Welcome to Dora Styles ✨');

    // Skip if already configured
    if (fs.existsSync(DORA_CONFIG_FILENAME)) {
        log(`⚠️ ${DORA_CONFIG_FILENAME} already exists. Skipping configuration.`);
        return;
    }

    const aliases = getDefaultAliases();

    const { styleType, globalPath } = await promptSetup();

    if (styleType === 'scss') {
        installScssIfNeeded();
    }

    const version = getPackageVersion();
    writeDoraConfig(version, aliases, 'lucide', styleType, globalPath);

    // Optional: Create global style file
    const absPath = path.resolve(globalPath);
    if (!fs.existsSync(absPath)) {
        fs.mkdirSync(path.dirname(absPath), { recursive: true });
        const variables = await fetchVariables();
        fs.writeFileSync(absPath, `/* ${styleType.toUpperCase()} file created by Dora Styles */\n\n${variables}`);
        log(`✅ Created ${globalPath} with Dora variables.`);
    }

    log('🎉 Dora Styles setup complete!');
}