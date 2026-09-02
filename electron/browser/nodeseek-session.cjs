const NODESEEK_BROWSER_PROFILE_ID = "nodeseek";
const NODESEEK_SITE_PARTITION = "persist:qiye-nodeseek";

function isNodeSeekUrl(rawUrl) {
  try {
    const hostname = new URL(String(rawUrl || "")).hostname.toLowerCase();
    return hostname === "nodeseek.com" || hostname.endsWith(".nodeseek.com");
  } catch {
    return false;
  }
}

module.exports = {
  NODESEEK_BROWSER_PROFILE_ID,
  NODESEEK_SITE_PARTITION,
  isNodeSeekUrl,
};
