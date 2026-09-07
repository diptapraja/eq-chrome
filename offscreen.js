// Offscreen Audio Engine for Dolby Audio Equalizer & 5.1 Virtual Surround

const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

let audioCtx = null;
let activeStream = null;
let sourceNode = null;
let eqFilters = [];
let bassFilter = null;
let surround51Nodes = null;
let compressorNode = null;
let masterGainNode = null;
let analyserNode = null;
let activeTabId = null;
let currentSettings = null;

// Initialize Web Audio Graph with Dolby 5.1 Matrix Decoding
function setupAudioGraph(stream, settings) {
  currentSettings = settings;

  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // 1. Source Node
  sourceNode = audioCtx.createMediaStreamSource(stream);

  // 2. 10-Band Equalizer Filters
  eqFilters = EQ_FREQUENCIES.map((freq, index) => {
    const filter = audioCtx.createBiquadFilter();
    filter.frequency.value = freq;

    if (index === 0) {
      filter.type = 'lowshelf';
    } else if (index === EQ_FREQUENCIES.length - 1) {
      filter.type = 'highshelf';
    } else {
      filter.type = 'peaking';
      filter.Q.value = 1.4;
    }

    const bandGain = (settings.bands && settings.bands[index] !== undefined) ? settings.bands[index] : 0;
    filter.gain.value = bandGain;
    return filter;
  });

  // Chain the EQ filters in series
  let lastNode = sourceNode;
  for (const filter of eqFilters) {
    lastNode.connect(filter);
    lastNode = filter;
  }

  // 3. Dedicated Sub-Bass Booster Filter (Low-shelf 75 Hz)
  bassFilter = audioCtx.createBiquadFilter();
  bassFilter.type = 'lowshelf';
  bassFilter.frequency.value = 75;
  const bassGainDb = ((settings.bassBoost || 0) / 100) * 10;
  bassFilter.gain.value = bassGainDb;
  lastNode.connect(bassFilter);
  lastNode = bassFilter;

  // 4. Dolby 5.1 Virtual Surround Sound Matrix
  surround51Nodes = create51SurroundNetwork(audioCtx, settings);
  lastNode.connect(surround51Nodes.input);
  lastNode = surround51Nodes.output;

  // 5. Dolby Cinema Dynamics Range Compressor (DRC)
  compressorNode = audioCtx.createDynamicsCompressor();
  applyCompressorSettings(settings.drcEnabled, settings.attackTime);
  lastNode.connect(compressorNode);
  lastNode = compressorNode;

  // 6. Master Volume Preamp Gain Node (0% to 300%)
  masterGainNode = audioCtx.createGain();
  const volumeGain = Math.max(0, (settings.masterVolume !== undefined ? settings.masterVolume : 100) / 100);
  masterGainNode.gain.value = volumeGain;
  lastNode.connect(masterGainNode);
  lastNode = masterGainNode;

  // 7. Spectrum Analyser Node for Live Visualizer
  analyserNode = audioCtx.createAnalyser();
  analyserNode.fftSize = 64; // 32 frequency bins
  analyserNode.smoothingTimeConstant = 0.82;
  lastNode.connect(analyserNode);

  // 8. Connect to user speakers / headphones
  analyserNode.connect(audioCtx.destination);
}

