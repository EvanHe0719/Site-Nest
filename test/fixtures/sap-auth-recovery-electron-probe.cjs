const { app, session } = require("electron");
const {
  clearSapAuthenticationState,
} = require("../../electron/browser/sap-auth-recovery.cjs");

app.whenReady().then(async () => {
  const targetSession = session.fromPartition("persist:qiye-sap-auth-probe", { cache: true });
  const dedicatedSession = session.fromPartition("persist:qiye-sap-auth-dedicated-probe", { cache: true });
  const defaultSession = session.fromPartition("persist:qiye-sap-auth-default-probe", { cache: true });
  await targetSession.clearStorageData();
  await dedicatedSession.clearStorageData();
  await defaultSession.clearStorageData();
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

  await dedicatedSession.cookies.set({
    url: "https://support.sap.com/",
    domain: ".sap.com",
    path: "/",
    secure: true,
    name: "sap-dedicated",
    value: "fixture-only",
  });
  await dedicatedSession.cookies.set({
    url: "https://example.com/",
    domain: ".example.com",
    path: "/",
    secure: true,
    name: "stray-dedicated",
    value: "fixture-only",
  });
  await defaultSession.cookies.set({
    url: "https://example.com/",
    domain: ".example.com",
    path: "/",
    secure: true,
    name: "default-login",
    value: "preserve-me",
  });
  const dedicatedBefore = await dedicatedSession.cookies.get({});
  const defaultBefore = await defaultSession.cookies.get({});
  const dedicatedCleared = await clearSapAuthenticationState(dedicatedSession, {
    clearEntirePartition: true,
    currentUrl: "https://accounts.sap.com/saml2/idp/sso",
  });
  const dedicatedAfter = await dedicatedSession.cookies.get({});
  const defaultAfter = await defaultSession.cookies.get({});
  console.log(JSON.stringify({
    sapAuthRecoveryProbe: {
      scoped: {
        beforeDomains: before.map((cookie) => cookie.domain).sort(),
        afterDomains: after.map((cookie) => cookie.domain).sort(),
        removedCookieCount: cleared.removedCookieCount,
        clearedOrigins: cleared.clearedOrigins,
      },
      dedicated: {
        beforeDomains: dedicatedBefore.map((cookie) => cookie.domain).sort(),
        afterDomains: dedicatedAfter.map((cookie) => cookie.domain).sort(),
        removedCookieCount: dedicatedCleared.removedCookieCount,
        remainingCookieCount: dedicatedCleared.remainingCookieCount,
      },
      defaultIdentity: {
        beforeDomains: defaultBefore.map((cookie) => cookie.domain).sort(),
        afterDomains: defaultAfter.map((cookie) => cookie.domain).sort(),
      },
    },
  }));
  app.quit();
}).catch((error) => {
  console.error(error?.stack || error);
  app.exit(1);
});
