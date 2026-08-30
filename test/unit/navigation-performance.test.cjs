const assert = require("node:assert/strict");
const test = require("node:test");

const {
  NavigationPerformanceTracer,
  median,
} = require("../../electron/browser/navigation-performance-tracer.cjs");
const {
  PageCapabilityOrchestrator,
} = require("../../electron/browser/page-capability-orchestrator.cjs");

test("navigation tracer records attach before load and computes overlay delay", () => {
  let now = 100;
  const tracer = new NavigationPerformanceTracer({ now: () => now, wallNow: () => "2026-08-30T00:00:00.000Z" });
  const id = tracer.start({ tabId: "tab-1", partition: "persist:qiye-sites" });
  now = 102;
  tracer.mark(id, "sessionResolvedAt");
  now = 104;
  tracer.mark(id, "viewCreatedAt");
  now = 105;
  tracer.mark(id, "viewAttachedAt");
  tracer.mark(id, "overlayHiddenAt");
  now = 108;
  tracer.mark(id, "loadUrlCalledAt");
  now = 140;
  tracer.mark(id, "domReadyAt");
  now = 170;
  tracer.mark(id, "didStopLoadingAt");
  const trace = tracer.finish(id, null);

  assert.equal(trace.metrics.clickToLoadUrlMs, 8);
  assert.equal(trace.metrics.domReadyToVisibleMs, 0);
  assert.equal(trace.metrics.overlayDelayMs, 0);
  assert.equal(trace.metrics.fullLoadMs, 70);
  assert.equal(trace.partition, "persist:qiye-sites");
});

test("navigation tracer summarizes medians and counts redirects", () => {
  let now = 0;
  const tracer = new NavigationPerformanceTracer({ now: () => now });
  for (const duration of [30, 10, 20]) {
    const id = tracer.start();
    tracer.redirect(id);
    now += duration;
    tracer.mark(id, "didStopLoadingAt");
    tracer.finish(id, null);
  }
  assert.equal(median([30, 10, 20]), 20);
  assert.equal(tracer.snapshot().completed.every((trace) => trace.redirectCount === 1), true);
  assert.equal(tracer.summary().fullLoadMs, 20);
});

test("page capability orchestrator defers idle work and keeps manual work explicit", async () => {
  const calls = [];
  const orchestrator = new PageCapabilityOrchestrator({ idleDelayMs: 5 });
  orchestrator.run("tab-1", "immediate", [{ id: "navigation", run: () => calls.push("immediate") }]);
  orchestrator.run("tab-1", "idle", [{ id: "assistant", run: () => calls.push("idle") }]);
  const manual = orchestrator.run("tab-1", "manual", [{ id: "translate", run: () => calls.push("manual") }]);
  await new Promise((resolve) => setTimeout(resolve, 15));
  assert.deepEqual(calls, ["immediate", "idle"]);
  await manual.execute();
  assert.deepEqual(calls, ["immediate", "idle", "manual"]);
});
