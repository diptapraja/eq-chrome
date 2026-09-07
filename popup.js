// Popup Script for Dolby Audio Equalizer & 5.1 Virtual Surround

const FREQUENCIES = [
  { label: '32', hz: 32 },
  { label: '64', hz: 64 },
  { label: '125', hz: 125 },
  { label: '250', hz: 250 },
  { label: '500', hz: 500 },
  { label: '1k', hz: 1000 },
  { label: '2k', hz: 2000 },
  { label: '4k', hz: 4000 },
  { label: '8k', hz: 8000 },
  { label: '16k', hz: 16000 }
];

const DEFAULT_PRESETS = {
  dolby_cinema: {
    name: 'Dolby Cinema 5.1',
    bands: [4, 3, 1, -1, 0, 1, 2, 3, 4, 5],
    bassBoost: 35,
    spatialWidth: 70,
    drcEnabled: true,
    mode51: true,
    centerLevel: 80,
    subwooferLevel: 80,
    surroundLevel: 75,
    attackTime: 25,
    tightBass: true
  },
  flac_master: {
    name: 'FLAC Studio Master HD',
    bands: [3, 2, 0, -1, 0, 1, 2, 3, 4, 5],
    bassBoost: 30,
    spatialWidth: 80,
    drcEnabled: true,
    mode51: true,
    centerLevel: 85,
    subwooferLevel: 80,
    surroundLevel: 80,
    attackTime: 22,
    tightBass: true
  },
  spatial_3d: {
    name: 'Spatial 3D Surround',
    bands: [2, 2, 1, 0, 0, 1, 2, 3, 3, 4],
    bassBoost: 30,
    spatialWidth: 100,
    drcEnabled: true,
    mode51: true,
    centerLevel: 75,
    subwooferLevel: 75,
    surroundLevel: 90,
    attackTime: 30,
    tightBass: true
  },
  bass_extreme: {
    name: 'Bass Extreme 5.1',
    bands: [6, 5, 3, 1, 0, 0, 1, 2, 2, 1],
    bassBoost: 65,
    spatialWidth: 40,
    drcEnabled: true,
    mode51: true,
    centerLevel: 70,
    subwooferLevel: 95,
    surroundLevel: 65,
    attackTime: 30,
    tightBass: true
  },
  vocal_clarity: {
    name: 'Vocal Clarity & Dialog',
    bands: [-3, -2, -1, 1, 3, 5, 4, 3, 1, 0],
    bassBoost: 0,
    spatialWidth: 20,
    drcEnabled: true,
    mode51: true,
    centerLevel: 100,
    subwooferLevel: 45,
    surroundLevel: 40,
    attackTime: 15,
    tightBass: true
  },
  rock: {
    name: 'Rock Concert 5.1',
    bands: [3, 2, 1, 0, -1, 1, 3, 4, 4, 3],
    bassBoost: 35,
    spatialWidth: 50,
    drcEnabled: true,
    mode51: true,
    centerLevel: 80,
    subwooferLevel: 80,
    surroundLevel: 70,
    attackTime: 30,
    tightBass: true
  },
  jazz: {
    name: 'Jazz Club 5.1',
    bands: [2, 1, 0, 1, 2, 1, 2, 3, 3, 2],
    bassBoost: 25,
    spatialWidth: 55,
    drcEnabled: false,
    mode51: true,
    centerLevel: 80,
    subwooferLevel: 70,
    surroundLevel: 65,
    attackTime: 20,
    tightBass: true
  },
  edm: {
    name: 'Electronic 5.1',
    bands: [5, 4, 2, -1, 0, 2, 3, 4, 5, 5],
    bassBoost: 50,
    spatialWidth: 65,
    drcEnabled: true,
    mode51: true,
    centerLevel: 75,
    subwooferLevel: 90,
    surroundLevel: 80,
    attackTime: 35,
    tightBass: true
  },
  pop: {
    name: 'Pop Studio 5.1',
    bands: [1, 2, 2, 1, 1, 2, 3, 3, 2, 2],
    bassBoost: 35,
    spatialWidth: 45,
    drcEnabled: true,
    mode51: true,
    centerLevel: 80,
    subwooferLevel: 75,
    surroundLevel: 70,
    attackTime: 25,
    tightBass: true
  },
  flat: {
    name: 'Flat / Pure Stereo',
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: 0,
    spatialWidth: 0,
    drcEnabled: false,
    mode51: false,
    centerLevel: 0,
    subwooferLevel: 0,
    surroundLevel: 0,
    attackTime: 20,
    tightBass: false
  }
};

let userCustomPresets = {};

let currentSettings = {
  enabled: false,
  preset: 'dolby_cinema',
  basePreset: 'dolby_cinema',
  bands: [4, 3, 1, -1, 0, 1, 2, 3, 4, 5],
  bassBoost: 35,
  spatialWidth: 70,
  drcEnabled: true,
  masterVolume: 100,
  capturedTabId: null,
  // Dolby 5.1 Matrix Settings
  mode51: true,
  centerLevel: 80,
  subwooferLevel: 80,
  surroundLevel: 75,
  attackTime: 25,
  tightBass: true
};

let activeTab = null;
let visualizerRunning = false;
let peakHeights = new Array(32).fill(0);

// DOM Elements
const powerBtn = document.getElementById('powerBtn');
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const tabTargetTitle = document.getElementById('tabTargetTitle');
const currentPresetName = document.getElementById('currentPresetName');
const savePresetBtn = document.getElementById('savePresetBtn');
const saveAsPresetBtn = document.getElementById('saveAsPresetBtn');
const presetButtonsContainer = document.getElementById('presetButtons');
const eqSlidersContainer = document.getElementById('eqSlidersContainer');
const volumeSlider = document.getElementById('volumeSlider');
const volumeVal = document.getElementById('volumeVal');
const drcToggle = document.getElementById('drcToggle');
const resetBtn = document.getElementById('resetBtn');

