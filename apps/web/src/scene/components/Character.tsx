import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { useGameStore } from "../../store/useGameStore";
import { gameStore } from "../../store/useGameStore";
import { PLATFORM_SPACING } from "../../engine/PlatformGenerator";
import { characterVisualX } from "../characterVisualX";

const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.35; // seconds

export function Character() {
  const meshRef = useRef<Mesh>(null);
  const jumpStartRef = useRef<number | null>(null);
  const prevStatusRef = useRef<string>("IDLE");

  const isJumping = useGameStore((s) => s.character.isJumping);
  const bpm = useGameStore((s) => s.bpm) ?? 98;
  const status = useGameStore((s) => s.status);

  // units per second: one platform per beat interval
  const speedRef = useRef(0);
  speedRef.current = PLATFORM_SPACING / ((60 / bpm) * 1000) * 1000;

  useFrame(({ clock }, delta) => {
    if (!meshRef.current) return;

    // Reset visual position on game start
    if (prevStatusRef.current !== "PLAYING" && status === "PLAYING") {
      characterVisualX.current = 0;
    }
    prevStatusRef.current = status;

    // Continuous forward movement
    if (status === "PLAYING") {
      characterVisualX.current += speedRef.current * delta;
    }

    meshRef.current.position.x = characterVisualX.current;

    // Jump arc
    if (isJumping) {
      if (jumpStartRef.current === null) {
        jumpStartRef.current = clock.elapsedTime;
      }
      const t = (clock.elapsedTime - jumpStartRef.current) / JUMP_DURATION;
      if (t >= 1) {
        meshRef.current.position.y = 0.5;
        jumpStartRef.current = null;
        gameStore.getState().landCharacter();
      } else {
        meshRef.current.position.y = 0.5 + Math.sin(Math.PI * t) * JUMP_HEIGHT;
      }
    } else {
      jumpStartRef.current = null;
      meshRef.current.position.y = 0.5;
    }

    // Squash & stretch
    const squash = isJumping ? 1.2 : 1;
    meshRef.current.scale.set(1 / squash, squash, 1);
  });

  return (
    <mesh ref={meshRef} position={[0, 0.5, 0]}>
      <boxGeometry args={[0.7, 0.7, 0.7]} />
      <meshStandardMaterial color="#f0c040" emissive="#f0c040" emissiveIntensity={0.3} />
    </mesh>
  );
}
