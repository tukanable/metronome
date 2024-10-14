import './styles.css';

let audioContext: AudioContext | null = null;
let gainNode: GainNode;
let lowPassFilter: BiquadFilterNode;
let reverb: DelayNode;
let whiteNoiseSource: AudioBufferSourceNode | null = null;
let ticker: number | null = null;
let tickVolumeNode: GainNode;
let noiseVolume: number = 0.1;
let tickerVolume: number = 0.1;
let filterFrequency: number = 700;

// Initialize the AudioContext
function initAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

// Create a buffer for white noise
function createWhiteNoiseBuffer(context: AudioContext, bufferSize: number = 2 * context.sampleRate): AudioBuffer {
  const buffer: AudioBuffer = context.createBuffer(1, bufferSize, context.sampleRate);
  const data: Float32Array = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1; // Fill the buffer with white noise
  }
  return buffer;
}

// Create the white noise source and apply audio effects
function createWhiteNoise(): void {
  initAudioContext();

  if (whiteNoiseSource) {
    return; // Prevent multiple white noise sources
  }

  const buffer: AudioBuffer = createWhiteNoiseBuffer(audioContext);
  whiteNoiseSource = audioContext.createBufferSource();
  whiteNoiseSource.buffer = buffer;

  gainNode = audioContext.createGain();
  gainNode.gain.value = noiseVolume; // Set initial volume

  lowPassFilter = audioContext.createBiquadFilter();
  lowPassFilter.type = 'lowpass';
  lowPassFilter.frequency.value = filterFrequency; // Set initial filter frequency

  reverb = audioContext.createDelay();
  reverb.delayTime.value = 0.1;

  whiteNoiseSource.connect(lowPassFilter);
  lowPassFilter.connect(reverb);
  reverb.connect(gainNode);
  gainNode.connect(audioContext.destination);

  whiteNoiseSource.loop = true;
}

function playWhiteNoise(): void {
  createWhiteNoise();
  whiteNoiseSource.start();
}

function stopWhiteNoise(): void {
  if (whiteNoiseSource) {
    whiteNoiseSource.stop();
    whiteNoiseSource = null;
  }
}

function createTickerOscillator(): void {
  initAudioContext();

  const oscillator = audioContext.createOscillator();
  tickVolumeNode = audioContext.createGain();

  oscillator.type = 'sine';
  oscillator.frequency.value = 1000; // 1000 Hz for ticker

  tickVolumeNode.gain.setValueAtTime(tickerVolume, audioContext.currentTime);
  tickVolumeNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1); // Quick fade

  oscillator.connect(tickVolumeNode);
  tickVolumeNode.connect(audioContext.destination);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1); // Short tick
}

// Ticker interval settings
let minInterval: number = 1000; // Minimum interval in ms
let maxInterval: number = 2000; // Maximum interval in ms
let duration: number = 60; // Duration for the sine wave transition in seconds
let startTime: number | null = null; // To track the start time of the ticker
let tickInterval: number = 0;

function playTicker(): void {
  stopTicker();

  startTime = 0;
  tickInterval = minInterval;

  const values = document.getElementById('values');
  if (values) {
    values.innerHTML = ''; // Clear the previous values
  }

  const next = () => {
    createTickerOscillator();

    startTime += tickInterval;
    if (startTime > duration * 1000*2) {
      startTime -= duration * 1000*2;
    }

    const angle = (startTime / (duration*1000*2)) * Math.PI;
    tickInterval = Math.sin(angle) * (maxInterval - minInterval) + minInterval;

    const el = document.getElementById('tickInterval');
    if (el) {
      el.textContent = `${tickInterval.toFixed(2)} ms`;
    }

    const values = document.getElementById('values');
    if (values) {
      // append <div class="w-1 h-16 bg-red-500"></div>
      const div = document.createElement('div');
      div.className = 'w-1 bg-red-500';
      div.style.height = `${tickInterval / 1000 * 32}px`;
      values.appendChild(div);
    }

    ticker = setTimeout(next, tickInterval);
  };

  next();
}

