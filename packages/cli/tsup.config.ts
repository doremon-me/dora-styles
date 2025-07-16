import { defineConfig } from 'tsup';

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'node20', // or 'es2020'
    outDir: 'dist',
    splitting: false,
    sourcemap: false,
    clean: true,
    shims: false,
});