// Dolby 5.1 Virtual Surround Matrix Network
// Decodes stereo input into FL, FR, Center (dialogue), Subwoofer LFE (.1), Surround Left, Surround Right
function create51SurroundNetwork(ctx, settings) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  // 1. FRONT LEFT (FL) & FRONT RIGHT (FR) with Crossover Management
  const frontShelfL = ctx.createBiquadFilter();
  frontShelfL.type = 'lowshelf';
  frontShelfL.frequency.value = 85;
  frontShelfL.gain.value = 0;

  const frontShelfR = ctx.createBiquadFilter();
  frontShelfR.type = 'lowshelf';
  frontShelfR.frequency.value = 85;
  frontShelfR.gain.value = 0;

  const frontLeft = ctx.createGain();
  const frontRight = ctx.createGain();

  splitter.connect(frontShelfL, 0);
  splitter.connect(frontShelfR, 1);
  frontShelfL.connect(frontLeft);
  frontShelfR.connect(frontRight);
  frontLeft.connect(merger, 0, 0); // Out Left
  frontRight.connect(merger, 0, 1); // Out Right

  // 2. CENTER CHANNEL (C - Vocal & Dialogue Extraction)
  // Extracts common-mode (L + R) * 0.5
  const centerSum = ctx.createGain();
  centerSum.gain.value = 0.5;
  splitter.connect(centerSum, 0);
  splitter.connect(centerSum, 1);

  // Vocal bandpass filter (highpass at 220Hz + peaking at 1.5kHz for dialogue clarity)
  const centerHighpass = ctx.createBiquadFilter();
  centerHighpass.type = 'highpass';
  centerHighpass.frequency.value = 220;

  const centerPeaking = ctx.createBiquadFilter();
  centerPeaking.type = 'peaking';
  centerPeaking.frequency.value = 1500;
  centerPeaking.Q.value = 1.0;
  centerPeaking.gain.value = 3.5;

  const centerGain = ctx.createGain();
  centerSum.connect(centerHighpass);
  centerHighpass.connect(centerPeaking);
  centerPeaking.connect(centerGain);

  // Center connects equally to Left and Right output (dead-center binaural positioning)
  centerGain.connect(merger, 0, 0);
  centerGain.connect(merger, 0, 1);

  // 3. SUBWOOFER LFE (.1 Channel - Tight, Round Bass Body < 100Hz)
  const subSum = ctx.createGain();
  subSum.gain.value = 0.5;
  splitter.connect(subSum, 0);
  splitter.connect(subSum, 1);

  // Round Bass Punch & Warmth Filter (+2.5dB at 80Hz)
  const subPunch = ctx.createBiquadFilter();
  subPunch.type = 'peaking';
  subPunch.frequency.value = 80;
  subPunch.Q.value = 1.0;
  subPunch.gain.value = 2.5;

  // Cascaded 24dB/octave Butterworth crossover at 100Hz (Q = 0.707 for non-resonant, clean impulse)
  const subLpf1 = ctx.createBiquadFilter();
  subLpf1.type = 'lowpass';
  subLpf1.frequency.value = 100;
  subLpf1.Q.value = 0.707;

  const subLpf2 = ctx.createBiquadFilter();
  subLpf2.type = 'lowpass';
  subLpf2.frequency.value = 100;
  subLpf2.Q.value = 0.707;

  const subGain = ctx.createGain();
  subSum.connect(subPunch);
  subPunch.connect(subLpf1);
  subLpf1.connect(subLpf2);
  subLpf2.connect(subGain);

  // Subwoofer routed to both Left and Right output as solid, round low-end foundation
  subGain.connect(merger, 0, 0);
  subGain.connect(merger, 0, 1);

  // 4. SURROUND LEFT (SL) & SURROUND RIGHT (SR) - Rear Soundstage
  // Extracts differential out-of-phase audio: (L - R) and (R - L)
  const diffL = ctx.createGain();
  const diffLInvertR = ctx.createGain();
  diffLInvertR.gain.value = -1.0;
  splitter.connect(diffL, 0);
  splitter.connect(diffLInvertR, 1);
  diffLInvertR.connect(diffL);

  const diffR = ctx.createGain();
  const diffRInvertL = ctx.createGain();
  diffRInvertL.gain.value = -1.0;
  splitter.connect(diffR, 1);
  splitter.connect(diffRInvertL, 0);
  diffRInvertL.connect(diffR);

  // 7kHz Cinema Surround Rolloff
  const surroundLpfL = ctx.createBiquadFilter();
  surroundLpfL.type = 'lowpass';
  surroundLpfL.frequency.value = 7000;

  const surroundLpfR = ctx.createBiquadFilter();
  surroundLpfR.type = 'lowpass';
  surroundLpfR.frequency.value = 7000;

  // Haas Micro-Delay for rear spatial localization (20ms)
  const delaySL = ctx.createDelay();
  delaySL.delayTime.value = 0.020;

  const delaySR = ctx.createDelay();
  delaySR.delayTime.value = 0.020;

  const surroundGainL = ctx.createGain();
  const surroundGainR = ctx.createGain();

  diffL.connect(surroundLpfL);
  surroundLpfL.connect(delaySL);
  delaySL.connect(surroundGainL);
  surroundGainL.connect(merger, 0, 0); // Out Left

  diffR.connect(surroundLpfR);
  surroundLpfR.connect(delaySR);
  delaySR.connect(surroundGainR);
  surroundGainR.connect(merger, 0, 1); // Out Right

  // Cross-feed with phase inversion for expansive 3D rear atmosphere
  const surroundCrossLtoR = ctx.createGain();
  const surroundCrossRtoL = ctx.createGain();
  surroundGainL.connect(surroundCrossLtoR);
  surroundCrossLtoR.connect(merger, 0, 1);
  surroundGainR.connect(surroundCrossRtoL);
  surroundCrossRtoL.connect(merger, 0, 0);

  // 5. ANTI-MUD CLARITY FILTER (220Hz gentle scoop to clear vocal masking without thinning bass)
  const antiMudFilter = ctx.createBiquadFilter();
  antiMudFilter.type = 'peaking';
  antiMudFilter.frequency.value = 220;
  antiMudFilter.Q.value = 1.0;
  antiMudFilter.gain.value = -1.8;

  input.connect(splitter);
  merger.connect(antiMudFilter);
  antiMudFilter.connect(output);

  const nodes = {
    input,
    output,
    frontLeft,
    frontRight,
    frontShelfL,
    frontShelfR,
    subPunch,
    antiMudFilter,
    centerGain,
    subGain,
    surroundGainL,
    surroundGainR,
    surroundCrossLtoR,
    surroundCrossRtoL,
    updateSettings: (cfg) => {
      const now = ctx.currentTime;
      const is51 = cfg.mode51 !== false;
      const isTight = cfg.tightBass !== false;

      // Anti-mud scoop: subtle -1.8dB when tightBass is on, neutral (0dB) when off
      antiMudFilter.gain.setTargetAtTime(isTight ? -1.8 : 0.0, now, 0.04);
      subPunch.gain.setTargetAtTime(isTight ? 2.5 : 0.0, now, 0.04);

      if (!is51) {
        // Fallback to pure wide stereo
        const sWidth = (cfg.spatialWidth !== undefined ? cfg.spatialWidth : 50) / 100;
        frontLeft.gain.setTargetAtTime(1.0, now, 0.04);
        frontRight.gain.setTargetAtTime(1.0, now, 0.04);
        frontShelfL.gain.setTargetAtTime(0.0, now, 0.04);
        frontShelfR.gain.setTargetAtTime(0.0, now, 0.04);
        centerGain.gain.setTargetAtTime(0.0, now, 0.04);
        subGain.gain.setTargetAtTime(0.0, now, 0.04);
        surroundGainL.gain.setTargetAtTime(0.4 * sWidth, now, 0.04);
        surroundGainR.gain.setTargetAtTime(0.4 * sWidth, now, 0.04);
        surroundCrossLtoR.gain.setTargetAtTime(-0.2 * sWidth, now, 0.04);
        surroundCrossRtoL.gain.setTargetAtTime(-0.2 * sWidth, now, 0.04);
        return;
      }

      // Full 5.1 Matrix Decoding Mode
      const cLvl = (cfg.centerLevel !== undefined ? cfg.centerLevel : 80) / 100;
      const subLvl = (cfg.subwooferLevel !== undefined ? cfg.subwooferLevel : 80) / 100;
      const surrLvl = (cfg.surroundLevel !== undefined ? cfg.surroundLevel : 75) / 100;

      frontLeft.gain.setTargetAtTime(0.95, now, 0.04);
      frontRight.gain.setTargetAtTime(0.95, now, 0.04);

      // Front channels maintain rich natural body
      frontShelfL.gain.setTargetAtTime(0.0, now, 0.04);
      frontShelfR.gain.setTargetAtTime(0.0, now, 0.04);

      // Center dialogue presence
      centerGain.gain.setTargetAtTime(0.85 * cLvl, now, 0.04);

      // Subwoofer punch level: 1.25 * subLvl provides solid, deep, palpable round bass
      subGain.gain.setTargetAtTime(1.25 * subLvl, now, 0.04);

      // Rear surround soundstage
      surroundGainL.gain.setTargetAtTime(0.9 * surrLvl, now, 0.04);
      surroundGainR.gain.setTargetAtTime(0.9 * surrLvl, now, 0.04);
      surroundCrossLtoR.gain.setTargetAtTime(-0.35 * surrLvl, now, 0.04);
      surroundCrossRtoL.gain.setTargetAtTime(-0.35 * surrLvl, now, 0.04);
    }
  };

  nodes.updateSettings(settings);
  return nodes;
}

