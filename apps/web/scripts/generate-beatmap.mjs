#!/usr/bin/env node
// Offline preprocessing: turns a real audio file into a beatmap JSON the
// game consumes at runtime. Run once per track, not part of the app build.
//
// Why this exists: BeatEngine/PlatformGenerator used to assume a perfectly
// metronomic track (beat_n = n * 60000/bpm, first beat at t=0). A real
// recording by an 11-piece live band has neither — there's a lead-in before
// the groove starts, and the tempo drifts a little take to take (the
// "pocket"). aubio's `beat` command tracks the actual beat pulse in the
// audio; `onset` detects individual note/hit attacks. We use real beat
// timestamps as the game's actual timing grid, and onset density around
// each beat as a proxy for "how much is happening musically right here" —
// there's no reliable free tool for true downbeat/energy detection, but
// onset density is a real, measured signal, not invented.
//
// Usage: node generate-beatmap.mjs <input.mp3> <output.json>

import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const [, , inputPath, outputPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error("Usage: node generate-beatmap.mjs <input.mp3> <output.json>");
  process.exit(1);
}

function runAubio(command, file) {
  const raw = execFileSync("aubio", [command, file], { encoding: "utf-8", maxBuffer: 1024 * 1024 * 32 });
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => parseFloat(line) * 1000); // seconds -> ms
}

console.log(`Analyzing ${inputPath}...`);
const beatTimesMs = runAubio("beat", inputPath);
const onsetTimesMs = runAubio("onset", inputPath);

if (beatTimesMs.length === 0) {
  console.error("No beats detected — is aubio installed? `brew install aubio`");
  process.exit(1);
}

// Energy per beat = count of onsets landing in [thisBeat, nextBeat).
// Last beat uses the average interval as its window width.
const avgIntervalMs =
  (beatTimesMs[beatTimesMs.length - 1] - beatTimesMs[0]) / (beatTimesMs.length - 1);

const beats = beatTimesMs.map((timeMs, i) => {
  const windowEnd = beatTimesMs[i + 1] ?? timeMs + avgIntervalMs;
  const energy = onsetTimesMs.filter((t) => t >= timeMs && t < windowEnd).length;
  return { timeMs: Math.round(timeMs * 1000) / 1000, energy };
});

const beatmap = {
  source: inputPath.split("/").pop(),
  generatedWith: "aubio (beat + onset)",
  generatedAt: new Date().toISOString(),
  beats,
};

writeFileSync(outputPath, JSON.stringify(beatmap, null, 2));
console.log(`Wrote ${beats.length} beats to ${outputPath}`);
