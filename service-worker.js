// Service Worker for TuneUP Audio Equalizer & 5.1 Virtual Surround (Manifest V3)

const DEFAULT_SETTINGS = {
  enabled: false,
  preset: 'cinema_51',
  basePreset: 'cinema_51',
  bands: [4, 3, 1, -1, 0, 1, 2, 3, 4, 5],
  bassBoost: 35,
  spatialWidth: 70,
  drcEnabled: true,
  masterVolume: 100,
  capturedTabId: null,
  // TuneUP 5.1 Surround Settings
  mode51: true,
  centerLevel: 80,      // 0 - 100%
  subwooferLevel: 80,   // 0 - 100% (Solid, round sub-bass)
  surroundLevel: 75,    // 0 - 100%
  attackTime: 25,       // 1 - 100 ms (Transient Punch & Sound Response)
  tightBass: true       // Anti-Mud crossover filter for clean, round, comfortable bass
};

// Initialize default settings on install
chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(['eq_settings']);
  if (!data.eq_settings) {
    await chrome.storage.local.set({ eq_settings: DEFAULT_SETTINGS });
  } else {
    // Merge new 5.1 fields if upgrading
    await chrome.storage.local.set({
      eq_settings: { ...DEFAULT_SETTINGS, ...data.eq_settings }
    });
  }
});

// Ensure offscreen document is open
async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument?.()) {
    return;
  }
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['USER_MEDIA', 'AUDIO_PLAYBACK'],
      justification: 'Process tab audio with 5.1 surround sound matrix, equalizer, and DRC'
    });
  } catch (err) {
    if (!err.message?.includes('Only a single offscreen document may be created')) {
      console.error('Failed to create offscreen document:', err);
    }
  }
}

// Clean up when captured tab is closed
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get(['eq_settings']);
  if (data.eq_settings && data.eq_settings.capturedTabId === tabId) {
    const updated = {
      ...data.eq_settings,
      enabled: false,
      capturedTabId: null
    };
    await chrome.storage.local.set({ eq_settings: updated });

    try {
      chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'STOP_CAPTURE',
        tabId: tabId
      });
    } catch (e) {}
  }
});

// Handle messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'background') {
    if (message.type === 'ENSURE_OFFSCREEN') {
      ensureOffscreenDocument()
        .then(() => sendResponse({ success: true }))
        .catch((err) => sendResponse({ success: false, error: err.message }));
      return true;
    }

    if (message.type === 'UPDATE_CAPTURED_TAB') {
      chrome.storage.local.get(['eq_settings']).then((data) => {
        const current = data.eq_settings || DEFAULT_SETTINGS;
        chrome.storage.local.set({
          eq_settings: {
            ...current,
            enabled: message.enabled,
            capturedTabId: message.tabId
          }
        });
      });
      sendResponse({ success: true });
    }
  }
});
