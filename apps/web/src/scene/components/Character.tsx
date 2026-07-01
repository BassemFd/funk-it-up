import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { useGameStore } from "../../store/useGameStore";
import { gameStore } from "../../store/useGameStore";
import { PLATFORM_SPACING } from "../../engine/PlatformGenerator";
import { characterVisualX } from "../characterVisualX";

const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.35; // seconds
const LEG_SWING = 0.7; // radians
const ARM_SWING = 0.5; // radians

const SKIN_COLOR = "#c88850";
const SUIT_COLOR = "#30d8c0";
const AFRO_COLOR = "#2a1810";
const SPARKLE_COLOR = "#fff060";

export function Character() {
  const meshRef = useRef<Group>(null);
  const legLRef = useRef<Group>(null);
  const legRRef = useRef<Group>(null);
  const armLRef = useRef<Group>(null);
  const armRRef = useRef<Group>(null);
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

    // Squash & stretch (squish both horizontal axes so it still reads
    // correctly now that the body is rotated to face its direction of travel)
    const squash = isJumping ? 1.2 : 1;
    const horizontal = 1 / Math.sqrt(squash);
    meshRef.current.scale.set(horizontal, squash, horizontal);

    // Running gait — one full stride per beat, so the character literally
    // moves to the music. Opposite arm/leg pairs swing in counter-phase,
    // like a real walk cycle.
    if (status === "PLAYING") {
      const strideHz = bpm / 60;
      const phase = clock.elapsedTime * strideHz * Math.PI * 2;
      const swing = Math.sin(phase);

      if (legLRef.current) legLRef.current.rotation.x = swing * LEG_SWING;
      if (legRRef.current) legRRef.current.rotation.x = -swing * LEG_SWING;
      if (armLRef.current) armLRef.current.rotation.x = -swing * ARM_SWING;
      if (armRRef.current) armRRef.current.rotation.x = swing * ARM_SWING;
    } else {
      if (legLRef.current) legLRef.current.rotation.x = 0;
      if (legRRef.current) legRRef.current.rotation.x = 0;
      if (armLRef.current) armLRef.current.rotation.x = 0;
      if (armRRef.current) armRRef.current.rotation.x = 0;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0.5, 0]}>
    {/* The body is modeled facing local +Z (that's where the shades/medallion
        sit). The character actually runs toward world +X, so rotate the
        whole body 90° around Y here — this also makes each limb's local
        rotation.x swing land in the X/Y plane, i.e. forward/backward along
        the direction of travel, instead of side-to-side across the screen. */}
    <group rotation={[0, Math.PI / 2, 0]}>
      {/* legs — pivoted from the hip so they swing like real limbs */}
      <group ref={legLRef} position={[-0.13, -0.16, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.09, 0.18, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.2} />
        </mesh>
      </group>
      <group ref={legRRef} position={[0.13, -0.16, 0]}>
        <mesh position={[0, -0.15, 0]}>
          <capsuleGeometry args={[0.09, 0.18, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.2} />
        </mesh>
      </group>

      {/* jumpsuit torso */}
      <mesh position={[0, 0.05, 0]}>
        <capsuleGeometry args={[0.22, 0.24, 4, 8]} />
        <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.3} />
      </mesh>

      {/* rhinestone medallion */}
      <mesh position={[0, 0.1, 0.2]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={SPARKLE_COLOR} emissive={SPARKLE_COLOR} emissiveIntensity={1} />
      </mesh>

      {/* arms — pivoted from the shoulder */}
      <group ref={armLRef} position={[-0.3, 0.22, 0]}>
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.25} />
        </mesh>
      </group>
      <group ref={armRRef} position={[0.3, 0.22, 0]}>
        <mesh position={[0, -0.14, 0]}>
          <capsuleGeometry args={[0.07, 0.2, 4, 8]} />
          <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.25} />
        </mesh>
      </group>

      {/* head (skin) */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={SKIN_COLOR} emissive={SKIN_COLOR} emissiveIntensity={0.15} />
      </mesh>

      {/* shades */}
      <mesh position={[0, 0.42, 0.18]}>
        <boxGeometry args={[0.32, 0.06, 0.05]} />
        <meshStandardMaterial color="#0a0a0a" emissive="#0a0a0a" emissiveIntensity={0.6} />
      </mesh>

      {/* big funk afro */}
      <mesh position={[0, 0.66, 0]}>
        <sphereGeometry args={[0.32, 16, 16]} />
        <meshStandardMaterial color={AFRO_COLOR} roughness={1} />
      </mesh>
    </group>
    </group>
  );
}