// 5.1 Matrix Elements
const mode51Toggle = document.getElementById('mode51Toggle');
const tightBassToggle = document.getElementById('tightBassToggle');
const centerSlider = document.getElementById('centerSlider');
const centerVal = document.getElementById('centerVal');
const subwooferSlider = document.getElementById('subwooferSlider');
const subwooferVal = document.getElementById('subwooferVal');
const surroundSlider = document.getElementById('surroundSlider');
const surroundVal = document.getElementById('surroundVal');
const attackSlider = document.getElementById('attackSlider');
const attackVal = document.getElementById('attackVal');

// Top Visualizer Canvas
const canvas = document.getElementById('visualizerCanvas');
const ctx = canvas.getContext('2d');
const visualizerStatusLabel = document.getElementById('visualizerStatusLabel');

// Save Preset Modal Elements
const savePresetModal = document.getElementById('savePresetModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const confirmSavePresetBtn = document.getElementById('confirmSavePresetBtn');
const presetNameInput = document.getElementById('presetNameInput');
const presetInputError = document.getElementById('presetInputError');

// 3D & 5.1 Simulator Elements
const toggleSimBtn = document.getElementById('toggleSimBtn');
const simBtnIcon = document.getElementById('simBtnIcon');
const simBtnText = document.getElementById('simBtnText');
const simDirectionText = document.getElementById('simDirectionText');
const simDegreeText = document.getElementById('simDegreeText');
const sweep51Btn = document.getElementById('sweep51Btn');
const simCanvas = document.getElementById('simulationCanvas');
const simCtx = simCanvas.getContext('2d');

// 3D Audio Simulation State
let simAudioCtx = null;
let simPanner = null;
let simGain = null;
let simTimer = null;
let simRunning = false;
let simAngle = 0; // in radians
let simSpeed = 0.025;
let simParticles = [];
let simRipples = [];
let sweepRunning = false;

// Initialize Extension Popup
document.addEventListener('DOMContentLoaded', async () => {
  setupNavigationTabs();
  buildEqualizerSliders();
  await loadCurrentTab();
  await loadSavedSettings();
  setupEventListeners();
  setup51SpeakerTesting();
  setup3DSimulator();
  startVisualizerLoop();
  start3DSimCanvasLoop();
});

// Setup Main Navigation Tabs (Equalizer vs 5.1 Simulator)
function setupNavigationTabs() {
  const tabs = document.querySelectorAll('.tab-nav-btn');
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.dataset.tab;
      const targetPane = document.getElementById(targetId);
      if (targetPane) targetPane.classList.add('active');
    });
  });
}

// Build 10-Band EQ Vertical Sliders UI
function buildEqualizerSliders() {
  eqSlidersContainer.innerHTML = '';
  FREQUENCIES.forEach((freq, idx) => {
    const col = document.createElement('div');
    col.className = 'band-column';

    const valDisplay = document.createElement('span');
    valDisplay.className = 'band-gain-val';
    valDisplay.id = `bandVal_${idx}`;
    valDisplay.textContent = '0dB';

    const track = document.createElement('div');
    track.className = 'slider-vertical-track';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.className = 'band-slider';
    slider.id = `bandSlider_${idx}`;
    slider.min = '-12';
    slider.max = '12';
    slider.step = '1';
    slider.value = currentSettings.bands[idx] || '0';

    slider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      currentSettings.bands[idx] = val;
      updateBandValueDisplay(idx, val);
      markPresetAsCustom();
      syncSettingsToAudio();
    });

    track.appendChild(slider);

    const freqLabel = document.createElement('span');
    freqLabel.className = 'band-freq-label';
    freqLabel.textContent = freq.label;

    col.appendChild(valDisplay);
    col.appendChild(track);
    col.appendChild(freqLabel);

    eqSlidersContainer.appendChild(col);
  });
}

function updateBandValueDisplay(idx, val) {
  const el = document.getElementById(`bandVal_${idx}`);
  if (el) {
    el.textContent = (val > 0 ? `+${val}` : `${val}`) + 'dB';
  }
}

// Load Active Tab Information
async function loadCurrentTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      activeTab = tabs[0];
      tabTargetTitle.textContent = activeTab.title || 'Tab Aktif';
      tabTargetTitle.title = activeTab.title || 'Tab Aktif';

      if (!isTabCapturable(activeTab.url)) {
        statusText.textContent = 'Tab ini tidak dapat dicapture';
        tabTargetTitle.textContent = 'Buka YouTube / Media Tab';
        powerBtn.disabled = true;
        powerBtn.style.opacity = '0.5';
      }
    }
  } catch (err) {
    console.error('Error fetching tab:', err);
  }
}

function isTabCapturable(url) {
  if (!url) return false;
  return !url.startsWith('chrome://') &&
         !url.startsWith('edge://') &&
         !url.startsWith('chrome-extension://') &&
         !url.startsWith('about:') &&
         !url.startsWith('view-source:');
}

// Load Stored Settings & User Presets
async function loadSavedSettings() {
  const stored = await chrome.storage.local.get(['eq_settings', 'user_presets']);
  if (stored.user_presets) {
    userCustomPresets = stored.user_presets;
  }
  if (stored.eq_settings) {
    currentSettings = { ...currentSettings, ...stored.eq_settings };
  }

  // Check capture state
  try {
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'GET_CAPTURE_STATUS'
    });

    if (response && response.active && response.tabId === activeTab?.id) {
      currentSettings.enabled = true;
      currentSettings.capturedTabId = activeTab.id;
    } else {
      currentSettings.enabled = false;
    }
  } catch (err) {
    currentSettings.enabled = false;
  }

  renderPresetButtons();
  applySettingsToUI();
}

