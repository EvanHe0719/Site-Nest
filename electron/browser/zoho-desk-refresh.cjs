const { isZohoDeskUrl } = require("./zoho-auth-return.cjs");

function isZohoDeskTicketListUrl(rawUrl) {
  if (!isZohoDeskUrl(rawUrl)) return false;
  try {
    const parsed = new URL(String(rawUrl || "").trim());
    return /\/tickets\/list(?:\/|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function zohoDeskTicketListRefreshScript() {
  return `(() => {
    const normalize = (value) => String(value || "").replace(/\\s+/g, " ").trim();
    const isRefreshLabel = (value) => /^(?:refresh|刷新)$/i.test(normalize(value));
    const isVisible = (element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
    };
    const candidates = Array.from(document.querySelectorAll('button, [role="button"]'));
    const target = candidates.find((element) => {
      if (element.disabled || element.getAttribute("aria-disabled") === "true" || !isVisible(element)) return false;
      return [
        element.getAttribute("aria-label"),
        element.getAttribute("title"),
        element.getAttribute("data-title"),
        element.textContent,
      ].some(isRefreshLabel);
    });
    if (!target) return { handled: false, reason: "refresh-control-not-found" };
    target.click();
    return { handled: true };
  })()`;
}

async function refreshZohoDeskTicketList(contents) {
  if (!contents || typeof contents.executeJavaScript !== "function") return false;
  const result = await contents.executeJavaScript(zohoDeskTicketListRefreshScript(), true);
  return result?.handled === true;
}

module.exports = {
  isZohoDeskTicketListUrl,
  refreshZohoDeskTicketList,
  zohoDeskTicketListRefreshScript,
};