// DRC (Dynamic Range Compressor) settings with Attack control
function applyCompressorSettings(enabled, attackMs) {
  if (!compressorNode || !audioCtx) return;
  const now = audioCtx.currentTime;

  if (enabled) {
    // Dolby Cinema DRC Profile with user-adjustable transient attack
    const ms = (attackMs !== undefined && attackMs !== null) ? attackMs : (currentSettings?.attackTime || 25);
    const attackSec = Math.max(0.001, Math.min(0.1, ms / 1000));

    compressorNode.threshold.setTargetAtTime(-24, now, 0.05);
    compressorNode.knee.setTargetAtTime(28, now, 0.05);
    compressorNode.ratio.setTargetAtTime(6.0, now, 0.05);
    compressorNode.attack.setTargetAtTime(attackSec, now, 0.05);
    compressorNode.release.setTargetAtTime(0.25, now, 0.05);
  } else {
    compressorNode.threshold.setTargetAtTime(0, now, 0.05);
    compressorNode.ratio.setTargetAtTime(1.0, now, 0.05);
  }
}

// Update runtime settings smoothly without audio clicking
function updateAudioSettings(settings) {
  if (!audioCtx) return;
  currentSettings = settings;
  const now = audioCtx.currentTime;

  // 1. Update 10 EQ bands
  if (settings.bands && eqFilters.length > 0) {
    settings.bands.forEach((gainVal, idx) => {
      if (eqFilters[idx]) {
        eqFilters[idx].gain.setTargetAtTime(gainVal, now, 0.04);
      }
    });
  }

  // 2. Update Sub-Bass Booster
  if (bassFilter && settings.bassBoost !== undefined) {
    const bassGainDb = (settings.bassBoost / 100) * 10;
    bassFilter.gain.setTargetAtTime(bassGainDb, now, 0.04);
  }

  // 3. Update Dolby 5.1 Matrix Surround Engine
  if (surround51Nodes) {
    surround51Nodes.updateSettings(settings);
  }

  // 4. Update DRC Compressor & Attack
  if (settings.drcEnabled !== undefined || settings.attackTime !== undefined) {
    applyCompressorSettings(settings.drcEnabled !== false, settings.attackTime);
  }

  // 5. Update Master Volume Preamp
  if (masterGainNode && settings.masterVolume !== undefined) {
    const volumeGain = Math.max(0, settings.masterVolume / 100);
    masterGainNode.gain.setTargetAtTime(volumeGain, now, 0.04);
  }
}