// Render Presets
function renderPresetButtons() {
  presetButtonsContainer.innerHTML = '';

  const defaultKeys = [
    { key: 'dolby_cinema', label: '🎬 Dolby Cinema 5.1' },
    { key: 'flac_master', label: '💎 FLAC Master HD' },
    { key: 'spatial_3d', label: '🎧 Spatial 3D' },
    { key: 'bass_extreme', label: '🔊 Bass Extreme 5.1' },
    { key: 'vocal_clarity', label: '🗣️ Vocal Dialog' },
    { key: 'rock', label: '🎸 Rock 5.1' },
    { key: 'jazz', label: '🎷 Jazz 5.1' },
    { key: 'edm', label: '⚡ Electronic 5.1' },
    { key: 'pop', label: '🎵 Pop 5.1' },
    { key: 'flat', label: '⚖️ Flat / Stereo' }
  ];

  defaultKeys.forEach(p => {
    const btn = document.createElement('button');
    btn.className = `preset-pill ${currentSettings.preset === p.key ? 'active' : ''}`;
    btn.dataset.preset = p.key;
    btn.textContent = p.label;
    btn.addEventListener('click', () => applyPreset(p.key));
    presetButtonsContainer.appendChild(btn);
  });

  Object.keys(userCustomPresets).forEach(customKey => {
    const p = userCustomPresets[customKey];
    const btn = document.createElement('button');
    btn.className = `preset-pill user-custom ${currentSettings.preset === customKey ? 'active' : ''}`;
    btn.dataset.preset = customKey;

    const labelSpan = document.createElement('span');
    labelSpan.textContent = `⭐ ${p.name}`;
    btn.appendChild(labelSpan);

    const delBtn = document.createElement('span');
    delBtn.className = 'preset-delete-btn';
    delBtn.textContent = '×';
    delBtn.title = 'Hapus preset ini';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteCustomPreset(customKey);
    });
    btn.appendChild(delBtn);

    btn.addEventListener('click', () => applyPreset(customKey));
    presetButtonsContainer.appendChild(btn);
  });
}

// Apply settings state to UI controls
function applySettingsToUI() {
  if (currentSettings.enabled) {
    powerBtn.classList.add('active');
    statusDot.classList.add('active');
    statusText.textContent = currentSettings.mode51 ? 'Dolby 5.1 Surround Aktif' : 'Dolby Stereo Aktif';
    visualizerStatusLabel.textContent = '5.1 SPECTRUM AKTIF';
  } else {
    powerBtn.classList.remove('active');
    statusDot.classList.remove('active');
    statusText.textContent = 'Equalizer Siap';
    visualizerStatusLabel.textContent = 'DEMO SPECTRUM';
  }

  updatePresetSelectionUI(currentSettings.preset);

  // Band sliders
  currentSettings.bands.forEach((val, idx) => {
    const slider = document.getElementById(`bandSlider_${idx}`);
    if (slider) {
      slider.value = val;
      updateBandValueDisplay(idx, val);
    }
  });

  // 5.1 Matrix Controls
  mode51Toggle.checked = currentSettings.mode51 !== false;
  tightBassToggle.checked = currentSettings.tightBass !== false;

  centerSlider.value = currentSettings.centerLevel !== undefined ? currentSettings.centerLevel : 80;
  centerVal.textContent = `${centerSlider.value}%`;

  subwooferSlider.value = currentSettings.subwooferLevel !== undefined ? currentSettings.subwooferLevel : 80;
  subwooferVal.textContent = `${subwooferSlider.value}%`;

  surroundSlider.value = currentSettings.surroundLevel !== undefined ? currentSettings.surroundLevel : 75;
  surroundVal.textContent = `${surroundSlider.value}%`;

  attackSlider.value = currentSettings.attackTime !== undefined ? currentSettings.attackTime : 25;
  attackVal.textContent = `${attackSlider.value}ms`;

  // Master Preamp & DRC
  volumeSlider.value = currentSettings.masterVolume !== undefined ? currentSettings.masterVolume : 100;
  volumeVal.textContent = `${volumeSlider.value}%`;

  drcToggle.checked = currentSettings.drcEnabled !== false;
}

function isSettingsDifferentFromPreset(settings, preset) {
  if (!preset) return true;
  if (preset.bands && settings.bands) {
    for (let i = 0; i < 10; i++) {
      if (Math.abs(Number(settings.bands[i] || 0) - Number(preset.bands[i] || 0)) > 0.05) return true;
    }
  }
  if (preset.mode51 !== undefined && Boolean(settings.mode51 !== false) !== Boolean(preset.mode51 !== false)) return true;
  if (preset.tightBass !== undefined && Boolean(settings.tightBass !== false) !== Boolean(preset.tightBass !== false)) return true;
  if (preset.drcEnabled !== undefined && Boolean(settings.drcEnabled !== false) !== Boolean(preset.drcEnabled !== false)) return true;
  if (preset.centerLevel !== undefined && Number(settings.centerLevel) !== Number(preset.centerLevel)) return true;
  if (preset.subwooferLevel !== undefined && Number(settings.subwooferLevel) !== Number(preset.subwooferLevel)) return true;
  if (preset.surroundLevel !== undefined && Number(settings.surroundLevel) !== Number(preset.surroundLevel)) return true;
  if (preset.attackTime !== undefined && Number(settings.attackTime) !== Number(preset.attackTime)) return true;
  return false;
}

function updateSaveButtonsVisibility() {
  const baseKey = currentSettings.basePreset || currentSettings.preset || 'dolby_cinema';
  const isCustom = Boolean(userCustomPresets[baseKey]);
  const basePresetObj = userCustomPresets[baseKey] || DEFAULT_PRESETS[baseKey];

  const modified = isSettingsDifferentFromPreset(currentSettings, basePresetObj);

  if (!modified) {
    savePresetBtn.classList.add('hidden');
    saveAsPresetBtn.classList.add('hidden');
    if (basePresetObj) {
      currentPresetName.textContent = basePresetObj.name;
    }
    document.querySelectorAll('.preset-pill').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === baseKey);
    });
    return;
  }

  // Configuration is modified
  if (basePresetObj) {
    currentPresetName.textContent = `${basePresetObj.name} (Disesuaikan)`;
  } else {
    currentPresetName.textContent = 'Custom 5.1';
  }
  document.querySelectorAll('.preset-pill').forEach(btn => btn.classList.remove('active'));

  // Tombol "Simpan" (replace) HANYA muncul pada preset kustom buatan pengguna
  // Tidak muncul pada preset default bawaan sistem
  if (isCustom) {
    savePresetBtn.classList.remove('hidden');
  } else {
    savePresetBtn.classList.add('hidden');
  }

  // Tombol "Simpan Sebagai..." (Save As) selalu muncul saat pengaturan dimodifikasi
  saveAsPresetBtn.classList.remove('hidden');
}

