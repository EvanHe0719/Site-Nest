const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const roots = ["electron", "renderer", "scripts", "test"];
const sourceFiles = [];

function collect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collect(fullPath);
    else if (/\.(?:cjs|js)$/.test(entry.name)) sourceFiles.push(fullPath);
  }
}

for (const root of roots) collect(path.join(projectRoot, root));

const productionFiles = sourceFiles.filter((file) =>
  file.includes(`${path.sep}electron${path.sep}`) ||
  file.includes(`${path.sep}renderer${path.sep}`),
);
const forbidden = [
  { pattern: /\bnodeIntegration\s*:\s*true\b/, message: "nodeIntegration must remain disabled" },
  { pattern: /\bcontextIsolation\s*:\s*false\b/, message: "contextIsolation must remain enabled" },
  { pattern: /\beval\s*\(/, message: "eval is not allowed in production source" },
  { pattern: /\bnew\s+Function\s*\(/, message: "new Function is not allowed in production source" },
  { pattern: /GOCSPX\x2d|BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY/, message: "credential material must not be committed" },
];

const failures = [];
for (const file of sourceFiles) {
  const result = spawnSync(process.execPath, ["--check", file], {
    cwd: projectRoot,
    encoding: "utf8",
  });
  if (result.status !== 0) failures.push(`${path.relative(projectRoot, file)}: ${result.stderr.trim()}`);
}
for (const file of productionFiles) {
  const source = fs.readFileSync(file, "utf8");
  for (const rule of forbidden) {
    if (rule.pattern.test(source)) {
      failures.push(`${path.relative(projectRoot, file)}: ${rule.message}`);
    }
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Lint passed: ${sourceFiles.length} JavaScript files, ${productionFiles.length} production files`);
}
