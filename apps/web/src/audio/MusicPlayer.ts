// Owns the AudioContext that the whole game's timing is built on.
//
// Why: a rhythm game must never let its visual beat clock drift from what
// the player actually hears. requestAnimationFrame-based clocks (what
// react-three-fiber's useFrame gives you) are tied to display refresh and
// can jitter; AudioContext.currentTime is a hardware audio clock, sample-
// accurate and stable for the entire session. So instead of driving
// BeatEngine off Three.js's clock, BeatLoop reads elapsed time from here.
export class MusicPlayer {
  private context: AudioContext | null = null;
  private buffer: AudioBuffer | null = null;
  private source: AudioBufferSourceNode | null = null;
  private startedAtContextTime = 0;
  private playing = false;

  private ensureContext(): AudioContext {
    if (!this.context) this.context = new AudioContext();
    return this.context;
  }

  async load(url: string): Promise<void> {
    const ctx = this.ensureContext();
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    this.buffer = await ctx.decodeAudioData(arrayBuffer);
  }

  get isLoaded(): boolean {
    return this.buffer !== null;
  }

  get isPlaying(): boolean {
    return this.playing;
  }

  // Must be called synchronously from a user-gesture handler (e.g. a click)
  // — browsers block AudioContext playback started any other way.
  play(): void {
    if (!this.buffer) return;
    const ctx = this.ensureContext();
    this.stop();

    if (ctx.state === "suspended") void ctx.resume();

    const source = ctx.createBufferSource();
    source.buffer = this.buffer;
    source.connect(ctx.destination);
    source.start();

    this.source = source;
    this.startedAtContextTime = ctx.currentTime;
    this.playing = true;
  }

  stop(): void {
    if (this.source) {
      try {
        this.source.stop();
      } catch {
        // already stopped naturally (track ended) — fine to ignore
      }
      this.source.disconnect();
      this.source = null;
    }
    this.playing = false;
  }

  // Milliseconds since play() was called. This is what BeatEngine.tick()
  // consumes — the single source of truth for "where are we in the song".
  getElapsedMs(): number {
    if (!this.playing || !this.context) return 0;
    return (this.context.currentTime - this.startedAtContextTime) * 1000;
  }
}

// Shared singleton — same cross-boundary pattern as characterVisualX/
// gameStore/cameraOrbit: App.tsx (outside the R3F Canvas) starts/stops
// playback from user-gesture handlers, BeatLoop (inside the Canvas) reads
// elapsed time from it every frame.
export const musicPlayer = new MusicPlayer();

if (import.meta.env.DEV) {
  (globalThis as unknown as { __musicPlayer: typeof musicPlayer }).__musicPlayer = musicPlayer;
}