function updatePresetSelectionUI(presetKey) {
  document.querySelectorAll('.preset-pill').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === presetKey);
  });
  updateSaveButtonsVisibility();
}

function markPresetAsCustom() {
  if (!currentSettings.basePreset) {
    currentSettings.basePreset = currentSettings.preset || 'dolby_cinema';
  }
  updateSaveButtonsVisibility();
}

function applyPreset(presetKey) {
  let p = DEFAULT_PRESETS[presetKey] || userCustomPresets[presetKey];
  if (!p) return;

  currentSettings.preset = presetKey;
  currentSettings.basePreset = presetKey;
  currentSettings.bands = [...p.bands];
  currentSettings.bassBoost = p.bassBoost !== undefined ? p.bassBoost : 35;
  currentSettings.spatialWidth = p.spatialWidth;
  currentSettings.drcEnabled = p.drcEnabled;
  currentSettings.mode51 = p.mode51 !== undefined ? p.mode51 : true;
  currentSettings.tightBass = p.tightBass !== undefined ? p.tightBass : true;
  currentSettings.centerLevel = p.centerLevel !== undefined ? p.centerLevel : 80;
  currentSettings.subwooferLevel = p.subwooferLevel !== undefined ? p.subwooferLevel : 80;
  currentSettings.surroundLevel = p.surroundLevel !== undefined ? p.surroundLevel : 75;
  currentSettings.attackTime = p.attackTime !== undefined ? p.attackTime : 25;

  applySettingsToUI();
  syncSettingsToAudio();
}

// Timpa / Replace konfigurasi preset kustom yang sedang aktif
async function handleOverwriteCurrentPreset() {
  const baseKey = currentSettings.basePreset || currentSettings.preset;
  if (!userCustomPresets[baseKey]) return;

  userCustomPresets[baseKey] = {
    ...userCustomPresets[baseKey],
    bands: [...currentSettings.bands],
    bassBoost: currentSettings.bassBoost,
    spatialWidth: currentSettings.spatialWidth,
    drcEnabled: currentSettings.drcEnabled,
    mode51: currentSettings.mode51,
    tightBass: currentSettings.tightBass !== false,
    centerLevel: currentSettings.centerLevel,
    subwooferLevel: currentSettings.subwooferLevel,
    surroundLevel: currentSettings.surroundLevel,
    attackTime: currentSettings.attackTime !== undefined ? currentSettings.attackTime : 25
  };

  await chrome.storage.local.set({ user_presets: userCustomPresets });
  currentSettings.preset = baseKey;
  currentSettings.basePreset = baseKey;
  await chrome.storage.local.set({ eq_settings: currentSettings });

  // Visual success feedback
  const originalHTML = savePresetBtn.innerHTML;
  savePresetBtn.innerHTML = `
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
    <span>Tersimpan!</span>
  `;
  savePresetBtn.classList.add('saved-success');

  setTimeout(() => {
    savePresetBtn.innerHTML = originalHTML;
    savePresetBtn.classList.remove('saved-success');
    updateSaveButtonsVisibility();
  }, 900);
}

async function deleteCustomPreset(key) {
  if (confirm(`Hapus preset "${userCustomPresets[key]?.name}"?`)) {
    delete userCustomPresets[key];
    await chrome.storage.local.set({ user_presets: userCustomPresets });

    if (currentSettings.preset === key || currentSettings.basePreset === key) {
      applyPreset('dolby_cinema');
    } else {
      renderPresetButtons();
      updateSaveButtonsVisibility();
    }
  }
}

// Set up UI Event Listeners
function setupEventListeners() {
  // Power Button
  powerBtn.addEventListener('click', async () => {
    if (!activeTab || !isTabCapturable(activeTab.url)) return;
    if (currentSettings.enabled) {
      await stopAudioCapture();
    } else {
      await startAudioCapture();
    }
  });

  // 5.1 Matrix Controls
  mode51Toggle.addEventListener('change', (e) => {
    currentSettings.mode51 = e.target.checked;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  tightBassToggle.addEventListener('change', (e) => {
    currentSettings.tightBass = e.target.checked;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  centerSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    centerVal.textContent = `${val}%`;
    currentSettings.centerLevel = val;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  subwooferSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    subwooferVal.textContent = `${val}%`;
    currentSettings.subwooferLevel = val;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  surroundSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    surroundVal.textContent = `${val}%`;
    currentSettings.surroundLevel = val;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  attackSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    attackVal.textContent = `${val}ms`;
    currentSettings.attackTime = val;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  volumeSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    volumeVal.textContent = `${val}%`;
    currentSettings.masterVolume = val;
    syncSettingsToAudio();
  });

  drcToggle.addEventListener('change', (e) => {
    currentSettings.drcEnabled = e.target.checked;
    markPresetAsCustom();
    syncSettingsToAudio();
  });

  // Reset Button
  resetBtn.addEventListener('click', () => {
    applyPreset('dolby_cinema');
    volumeSlider.value = 100;
    volumeVal.textContent = '100%';
    currentSettings.masterVolume = 100;
    syncSettingsToAudio();
  });

  // Save Preset Actions (Overwrite / Save As)
  savePresetBtn.addEventListener('click', handleOverwriteCurrentPreset);

  saveAsPresetBtn.addEventListener('click', () => {
    const baseKey = currentSettings.basePreset || currentSettings.preset;
    const baseObj = userCustomPresets[baseKey] || DEFAULT_PRESETS[baseKey];
    presetNameInput.value = baseObj ? `${baseObj.name} Baru` : '';
    presetInputError.classList.add('hidden');
    savePresetModal.classList.remove('hidden');
    setTimeout(() => {
      presetNameInput.focus();
      presetNameInput.select();
    }, 50);
  });

  closeModalBtn.addEventListener('click', () => savePresetModal.classList.add('hidden'));
  cancelModalBtn.addEventListener('click', () => savePresetModal.classList.add('hidden'));

  savePresetModal.addEventListener('click', (e) => {
    if (e.target === savePresetModal) savePresetModal.classList.add('hidden');
  });

  presetNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSavePresetConfirm();
    if (e.key === 'Escape') savePresetModal.classList.add('hidden');
  });

  confirmSavePresetBtn.addEventListener('click', handleSavePresetConfirm);
}

