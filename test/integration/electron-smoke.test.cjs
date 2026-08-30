const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

function runElectron({ userData, route, width = 1060, height = 700 }) {
  const capturePath = path.join(userData, `capture-${route}.png`);
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [projectRoot], {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_TEST_USER_DATA: userData,
        QIYE_CAPTURE_PATH: capturePath,
        QIYE_CAPTURE_ROUTE: route,
        QIYE_CAPTURE_WIDTH: String(width),
        QIYE_CAPTURE_HEIGHT: String(height),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Electron 回归超时：${route}`));
    }, 45000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `Electron 回归失败：${route}，退出码 ${code}\n${stdout}\n${stderr}`,
          ),
        );
        return;
      }
      resolve({ stdout, stderr, capturePath });
    });
  });
}

test(
  "v2 临时数据可迁移，空间可跨重启恢复，旧入口与通用助手可运行",
  { timeout: 180000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-v3-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });

    const dataFile = path.join(userData, "site-nest-data.json");
    const v2Fixture = {
      version: 2,
      sites: [
        {
          id: "legacy-site",
          name: "旧站点",
          shortName: "旧",
          url: "https://example.org/legacy",
          color: "#5b7cfa",
          source: "custom",
          description: "迁移回归",
          pinned: true,
          order: 0,
          lastOpenedAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      bookmarks: [
        {
          id: "legacy-bookmark",
          name: "旧书签",
          url: "https://example.org/bookmark",
          folder: "回归",
          sourceProfile: "Chrome",
        },
      ],
      importMeta: { source: "Chrome", scanned: 1 },
      automations: {
        naixi: {
          enabled: false,
          time: "09:15",
          status: "disabled",
          message: "自动签到已关闭",
          lastRunAt: null,
          lastSuccessAt: null,
          lastSuccessDate: null,
        },
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    await fsp.writeFile(dataFile, JSON.stringify(v2Fixture, null, 2), "utf8");

    const first = await runElectron({ userData, route: "state-probe" });
    assert.match(first.stdout, /"version":4/);
    const migrated = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(migrated.version, 4);
    assert.equal(migrated.activeWorkspaceId, "personal");
    assert.deepEqual(
      migrated.workspaces.map((workspace) => workspace.id),
      ["personal", "work", "research"],
    );
    assert.equal(migrated.sites[0].workspaceId, "personal");
    assert.equal(migrated.bookmarks[0].id, "legacy-bookmark");
    assert.equal(migrated.automations.naixi.time, "09:15");
    await fsp.access(path.join(userData, "site-nest-data.v2.backup.json"));

    await runElectron({ userData, route: "workspace-persist" });
    const second = await runElectron({ userData, route: "state-probe" });
    assert.match(second.stdout, /"activeWorkspaceId":"work"/);
    const restarted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(restarted.activeWorkspaceId, "work");

    const automation = await runElectron({
      userData,
      route: "legacy-automation-route",
    });
    assert.match(automation.stdout, /"route":"automations","tab":"checkins"/);
    assert.ok((await fsp.stat(automation.capturePath)).size > 1000);

    const assistant = await runElectron({ userData, route: "assistant-generic" });
    assert.match(assistant.stdout, /"genericMatched":true/);
    assert.match(assistant.stdout, /"actionStatus":"success"/);
    const afterAction = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.ok(afterAction.assistantExecutionLogs.length >= 1);
    assert.equal(afterAction.assistantExecutionLogs[0].status, "success");
  },
);
