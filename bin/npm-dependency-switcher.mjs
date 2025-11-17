#!/usr/bin/env node
/**
 * NPM Dependency Switcher.
 * Switches from local folders to 
 * default "npm module" vice versa 
 * for the specified resources. 
 * 
 * - switch to local development
 * - restore for production
 * - Can be combined with release pipelines
 * - Also works for monorepos without workspaces
 * - Uses native npm functions, making it extremely robust.
 * 
 * @author Carsten Nichte, 2025
 */
// bin/npm-dependency-switcher.mjs
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import pc from "picocolors";

const hr = () => "─".repeat(65);

function loadJSON(fp) {
  return JSON.parse(fs.readFileSync(fp, "utf8"));
}

function saveJSON(fp, data) {
  fs.writeFileSync(fp, JSON.stringify(data, null, 2) + "\n", "utf8");
}

function findDep(pkg, name) {
  if (pkg.dependencies?.[name]) return ["dependencies", pkg.dependencies];
  if (pkg.devDependencies?.[name]) return ["devDependencies", pkg.devDependencies];
  return [null, null];
}

function ensureDeps(pkg, sec) {
  if (!pkg[sec]) pkg[sec] = {};
  return pkg[sec];
}

function resolveConfigPath(args) {
  const i = args.indexOf("--config");
  if (i !== -1 && args[i + 1]) return path.resolve(process.cwd(), args[i + 1]);
  return path.resolve(process.cwd(), "npm-dependency-switcher.config.json");
}

function logHeader(mode) {
  console.log(hr());
  console.log(`🔧 Schalte Dependencies auf MODE: ${pc.cyan(mode.toUpperCase())}`);
  console.log(hr());
}

async function main() {
  const [, , modeRaw, ...rest] = process.argv;
  const mode = (modeRaw || "").toLowerCase();

  if (!["dev", "prod"].includes(mode)) {
    console.log("❌ Bitte Modus angeben: dev oder prod");
    process.exit(1);
  }

  const configPath = resolveConfigPath(rest);
  const pkgPath = path.resolve(process.cwd(), "package.json");

  if (!fs.existsSync(configPath)) {
    console.log(`❌ Config nicht gefunden: ${configPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(pkgPath)) {
    console.log(`❌ package.json nicht gefunden.`);
    process.exit(1);
  }

  const config = loadJSON(configPath);
  const pkg = loadJSON(pkgPath);
  const list = config.packages ?? [];

  logHeader(mode);

  const updated = [];
  const skipped = [];

  for (const entry of list) {
    const { name, localPath } = entry;
    if (!name) continue;

    let [sec, obj] = findDep(pkg, name);

    if (!sec) {
      sec = "dependencies";
      obj = ensureDeps(pkg, sec);
      console.log(`  • ${name} noch nicht vorhanden → hinzugefügt zu ${sec}`);
    }

    if (mode === "dev") {
      if (!localPath) {
        console.log(`  • ${name}: kein localPath → übersprungen`);
        skipped.push(name);
        continue;
      }
      obj[name] = `file:${localPath}`;
      console.log(`  • ${name} -> file:${localPath}`);
      updated.push(name);
    } else {
      console.log(`  • ${name} -> neueste npm-Version`);
      try {
        const v = execSync(`npm view ${name} version`, { encoding: "utf8" }).trim();
        obj[name] = `^${v}`;
        console.log(`    → ${v}`);
        updated.push(name);
      } catch {
        console.log(`    → Fehler beim Laden von npm view ${name}`);
        skipped.push(name);
      }
    }
  }

  saveJSON(pkgPath, pkg);
  console.log(pc.green("✅ package.json aktualisiert."));

  // Cleanup
  if (fs.existsSync("node_modules")) {
    console.log("🗑  Entferne node_modules …");
    fs.rmSync("node_modules", { recursive: true, force: true });
  }
  if (fs.existsSync("package-lock.json")) {
    console.log("🗑  Entferne package-lock.json …");
    fs.rmSync("package-lock.json", { force: true });
  }

  // Install
  console.log("📦 npm install …");
  execSync("npm install", { stdio: "inherit" });

  console.log(hr());
  console.log(`✅ Fertig: MODE ${mode.toUpperCase()}`);
  console.log(`   Aktualisiert: ${updated.length}, Übersprungen: ${skipped.length}`);
  console.log(hr());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});