// Handle Saving New Preset
async function handleSavePresetConfirm() {
  const name = presetNameInput.value.trim();
  if (!name) {
    presetInputError.textContent = 'Nama preset tidak boleh kosong!';
    presetInputError.classList.remove('hidden');
    return;
  }

  const customKey = 'custom_' + Date.now();
  userCustomPresets[customKey] = {
    name: name,
    bands: [...currentSettings.bands],
    bassBoost: currentSettings.bassBoost,
    spatialWidth: currentSettings.spatialWidth,
    drcEnabled: currentSettings.drcEnabled,
    mode51: currentSettings.mode51,
    tightBass: currentSettings.tightBass !== false,
    centerLevel: currentSettings.centerLevel,
    subwooferLevel: currentSettings.subwooferLevel,
    surroundLevel: currentSettings.surroundLevel,
    attackTime: currentSettings.attackTime !== undefined ? currentSettings.attackTime : 25
  };

  await chrome.storage.local.set({ user_presets: userCustomPresets });

  currentSettings.preset = customKey;
  currentSettings.basePreset = customKey;
  await chrome.storage.local.set({ eq_settings: currentSettings });

  savePresetModal.classList.add('hidden');
  renderPresetButtons();
  applySettingsToUI();
}

// Start Audio Capture on Active Tab
async function startAudioCapture() {
  if (!activeTab || !activeTab.id) return;

  try {
    statusText.textContent = 'Menghubungkan 5.1 audio...';

    await chrome.runtime.sendMessage({
      target: 'background',
      type: 'ENSURE_OFFSCREEN'
    });

    chrome.tabCapture.getMediaStreamId({ targetTabId: activeTab.id }, async (streamId) => {
      if (chrome.runtime.lastError || !streamId) {
        console.error('tabCapture error:', chrome.runtime.lastError);
        statusText.textContent = 'Gagal capture tab';
        return;
      }

      const res = await chrome.runtime.sendMessage({
        target: 'offscreen',
        type: 'START_CAPTURE',
        streamId,
        tabId: activeTab.id,
        settings: currentSettings
      });

      if (res && res.success) {
        currentSettings.enabled = true;
        currentSettings.capturedTabId = activeTab.id;

        chrome.runtime.sendMessage({
          target: 'background',
          type: 'UPDATE_CAPTURED_TAB',
          enabled: true,
          tabId: activeTab.id
        });

        applySettingsToUI();
      } else {
        statusText.textContent = 'Audio engine error';
      }
    });
  } catch (err) {
    console.error('Error starting capture:', err);
    statusText.textContent = 'Error: ' + err.message;
  }
}

// Stop Audio Capture
async function stopAudioCapture() {
  try {
    await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'STOP_CAPTURE'
    });

    currentSettings.enabled = false;
    currentSettings.capturedTabId = null;

    chrome.runtime.sendMessage({
      target: 'background',
      type: 'UPDATE_CAPTURED_TAB',
      enabled: false,
      tabId: null
    });

    applySettingsToUI();
  } catch (err) {
    console.error('Error stopping capture:', err);
  }
}

// Sync Settings to Offscreen Audio Engine & Storage
let saveTimeout = null;
function syncSettingsToAudio() {
  try {
    chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'UPDATE_SETTINGS',
      settings: currentSettings
    });
  } catch (e) {}

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    chrome.storage.local.set({ eq_settings: currentSettings });
  }, 200);
}

// ==========================================
// TOP SPECTRUM VISUALIZER LOOP
// ==========================================

function startVisualizerLoop() {
  visualizerRunning = true;
  let lastDrawTime = 0;

  function render(now) {
    if (!visualizerRunning) return;

    if (now - lastDrawTime > 25) {
      lastDrawTime = now;

      if (currentSettings.enabled) {
        chrome.runtime.sendMessage({
          target: 'offscreen',
          type: 'GET_VISUALIZER_DATA'
        }, (res) => {
          if (chrome.runtime.lastError || !res || !res.success || !res.data || res.data.length === 0) {
            drawAmbientDemoSpectrum(now);
          } else {
            drawFrequencyBars(res.data);
          }
        });
      } else {
        drawAmbientDemoSpectrum(now);
      }
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

function drawFrequencyBars(data) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const numBars = 32;
  const barWidth = (width / numBars) - 2;
  const step = Math.floor(data.length / numBars) || 1;

  for (let i = 0; i < numBars; i++) {
    const rawVal = data[i * step] || 0;
    const normalized = rawVal / 255;
    const barHeight = Math.max(3, normalized * (height - 6));

    if (barHeight > peakHeights[i]) {
      peakHeights[i] = barHeight;
    } else {
      peakHeights[i] = Math.max(0, peakHeights[i] - 1.2);
    }

    const x = i * (barWidth + 2) + 2;
    const y = height - barHeight;

    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, '#06b6d4');
    grad.addColorStop(0.65, '#f59e0b');
    grad.addColorStop(1, '#f43f5e');

    ctx.fillStyle = grad;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barWidth, barHeight);
    }

    const peakY = height - peakHeights[i] - 2;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, Math.max(2, peakY), barWidth, 1.5);
  }
}