function stopTicker(): void {
  if (ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

// Update the white noise volume
function updateNoiseVolume(value: number): void {
  noiseVolume = value;
  if (gainNode) {
    gainNode.gain.value = noiseVolume;
  }
}

// Update the low-pass filter frequency
function updateFilterFrequency(value: number): void {
  filterFrequency = value;
  if (lowPassFilter) {
    lowPassFilter.frequency.value = filterFrequency;
  }
}

// Update the ticker volume
function updateTickerVolume(value: number): void {
  tickerVolume = value;
}

// Update the ticker interval
function updateTickInterval(value: number): void {
  tickInterval = value;
  if (ticker) {
    playTicker(); // Restart the ticker with the new interval
  }
}

// UI setup using DaisyUI components
document.body.innerHTML = `
  <div class="p-10">
    <div id="values" class="flex flex-wrap">
    </div>
    <div class="flex justify-between mb-6">
      <div class="mr-4">
        <h2>White Noise Settings</h2>
        <button id="playNoise" class="btn btn-primary mb-2">Play White Noise</button>
        <button id="stopNoise" class="btn btn-secondary mb-4">Stop White Noise</button>

        <div class="form-control w-full max-w-xs mb-4">
          <label class="label">
            <span class="label-text">Noise Volume: <span id="noiseVolumeValue">0.1</span></span>
          </label>
          <input type="range" id="noiseVolumeSlider" min="0" max="1" step="0.01" value="0.1" class="range range-primary">
        </div>

        <div class="form-control w-full max-w-xs mb-4">
          <label class="label">
            <span class="label-text">Low-pass Filter Frequency: <span id="filterFreqValue">700</span> Hz</span>
          </label>
          <input type="range" id="filterFreqSlider" min="20" max="20000" step="10" value="700" class="range range-secondary">
        </div>
      </div>

      <div class="ml-4">
        <h2>Ticker Settings <span id="tickInterval"><span></h2>
        <button id="startTick" class="btn btn-primary mb-2">Start Ticker</button>
        <button id="stopTick" class="btn btn-secondary mb-4">Stop Ticker</button>

        <div class="form-control w-full max-w-xs mb-4">
          <label class="label">
            <span class="label-text">Ticker Volume: <span id="tickerVolumeValue">0.1</span></span>
          </label>
          <input type="range" id="tickerVolumeSlider" min="0" max="1" step="0.01" value="0.1" class="range range-primary">
        </div>

        <div class="form-control w-full max-w-xs mb-4">
          <label class="label">
            <span class="label-text">Min Ticker Interval: <span id="minTickIntervalValue">1000</span> ms</span>
          </label>
          <input type="range" id="minTickIntervalSlider" min="100" max="3000" step="100" value="1000" class="range range-secondary">
        </div>

        <div class="form-control w-full max-w-xs mb-4">
          <label class="label">
            <span class="label-text">Max Ticker Interval: <span id="maxTickIntervalValue">3000</span> ms</span>
          </label>
          <input type="range" id="maxTickIntervalSlider" min="100" max="10000" step="100" value="3000" class="range range-secondary">
        </div>

        <div class="form-control w-full max-w-xs mb-4">
          <label class="label">
            <span class="label-text">Duration for Interval Change: <span id="durationValue">60</span> s</span>
          </label>
          <input type="range" id="durationSlider" min="10" max="120" step="1" value="60" class="range range-secondary">
        </div>
      </div>
    </div>
  </div>
`;

// Add event listeners for the sliders and buttons
document.getElementById('noiseVolumeSlider').addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  document.getElementById('noiseVolumeValue').textContent = value;
  updateNoiseVolume(parseFloat(value));
});

document.getElementById('filterFreqSlider').addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  document.getElementById('filterFreqValue').textContent = value;
  updateFilterFrequency(parseFloat(value));
});

document.getElementById('tickerVolumeSlider').addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  document.getElementById('tickerVolumeValue').textContent = value;
  updateTickerVolume(parseFloat(value));
});

document.getElementById('minTickIntervalSlider').addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  document.getElementById('minTickIntervalValue').textContent = value;
  minInterval = parseFloat(value);
})

document.getElementById('maxTickIntervalSlider').addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  document.getElementById('maxTickIntervalValue').textContent = value;
  maxInterval = parseFloat(value);
});

document.getElementById('durationSlider').addEventListener('input', (event) => {
  const value = (event.target as HTMLInputElement).value;
  document.getElementById('durationValue').textContent = value;
  duration = parseFloat(value);
});

document.getElementById('playNoise').addEventListener('click', playWhiteNoise);
document.getElementById('stopNoise').addEventListener('click', stopWhiteNoise);

document.getElementById('startTick').addEventListener('click', playTicker);
document.getElementById('stopTick').addEventListener('click', stopTicker);
