const NODESEEK_BROWSER_PROFILE_ID = "nodeseek";
const NODESEEK_SITE_PARTITION = "persist:qiye-nodeseek";
// Electron adds q-values itself; passing an HTTP header here duplicates them.
const NODESEEK_ACCEPT_LANGUAGES = "zh-CN,zh,en";

function isNodeSeekUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ""));
    const hostname = url.hostname.toLowerCase();
    return ["http:", "https:"].includes(url.protocol)
      && (hostname === "nodeseek.com" || hostname.endsWith(".nodeseek.com"));
  } catch {
    return false;
  }
}

function nodeSeekPageIssue({ url, statusCode = 0, title = "", body = "" }) {
  if (!isNodeSeekUrl(url)) return null;
  const pageTitle = String(title).trim();
  const pageBody = String(body).trim();
  const forbidden = Number(statusCode) === 403
    || /^403(?:\s+(?:Forbidden|Access Denied))?[.!]?$/i.test(pageTitle)
    || /^403(?:\s+(?:Forbidden|Access Denied))?[.!]?$/i.test(pageBody);
  const challengeTitle = /^(?:Just a moment(?:\.{0,3}|…)?|Attention Required!?\s*[|–-]\s*Cloudflare)$/i.test(pageTitle);
  const challengeBody = /Cloudflare Ray ID|Performing security verification|cf-chl-/i.test(pageBody);
  if (challengeTitle || (forbidden && challengeBody)) {
    return {
      siteIssue: "nodeseek-challenge",
      error: "NodeSeek 正在进行网站安全验证。请在网页中完成验证；当前登录会话已保留。",
    };
  }
  if (forbidden) {
    return {
      siteIssue: "nodeseek-forbidden",
      error: "NodeSeek 拒绝了本次访问（HTTP 403）。可稍后刷新，或通过右上角“在默认浏览器打开”继续访问；当前登录会话已保留。",
    };
  }
  if (/Network Error/i.test(pageTitle) || /^Oops!\s*Network Error/i.test(pageBody)) {
    return {
      siteIssue: "nodeseek-network",
      error: "NodeSeek 返回网络错误。可点击“修复网络”重试，或使用默认浏览器打开。",
    };
  }
  return null;
}

module.exports = {
  NODESEEK_BROWSER_PROFILE_ID,
  NODESEEK_SITE_PARTITION,
  NODESEEK_ACCEPT_LANGUAGES,
  isNodeSeekUrl,
  nodeSeekPageIssue,
};
