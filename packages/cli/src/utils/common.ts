import fs from 'fs';
import path from 'path';

export function log(msg: string) {
    console.log(`\x1b[36m[📦 Dora Styles]\x1b[0m ${msg}`);
}

export function readDoraConfig() {
    const configPath = path.resolve(process.cwd(), 'dora.config.json');

    if (!fs.existsSync(configPath)) return null;

    return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
}