function drawAmbientDemoSpectrum(time) {
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const numBars = 32;
  const barWidth = (width / numBars) - 2;
  const t = time * 0.003;

  for (let i = 0; i < numBars; i++) {
    const centerDist = Math.abs(i - 16) / 16;
    const wave = Math.sin(i * 0.35 + t) * 0.5 + Math.cos(i * 0.2 - t * 0.8) * 0.3 + 0.8;
    const barHeight = Math.max(4, (1.0 - centerDist * 0.6) * wave * (height * 0.45));

    const x = i * (barWidth + 2) + 2;
    const y = height - barHeight;

    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, 'rgba(6, 182, 212, 0.4)');
    grad.addColorStop(1, 'rgba(245, 158, 11, 0.5)');

    ctx.fillStyle = grad;
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barHeight, [2, 2, 0, 0]);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, barWidth, barHeight);
    }
  }
}

// ===================================================
// 5.1 SPEAKER TESTING & 3D STAGE ENGINE
// ===================================================

const SPEAKER_POSITIONS = {
  FL: { x: -1.8, y: 0, z: -2.0, freq: 523.25, name: 'Kiri Depan' },
  C:  { x: 0.0,  y: 0, z: -2.2, freq: 440.00, name: 'Center / Dialog' },
  FR: { x: 1.8,  y: 0, z: -2.0, freq: 523.25, name: 'Kanan Depan' },
  SR: { x: 2.2,  y: 0, z: 1.6,  freq: 392.00, name: 'Kanan Belakang' },
  SL: { x: -2.2, y: 0, z: 1.6,  freq: 392.00, name: 'Kiri Belakang' },
  SUB:{ x: 0.0,  y: 0, z: -0.8, freq: 65.00,  name: 'Subwoofer LFE' }
};

function setup51SpeakerTesting() {
  document.querySelectorAll('.speaker-card').forEach(card => {
    card.addEventListener('click', async () => {
      const spkKey = card.dataset.speaker;
      await playSingleSpeakerTest(spkKey);
    });
  });

  sweep51Btn.addEventListener('click', async () => {
    if (sweepRunning) return;
    await run51SweepTest();
  });
}

async function playSingleSpeakerTest(spkKey) {
  const spk = SPEAKER_POSITIONS[spkKey];
  if (!spk) return;

  const card = document.querySelector(`.speaker-card[data-speaker="${spkKey}"]`);
  if (card) card.classList.add('active');

  await synthesizeSpeakerCue(spk);

  setTimeout(() => {
    if (card) card.classList.remove('active');
  }, 450);
}

async function run51SweepTest() {
  sweepRunning = true;
  sweep51Btn.classList.add('active');
  sweep51Btn.textContent = 'Memutar...';

  const order = ['FL', 'C', 'FR', 'SR', 'SL', 'SUB'];
  for (let spkKey of order) {
    await playSingleSpeakerTest(spkKey);
    await new Promise(r => setTimeout(r, 480));
  }

  sweepRunning = false;
  sweep51Btn.classList.remove('active');
  sweep51Btn.textContent = '🎬 Tes Keliling 5.1';
}

