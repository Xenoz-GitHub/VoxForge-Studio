export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export function createWavBlobUrl(base64Audio: string, mimeType = "audio/wav"): {
  blobUrl: string;
  arrayBuffer: ArrayBuffer;
} {
  const bytes = base64ToUint8Array(base64Audio);
  const bufferCopy = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(bufferCopy).set(bytes);
  const blob = new Blob([bufferCopy], { type: mimeType });
  const blobUrl = URL.createObjectURL(blob);
  return { blobUrl, arrayBuffer: bufferCopy };
}

export async function extractWaveformPeaks(
  arrayBuffer: ArrayBuffer,
  bucketCount = 72
): Promise<{ peaks: number[]; durationSeconds: number }> {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) {
      return {
        peaks: fallbackPeaksFromPcm(arrayBuffer, bucketCount),
        durationSeconds: 0,
      };
    }
    const ctx = new AudioCtx();
    try {
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      const channelData = audioBuffer.getChannelData(0);
      const step = Math.max(1, Math.floor(channelData.length / bucketCount));
      const peaks: number[] = [];

      let maxPeak = 0.001;
      for (let i = 0; i < bucketCount; i++) {
        const start = i * step;
        const end = Math.min(channelData.length, start + step);
        let peak = 0;
        for (let j = start; j < end; j++) {
          const abs = Math.abs(channelData[j]);
          if (abs > peak) peak = abs;
        }
        peaks.push(peak);
        if (peak > maxPeak) maxPeak = peak;
      }

      const normalized = peaks.map((p) => Math.max(0.08, Number((p / maxPeak).toFixed(3))));
      return {
        peaks: normalized,
        durationSeconds: Number(audioBuffer.duration.toFixed(2)),
      };
    } finally {
      await ctx.close().catch(() => {});
    }
  } catch {
    return {
      peaks: fallbackPeaksFromPcm(arrayBuffer, bucketCount),
      durationSeconds: 0,
    };
  }
}

function fallbackPeaksFromPcm(arrayBuffer: ArrayBuffer, bucketCount: number): number[] {
  const view = new DataView(arrayBuffer);
  const dataOffset = 44;
  if (view.byteLength <= dataOffset + 4) {
    return Array.from({ length: bucketCount }, () => 0.25);
  }
  const sampleCount = Math.floor((view.byteLength - dataOffset) / 2);
  const step = Math.max(1, Math.floor(sampleCount / bucketCount));
  const peaks: number[] = [];
  let maxPeak = 1;

  for (let i = 0; i < bucketCount; i++) {
    const startSample = i * step;
    const endSample = Math.min(sampleCount, startSample + step);
    let peak = 0;
    for (let s = startSample; s < endSample; s++) {
      const bytePos = dataOffset + s * 2;
      if (bytePos + 1 < view.byteLength) {
        const val = Math.abs(view.getInt16(bytePos, true));
        if (val > peak) peak = val;
      }
    }
    peaks.push(peak);
    if (peak > maxPeak) maxPeak = peak;
  }

  return peaks.map((p) => Math.max(0.08, Number((p / maxPeak).toFixed(3))));
}

export function formatTimecode(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00.0";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const tenths = Math.floor((seconds % 1) * 10);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${tenths}`;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function downloadAudioFile(blobUrl: string, filename: string): void {
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
