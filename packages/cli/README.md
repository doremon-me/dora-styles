# Dora Styles CLI

A command-line tool to help you manage and scaffold components, hooks, and styles for the Dora Styles.

## Features
- Add new components, hooks, and styles to your project
- Initialize Dora Styles in your workspace
- Helpful commands and usage information

## Installation

You can install the CLI locally in your project:

```bash
npm install --save-dev @dora/styles-cli
```

Or use it globally:

```bash
npm install -g @dora/styles-cli
```

## Usage

Run the CLI using npx (if installed locally) or directly if installed globally:

```bash
npx dora-styles <command> [options]
```

or

```bash
dora-styles <command> [options]
```

### Available Commands

- `init` — Initialize Dora Styles in your project
- `addComponent <name>` — Add a new component
- `addHook <name>` — Add a new hook
- `addStyle <name>` — Add a new style (SCSS)
- `help` — Show help information
- `version` — Show CLI version

### Example

```bash
dora-styles addComponent Button
```

## Project Structure

This CLI is part of the Dora Styles monorepo, which includes:
- `apps/` — Example Next.js apps
- `packages/cli/` — The CLI tool
- `packages/library/` — Shared components, hooks, and styles

## Contributing

Feel free to open issues or pull requests to improve the CLI or add new features.

## License

MIT
