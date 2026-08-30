const { app, session } = require("electron");
const {
  clearSapAuthenticationState,
} = require("../../electron/browser/sap-auth-recovery.cjs");

app.whenReady().then(async () => {
  const targetSession = session.fromPartition("persist:qiye-sap-auth-probe", { cache: true });
  await targetSession.clearStorageData();
  await targetSession.cookies.set({
    url: "https://support.sap.com/",
    domain: ".sap.com",
    path: "/",
    secure: true,
    name: "sap-parent",
    value: "fixture-only",
  });
  await targetSession.cookies.set({
    url: "https://support.sap.com/",
    domain: ".support.sap.com",
    path: "/",
    secure: true,
    name: "sap-support",
    value: "fixture-only",
  });
  await targetSession.cookies.set({
    url: "https://example.com/",
    domain: ".example.com",
    path: "/",
    secure: true,
    name: "unrelated",
    value: "preserve-me",
  });

  const before = await targetSession.cookies.get({});
  const cleared = await clearSapAuthenticationState(targetSession, {
    currentUrl: "https://sapit-forme-prod.authentication.eu11.hana.ondemand.com/oauth/authorize",
  });
  const after = await targetSession.cookies.get({});
  console.log(JSON.stringify({
    sapAuthRecoveryProbe: {
      beforeDomains: before.map((cookie) => cookie.domain).sort(),
      afterDomains: after.map((cookie) => cookie.domain).sort(),
      removedCookieCount: cleared.removedCookieCount,
      clearedOrigins: cleared.clearedOrigins,
    },
  }));
  app.quit();
}).catch((error) => {
  console.error(error?.stack || error);
  app.exit(1);
});
