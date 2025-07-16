export function printHelp() {
    console.log(`
\x1b[36mDora Styles CLI\x1b[0m

Usage:
  npx dora-styles@latest <command> [options]

Commands:
  init         Set up Dora Styles in your project
  help         Show this help message

Examples:
  npx dora-styles@latest init
  npx dora-styles@latest --help

Options:
  --help       Show help
  --version    Show CLI version
`);
}