async function synthesizeSpeakerCue(spk) {
  try {
    if (!simAudioCtx || simAudioCtx.state === 'closed') {
      simAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (simAudioCtx.state === 'suspended') {
      await simAudioCtx.resume();
    }

    const panner = simAudioCtx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';

    if (panner.positionX) {
      panner.positionX.setValueAtTime(spk.x, simAudioCtx.currentTime);
      panner.positionY.setValueAtTime(spk.y, simAudioCtx.currentTime);
      panner.positionZ.setValueAtTime(spk.z, simAudioCtx.currentTime);
    } else {
      panner.setPosition(spk.x, spk.y, spk.z);
    }

    const osc = simAudioCtx.createOscillator();
    const gain = simAudioCtx.createGain();

    const now = simAudioCtx.currentTime;
    if (spk.freq < 100) {
      // Subwoofer low-frequency rumble
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(80, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.6, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
    } else {
      // Clear melodic spatial tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(spk.freq, now);
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    }

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(simAudioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.45);
  } catch (e) {
    console.error('Speaker cue synthesis error:', e);
  }
}

// 3D Spatial Audio Simulator Setup
function setup3DSimulator() {
  toggleSimBtn.addEventListener('click', async () => {
    if (simRunning) {
      stop3DSimulation();
    } else {
      await start3DSimulation();
    }
  });
}

const SIM_NOTES = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99];
let noteIndex = 0;

async function start3DSimulation() {
  try {
    if (!simAudioCtx || simAudioCtx.state === 'closed') {
      simAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (simAudioCtx.state === 'suspended') {
      await simAudioCtx.resume();
    }

    simPanner = simAudioCtx.createPanner();
    simPanner.panningModel = 'HRTF';
    simPanner.distanceModel = 'inverse';
    simPanner.refDistance = 1;
    simPanner.maxDistance = 10000;
    simPanner.rolloffFactor = 1;

    if (simAudioCtx.listener.positionX) {
      simAudioCtx.listener.positionX.setValueAtTime(0, simAudioCtx.currentTime);
      simAudioCtx.listener.positionY.setValueAtTime(0, simAudioCtx.currentTime);
      simAudioCtx.listener.positionZ.setValueAtTime(0, simAudioCtx.currentTime);
      simAudioCtx.listener.forwardX.setValueAtTime(0, simAudioCtx.currentTime);
      simAudioCtx.listener.forwardY.setValueAtTime(0, simAudioCtx.currentTime);
      simAudioCtx.listener.forwardZ.setValueAtTime(-1, simAudioCtx.currentTime);
      simAudioCtx.listener.upX.setValueAtTime(0, simAudioCtx.currentTime);
      simAudioCtx.listener.upY.setValueAtTime(1, simAudioCtx.currentTime);
      simAudioCtx.listener.upZ.setValueAtTime(0, simAudioCtx.currentTime);
    } else {
      simAudioCtx.listener.setPosition(0, 0, 0);
      simAudioCtx.listener.setOrientation(0, 0, -1, 0, 1, 0);
    }

    simGain = simAudioCtx.createGain();
    simGain.gain.setValueAtTime(0.35, simAudioCtx.currentTime);

    simPanner.connect(simGain);
    simGain.connect(simAudioCtx.destination);

    simRunning = true;
    toggleSimBtn.classList.add('active');
    simBtnIcon.textContent = '⏹';
    simBtnText.textContent = 'Hentikan Suara';

    triggerSimChimeNote();
    simTimer = setInterval(triggerSimChimeNote, 380);
  } catch (err) {
    console.error('Failed to start 3D audio test:', err);
  }
}

function triggerSimChimeNote() {
  if (!simRunning || !simAudioCtx) return;

  const now = simAudioCtx.currentTime;
  const osc = simAudioCtx.createOscillator();
  const noteGain = simAudioCtx.createGain();

  const freq = SIM_NOTES[noteIndex % SIM_NOTES.length];
  noteIndex++;

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, now);

  noteGain.gain.setValueAtTime(0.001, now);
  noteGain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
  noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  osc.connect(noteGain);
  noteGain.connect(simPanner);

  osc.start(now);
  osc.stop(now + 0.48);

  const orbitR = 64;
  const centerX = simCanvas.width / 2;
  const centerY = simCanvas.height / 2;
  const orbX = centerX + Math.sin(simAngle) * orbitR;
  const orbY = centerY - Math.cos(simAngle) * orbitR;
  simRipples.push({ x: orbX, y: orbY, radius: 4, alpha: 1.0 });
}

function stop3DSimulation() {
  simRunning = false;
  if (simTimer) {
    clearInterval(simTimer);
    simTimer = null;
  }
  if (simAudioCtx && simAudioCtx.state !== 'closed') {
    simAudioCtx.close().catch(() => {});
    simAudioCtx = null;
  }
  toggleSimBtn.classList.remove('active');
  simBtnIcon.textContent = '▶';
  simBtnText.textContent = 'Putar Suara 3D';
}

// Continuous Canvas Loop for 3D Radar Stage with 5.1 Speaker Nodes
function start3DSimCanvasLoop() {
  function render() {
    draw3DSimulationStage();
    requestAnimationFrame(render);
  }
  requestAnimationFrame(render);
}

function draw3DSimulationStage() {
  const w = simCanvas.width;
  const h = simCanvas.height;
  simCtx.clearRect(0, 0, w, h);

  const centerX = w / 2;
  const centerY = h / 2;
  const orbitRadius = 60;

  // Sound orb always moves smoothly around head
  simAngle = (simAngle + simSpeed) % (Math.PI * 2);

  if (simRunning && simPanner && simAudioCtx) {
    const distance = 2.0;
    const xPos = Math.sin(simAngle) * distance;
    const zPos = -Math.cos(simAngle) * distance;

    if (simPanner.positionX) {
      simPanner.positionX.setTargetAtTime(xPos, simAudioCtx.currentTime, 0.02);
      simPanner.positionZ.setTargetAtTime(zPos, simAudioCtx.currentTime, 0.02);
    } else {
      simPanner.setPosition(xPos, 0, zPos);
    }
  }

  const deg = Math.round((simAngle * 180 / Math.PI)) % 360;
  simDegreeText.textContent = `${deg}°`;

  if (deg >= 315 || deg < 45) {
    simDirectionText.textContent = 'DEPAN';
  } else if (deg >= 45 && deg < 135) {
    simDirectionText.textContent = 'KANAN';
  } else if (deg >= 135 && deg < 225) {
    simDirectionText.textContent = 'BELAKANG';
  } else {
    simDirectionText.textContent = 'KIRI';
  }

  // 1. Draw Radar Concentric Circles & Grid
  simCtx.strokeStyle = 'rgba(6, 182, 212, 0.1)';
  simCtx.lineWidth = 1;

  simCtx.beginPath();
  simCtx.arc(centerX, centerY, 30, 0, Math.PI * 2);
  simCtx.stroke();

  simCtx.beginPath();
  simCtx.arc(centerX, centerY, 84, 0, Math.PI * 2);
  simCtx.stroke();

  // Dashed Orbit Track
  simCtx.beginPath();
  if (simCtx.setLineDash) simCtx.setLineDash([4, 4]);
  simCtx.strokeStyle = simRunning ? 'rgba(6, 182, 212, 0.55)' : 'rgba(255, 255, 255, 0.2)';
  simCtx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
  simCtx.stroke();
  if (simCtx.setLineDash) simCtx.setLineDash([]);

  // 2. Draw 5.1 Speaker Dots on Radar
  const speakers51 = [
    { label: 'FL', angle: Math.PI * 1.75 },
    { label: 'C',  angle: 0 },
    { label: 'FR', angle: Math.PI * 0.25 },
    { label: 'SR', angle: Math.PI * 0.75 },
    { label: 'SL', angle: Math.PI * 1.25 }
  ];

  speakers51.forEach(spk => {
    const spkX = centerX + Math.sin(spk.angle) * (orbitRadius + 14);
    const spkY = centerY - Math.cos(spk.angle) * (orbitRadius + 14);

    simCtx.beginPath();
    simCtx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    simCtx.arc(spkX, spkY, 7, 0, Math.PI * 2);
    simCtx.fill();

    simCtx.font = 'bold 7.5px sans-serif';
    simCtx.fillStyle = '#38bdf8';
    simCtx.textAlign = 'center';
    simCtx.textBaseline = 'middle';
    simCtx.fillText(spk.label, spkX, spkY);
  });

  // 3. Rotating Radar Scanner Beam
  const beamAngle = simAngle;
  const beamX = centerX + Math.sin(beamAngle) * 82;
  const beamY = centerY - Math.cos(beamAngle) * 82;
  simCtx.beginPath();
  const beamGrad = simCtx.createLinearGradient(centerX, centerY, beamX, beamY);
  beamGrad.addColorStop(0, 'rgba(6, 182, 212, 0.05)');
  beamGrad.addColorStop(1, simRunning ? 'rgba(245, 158, 11, 0.35)' : 'rgba(6, 182, 212, 0.25)');
  simCtx.strokeStyle = beamGrad;
  simCtx.lineWidth = 1.5;
  simCtx.moveTo(centerX, centerY);
  simCtx.lineTo(beamX, beamY);
  simCtx.stroke();

  // 4. Draw Top-Down Listener Head with Headphone Pads
  drawListenerHead(centerX, centerY, deg);

  // 5. Draw Sound Wave Ripples
  for (let i = simRipples.length - 1; i >= 0; i--) {
    const r = simRipples[i];
    simCtx.beginPath();
    simCtx.strokeStyle = `rgba(245, 158, 11, ${r.alpha * 0.8})`;
    simCtx.lineWidth = 1.8;
    simCtx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
    simCtx.stroke();

    r.radius += 1.6;
    r.alpha -= 0.03;
    if (r.alpha <= 0) simRipples.splice(i, 1);
  }

  // 6. Sound Source Orb Position & Particle Trail
  const orbX = centerX + Math.sin(simAngle) * orbitRadius;
  const orbY = centerY - Math.cos(simAngle) * orbitRadius;

  simParticles.push({ x: orbX, y: orbY, alpha: 1.0 });
  if (simParticles.length > 14) simParticles.shift();

  for (let p of simParticles) {
    simCtx.beginPath();
    simCtx.fillStyle = simRunning ? `rgba(245, 158, 11, ${p.alpha * 0.4})` : `rgba(6, 182, 212, ${p.alpha * 0.3})`;
    simCtx.arc(p.x, p.y, 4 * p.alpha, 0, Math.PI * 2);
    simCtx.fill();
    p.alpha -= 0.04;
  }

  // Sound beam
  simCtx.beginPath();
  simCtx.strokeStyle = simRunning ? 'rgba(251, 191, 36, 0.35)' : 'rgba(6, 182, 212, 0.18)';
  simCtx.lineWidth = simRunning ? 1.5 : 1;
  simCtx.moveTo(orbX, orbY);
  simCtx.lineTo(centerX, centerY);
  simCtx.stroke();

  // Glowing Sound Orb
  const orbGrad = simCtx.createRadialGradient(orbX, orbY, 1, orbX, orbY, 12);
  if (simRunning) {
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.25, '#fbbf24');
    orbGrad.addColorStop(0.65, '#f43f5e');
    orbGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
  } else {
    orbGrad.addColorStop(0, '#ffffff');
    orbGrad.addColorStop(0.3, '#38bdf8');
    orbGrad.addColorStop(0.7, '#06b6d4');
    orbGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');
  }

  simCtx.beginPath();
  simCtx.fillStyle = orbGrad;
  simCtx.arc(orbX, orbY, 12, 0, Math.PI * 2);
  simCtx.fill();

  simCtx.beginPath();
  simCtx.fillStyle = '#ffffff';
  simCtx.arc(orbX, orbY, 3.5, 0, Math.PI * 2);
  simCtx.fill();
}

