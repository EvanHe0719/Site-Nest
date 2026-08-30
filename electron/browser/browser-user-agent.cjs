function standardChromiumUserAgent(rawUserAgent, chromeVersion = process.versions.chrome) {
  const source = String(rawUserAgent || "");
  const platform = source.match(/^Mozilla\/5\.0 \([^)]+\)/)?.[0]
    || "Mozilla/5.0 (Windows NT 10.0; Win64; x64)";
  const chrome = source.match(/\bChrome\/[0-9.]+/)?.[0]
    || `Chrome/${String(chromeVersion || "120.0.0.0")}`;
  return `${platform} AppleWebKit/537.36 (KHTML, like Gecko) ${chrome} Safari/537.36`;
}

module.exports = { standardChromiumUserAgent };
