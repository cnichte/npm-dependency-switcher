# # npm-dependency-switcher

Small CLI tool to switch npm dependencies between local file paths and regular npm versions.
Typischer Use-Case:

- In **Dev mode**, libraries from local repositories (`file:../…`) are used.
- In **Prod mode**, the same packages are integrated via the **current version from the npm registry** (`^1.0.4` etc.).

The tool:

- adapts your `package.json`
- optionally cleans up `node_modules` + `package-lock.json`
- then automatically executes `npm install`

## Installation

```bash
npm install --save-dev npm-dependency-switcher
# oder
yarn add --dev npm-dependency-switcher
# oder
pnpm add -D npm-dependency-switcher
```

## Setup

Create a file named `npm-dependency-switcher.config.json` in the project root.

```json
{
  "packages": [
    {
      "name": "sftp-push-sync",
      "localPath": "../../../sftp-push-sync/production/sftp-push-sync"
    },
    {
      "name": "hugo-update-lastmod",
      "localPath": "../../../hugo-update-lastmod/production/hugo-update-lastmod"
    },
    {
      "name": "hugo-clean-cache",
      "localPath": "../../../hugo-clean-cache/production/hugo-clean-cache"
    }
  ]
}
```

with

- `name` - Must match the dependency name in your package.json exactly.
- `localPath` - Is the local path to be set in dev mode. Typically a file path to a neighbouring repo or a production build.

## cli

- Form: `npm-dependency-switcher <mode> [--config <path>]`
  - `<mode>`:
    - `dev`  → Set local file path dependencies
    - `prod` → Set npm dependencies to the latest version (^x.y.z)
- `--config` (optional): Path to the configuration file. Default: `npm-dependency-switcher.config.json` in the current working directory.

Add scripts to `package.json`:

```json
{
  "scripts": {
    "switch:dev": "npm-dependency-switcher dev",
    "switch:prod": "npm-dependency-switcher prod"
  }
}
```

use:

```bash
# Using local repositories
npm run switch:dev

# Switch to npm packages (latest versions)
npm run switch:prod
```

Check out package.json to see how the entries change and enjoy :-)