// Draw Listener Head with Ear Cups Lighting Up
function drawListenerHead(x, y, deg) {
  simCtx.save();

  // Head Silhouette
  simCtx.beginPath();
  simCtx.fillStyle = '#1e293b';
  simCtx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
  simCtx.lineWidth = 1.8;
  simCtx.ellipse(x, y, 15, 19, 0, 0, Math.PI * 2);
  simCtx.fill();
  simCtx.stroke();

  // Nose (Front)
  simCtx.beginPath();
  simCtx.fillStyle = '#334155';
  simCtx.moveTo(x - 3, y - 18);
  simCtx.lineTo(x, y - 25);
  simCtx.lineTo(x + 3, y - 18);
  simCtx.closePath();
  simCtx.fill();
  simCtx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  simCtx.stroke();

  // Headband
  simCtx.beginPath();
  simCtx.strokeStyle = '#94a3b8';
  simCtx.lineWidth = 3;
  simCtx.arc(x, y + 1, 18, Math.PI * 0.9, Math.PI * 2.1);
  simCtx.stroke();

  const rightIntensity = Math.max(0.3, Math.sin(deg * Math.PI / 180));
  const leftIntensity = Math.max(0.3, -Math.sin(deg * Math.PI / 180));

  // Left Ear
  simCtx.beginPath();
  simCtx.fillStyle = `rgba(6, 182, 212, ${0.4 + leftIntensity * 0.6})`;
  if (simCtx.roundRect) {
    simCtx.roundRect(x - 20, y - 7, 5, 14, 2.5);
  } else {
    simCtx.fillRect(x - 20, y - 7, 5, 14);
  }
  simCtx.fill();

  // Right Ear
  simCtx.beginPath();
  simCtx.fillStyle = `rgba(245, 158, 11, ${0.4 + rightIntensity * 0.6})`;
  if (simCtx.roundRect) {
    simCtx.roundRect(x + 15, y - 7, 5, 14, 2.5);
  } else {
    simCtx.fillRect(x + 15, y - 7, 5, 14);
  }
  simCtx.fill();

  simCtx.font = 'bold 7.5px sans-serif';
  simCtx.fillStyle = '#0b0f17';
  simCtx.textAlign = 'center';
  simCtx.textBaseline = 'middle';
  simCtx.fillText('L', x - 17.5, y);
  simCtx.fillText('R', x + 17.5, y);

  simCtx.restore();
}
