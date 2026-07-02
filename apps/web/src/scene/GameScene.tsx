import { Canvas } from "@react-three/fiber";
import { BeatEngine } from "../engine/BeatEngine";
import { BeatmapEntry } from "../engine/PlatformGenerator";
import { BeatLoop } from "./components/BeatLoop";
import { BeatPulse } from "./components/BeatPulse";
import { Character } from "./components/Character";
import { FollowCamera } from "./components/FollowCamera";
import { Platforms } from "./components/Platforms";

interface Props {
  engine: BeatEngine;
  beatmap: BeatmapEntry[];
}

export function GameScene({ engine, beatmap }: Props) {
  return (
    <Canvas
      camera={{ position: [-4, 3, 12], fov: 60 }}
      style={{ width: "100%", height: "100%" }}
    >
      <color attach="background" args={["#1a0533"]} />
      <fog attach="fog" args={["#1a0533", 20, 60]} />

      <BeatPulse engine={engine} />
      <BeatLoop engine={engine} />
      <FollowCamera />

      <Platforms beatmap={beatmap} />
      <Character />
    </Canvas>
  );
}
