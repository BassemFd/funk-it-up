import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { useGameStore } from "../../store/useGameStore";
import { gameStore } from "../../store/useGameStore";
import { PLATFORM_SPACING } from "../../engine/PlatformGenerator";
import { characterVisualX } from "../characterVisualX";

const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.35; // seconds

const SKIN_COLOR = "#c88850";
const SUIT_COLOR = "#30d8c0";
const AFRO_COLOR = "#2a1810";
const SPARKLE_COLOR = "#fff060";

export function Character() {
  const meshRef = useRef<Group>(null);
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
    <group ref={meshRef} position={[0, 0.5, 0]}>
      {/* bell-bottom legs */}
      <mesh position={[-0.13, -0.34, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.22]} />
        <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.13, -0.34, 0]}>
        <boxGeometry args={[0.2, 0.2, 0.22]} />
        <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.2} />
      </mesh>

      {/* jumpsuit torso */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.5, 0.42, 0.3]} />
        <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.3} />
      </mesh>

      {/* rhinestone medallion */}
      <mesh position={[0, 0.08, 0.16]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={SPARKLE_COLOR} emissive={SPARKLE_COLOR} emissiveIntensity={1} />
      </mesh>

      {/* arms */}
      <mesh position={[-0.32, 0.05, 0]}>
        <boxGeometry args={[0.14, 0.32, 0.16]} />
        <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[0.32, 0.05, 0]}>
        <boxGeometry args={[0.14, 0.32, 0.16]} />
        <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.25} />
      </mesh>

      {/* head (skin) */}
      <mesh position={[0, 0.36, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={SKIN_COLOR} emissive={SKIN_COLOR} emissiveIntensity={0.15} />
      </mesh>

      {/* shades */}
      <mesh position={[0, 0.38, 0.18]}>
        <boxGeometry args={[0.32, 0.06, 0.05]} />
        <meshStandardMaterial color="#0a0a0a" emissive="#0a0a0a" emissiveIntensity={0.6} />
      </mesh>

      {/* big funk afro */}
      <mesh position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={AFRO_COLOR} roughness={1} />
      </mesh>
    </group>
  );
}
