chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ integrationFixtureInstalled: true });
});
