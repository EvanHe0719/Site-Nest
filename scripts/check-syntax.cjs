const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const roots = ["electron", "renderer", "scripts"];
const ignored = new Set([path.resolve(__filename)]);

function collectJavaScriptFiles(directory, output) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJavaScriptFiles(fullPath, output);
    else if (/\.(?:cjs|mjs|js)$/.test(entry.name) && !ignored.has(fullPath)) {
      output.push(fullPath);
    }
  }
}

const files = [];
for (const root of roots) {
  const directory = path.join(projectRoot, root);
  if (fs.existsSync(directory)) collectJavaScriptFiles(directory, files);
}

for (const file of files.sort()) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout || `语法检查失败：${file}\n`);
    process.exit(result.status || 1);
  }
}

process.stdout.write(`Syntax check passed: ${files.length} files\n`);
