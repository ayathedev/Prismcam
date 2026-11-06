// Realistic simulated camera stream generator for environments where hardware camera is unavailable or denied

let animationFrameId: number | null = null;
let simulatedCanvas: HTMLCanvasElement | null = null;

export function createSimulatedCameraStream(
  facingMode: 'user' | 'environment' = 'environment'
): { stream: MediaStream; cleanup: () => void } {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  const width = 1280;
  const height = 720;

  if (!simulatedCanvas) {
    simulatedCanvas = document.createElement('canvas');
  }
  simulatedCanvas.width = width;
  simulatedCanvas.height = height;
  const ctx = simulatedCanvas.getContext('2d')!;

  let frameCount = 0;

  const renderScene = () => {
    frameCount++;
    const t = frameCount * 0.02;

    if (facingMode === 'environment') {
      // Rear camera: Cinematic outdoor scenic view
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
      skyGrad.addColorStop(0, '#0284c7'); // Sky blue
      skyGrad.addColorStop(0.6, '#38bdf8');
      skyGrad.addColorStop(1, '#fed7aa'); // Warm horizon
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Sun
      const sunX = width * 0.75;
      const sunY = height * 0.35 + Math.sin(t * 0.5) * 5;
      const sunGrad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 120);
      sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      sunGrad.addColorStop(0.3, 'rgba(253, 224, 71, 0.7)');
      sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunY, 120, 0, Math.PI * 2);
      ctx.fill();

      // Distant mountains
      ctx.fillStyle = '#0369a1';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.65);
      ctx.lineTo(width * 0.25, height * 0.42);
      ctx.lineTo(width * 0.55, height * 0.68);
      ctx.lineTo(width * 0.8, height * 0.48);
      ctx.lineTo(width, height * 0.65);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Foreground hills
      ctx.fillStyle = '#0f766e';
      ctx.beginPath();
      ctx.moveTo(0, height * 0.72);
      ctx.bezierCurveTo(width * 0.3, height * 0.55, width * 0.7, height * 0.85, width, height * 0.68);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Moving bird / drone silhouette for motion testing
      const birdX = ((frameCount * 3) % (width + 200)) - 100;
      const birdY = height * 0.25 + Math.sin(t * 2) * 15;
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(birdX, birdY, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      // Wings
      ctx.beginPath();
      ctx.moveTo(birdX - 10, birdY);
      ctx.lineTo(birdX - 2, birdY - 8 + Math.sin(t * 6) * 4);
      ctx.lineTo(birdX + 10, birdY);
      ctx.stroke();

      // Camera lens flare artifact
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.arc(width * 0.4 + Math.sin(t) * 10, height * 0.5 + Math.cos(t) * 8, 35, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Front camera: Modern portrait studio selfie view
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      bgGrad.addColorStop(0, '#18181b');
      bgGrad.addColorStop(0.5, '#27272a');
      bgGrad.addColorStop(1, '#09090b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Studio softbox rim glow
      const rimGrad = ctx.createRadialGradient(width * 0.5, height * 0.45, 120, width * 0.5, height * 0.45, 300);
      rimGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
      rimGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(width * 0.5, height * 0.45, 300, 0, Math.PI * 2);
      ctx.fill();

      // Human portrait silhouette
      const centerX = width * 0.5 + Math.sin(t * 0.8) * 4;
      const headY = height * 0.38 + Math.cos(t * 0.8) * 3;

      // Head
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(centerX, headY, 80, 0, Math.PI * 2);
      ctx.fill();

      // Torso / Shoulders
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.ellipse(centerX, headY + 160, 160, 100, 0, 0, Math.PI * 2);
      ctx.fill();

      // Subtle breathing motion ring
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, headY, 95 + Math.sin(t * 2) * 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Live Simulator Watermark / Timestamp
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(16, height - 42, 280, 26);
    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px "Space Mono", monospace';
    const nowStr = new Date().toISOString().slice(11, 23);
    ctx.fillText(`SIMULATED FEED · ${nowStr}`, 24, height - 25);

    animationFrameId = requestAnimationFrame(renderScene);
  };

  renderScene();

  // Capture stream from canvas at 30 fps
  const videoStream: MediaStream = simulatedCanvas.captureStream(30);

  // Add silent audio track for MediaRecorder compatibility
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const dst = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.001; // Silent
      osc.connect(gain);
      gain.connect(dst);
      osc.start();
      dst.stream.getAudioTracks().forEach((track) => videoStream.addTrack(track));
    }
  } catch {
    // Audio track optional
  }

  const cleanup = () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  };

  return { stream: videoStream, cleanup };
}