// Stop audio capture and release resources
function stopAudioCapture() {
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (audioCtx && audioCtx.state !== 'closed') {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
  eqFilters = [];
  bassFilter = null;
  surround51Nodes = null;
  compressorNode = null;
  masterGainNode = null;
  analyserNode = null;
  activeTabId = null;
}

// Listen for messages from popup or background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.type === 'START_CAPTURE') {
    const { streamId, tabId, settings } = message;

    if (activeStream) {
      stopAudioCapture();
    }

    navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    })
    .then((stream) => {
      activeStream = stream;
      activeTabId = tabId;

      stream.getAudioTracks()[0].onended = () => {
        stopAudioCapture();
        try {
          chrome.runtime.sendMessage({
            target: 'background',
            type: 'UPDATE_CAPTURED_TAB',
            enabled: false,
            tabId: null
          });
        } catch (e) {}
      };

      setupAudioGraph(stream, settings);
      sendResponse({ success: true, tabId });
    })
    .catch((err) => {
      console.error('Error in getUserMedia with tab stream:', err);
      sendResponse({ success: false, error: err.message });
    });

    return true;
  }

  if (message.type === 'STOP_CAPTURE') {
    stopAudioCapture();
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'UPDATE_SETTINGS') {
    updateAudioSettings(message.settings);
    sendResponse({ success: true });
    return;
  }

  if (message.type === 'GET_VISUALIZER_DATA') {
    if (analyserNode && audioCtx && audioCtx.state === 'running') {
      const bufferLength = analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserNode.getByteFrequencyData(dataArray);
      sendResponse({
        success: true,
        data: Array.from(dataArray),
        tabId: activeTabId
      });
    } else {
      sendResponse({ success: false, data: [] });
    }
    return;
  }

  if (message.type === 'GET_CAPTURE_STATUS') {
    sendResponse({
      active: !!activeStream,
      tabId: activeTabId
    });
    return;
  }
});
