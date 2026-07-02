import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { useGameStore } from "../../store/useGameStore";
import { gameStore } from "../../store/useGameStore";
import { PLATFORM_SPACING } from "../../engine/PlatformGenerator";
import { characterVisualX } from "../characterVisualX";

// Must match Platforms.tsx: PLATFORM_Y (0) + height (0.4) / 2 — the world Y
// where a GROUND/THE_ONE platform's top surface actually sits. The whole
// character model below is built with its own local Y=0 at the character's
// feet, so this is the only number needed to keep it standing flush on top
// of a platform instead of sinking into it.
const PLATFORM_TOP_Y = 0.2;

const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.35; // seconds
const LEG_SWING = 0.7; // radians
const ARM_SWING = 0.5; // radians
const BASE_SCALE = 1.5; // overall character size multiplier

// Velocity-based stretch while airborne: taller/thinner at takeoff and just
// before landing (high vertical speed), more neutral at the apex (speed ~0).
const AIR_STRETCH_MAX = 0.3;

// Landing impact: a quick springy squash that overshoots and settles,
// instead of snapping straight back to the resting pose.
const LAND_SQUASH_DURATION = 0.32; // seconds
const LAND_SQUASH_AMPLITUDE = 0.4;
const LAND_SQUASH_DECAY = 13; // 1/s
const LAND_SQUASH_FREQ = 5.5; // Hz

const SKIN_COLOR = "#c88850";
const SUIT_COLOR = "#30d8c0";
const AFRO_COLOR = "#2a1810";
const SPARKLE_COLOR = "#fff060";

export function Character() {
  const meshRef = useRef<Group>(null);
  const squashRef = useRef<Group>(null);
  const legLRef = useRef<Group>(null);
  const legRRef = useRef<Group>(null);
  const armLRef = useRef<Group>(null);
  const armRRef = useRef<Group>(null);
  const jumpStartRef = useRef<number | null>(null);
  const landingStartRef = useRef<number | null>(null);
  const prevIsJumpingRef = useRef(false);
  const prevStatusRef = useRef<string>("IDLE");

  const isJumping = useGameStore((s) => s.character.isJumping);
  const bpm = useGameStore((s) => s.bpm) ?? 98;
  const status = useGameStore((s) => s.status);

  // units per second: one platform per beat interval
  const speedRef = useRef(0);
  speedRef.current = PLATFORM_SPACING / ((60 / bpm) * 1000) * 1000;

  useFrame(({ clock }, delta) => {
    if (!meshRef.current || !squashRef.current) return;

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

    // Landing edge-detect — fires the instant isJumping flips true -> false
    const justLanded = prevIsJumpingRef.current && !isJumping;
    prevIsJumpingRef.current = isJumping;
    if (justLanded) landingStartRef.current = clock.elapsedTime;

    // Jump arc
    let jumpT = 0;
    if (isJumping) {
      if (jumpStartRef.current === null) jumpStartRef.current = clock.elapsedTime;
      jumpT = (clock.elapsedTime - jumpStartRef.current) / JUMP_DURATION;
      if (jumpT >= 1) {
        jumpT = 1;
        jumpStartRef.current = null;
        gameStore.getState().landCharacter();
      }
      meshRef.current.position.y = PLATFORM_TOP_Y + Math.sin(Math.PI * jumpT) * JUMP_HEIGHT;
    } else {
      jumpStartRef.current = null;
      meshRef.current.position.y = PLATFORM_TOP_Y;
    }

    // Squash & stretch — feet-anchored, so it never looks like the character
    // is floating above or sinking into the platform while it deforms.
    let stretchY = 1;
    if (isJumping) {
      const verticalSpeed = Math.abs(Math.cos(Math.PI * jumpT)); // 1 at takeoff/landing, 0 at apex
      stretchY = 1 + verticalSpeed * AIR_STRETCH_MAX;
    } else if (landingStartRef.current !== null) {
      const s = clock.elapsedTime - landingStartRef.current;
      if (s >= LAND_SQUASH_DURATION) {
        landingStartRef.current = null;
      } else {
        stretchY = 1 - LAND_SQUASH_AMPLITUDE * Math.exp(-s * LAND_SQUASH_DECAY) * Math.cos(s * LAND_SQUASH_FREQ * Math.PI * 2);
      }
    }
    const stretchXZ = 1 / Math.sqrt(stretchY);
    squashRef.current.scale.set(stretchXZ, stretchY, stretchXZ);

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
    <group ref={meshRef} position={[0, PLATFORM_TOP_Y, 0]}>
      {/* squash/stretch pivot — local Y=0 is the character's feet, so
          scaling this group never detaches the feet from the ground */}
      <group ref={squashRef}>
        {/* facing + overall size — body is modeled facing local +Z, rotated
            90° so it faces its actual direction of travel (world +X) */}
        <group rotation={[0, Math.PI / 2, 0]} scale={[BASE_SCALE, BASE_SCALE, BASE_SCALE]}>
          {/* legs — pivoted from the hip so they swing like real limbs */}
          <group ref={legLRef} position={[-0.13, 0.33, 0]}>
            <mesh position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.09, 0.18, 6, 12]} />
              <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.15} roughness={0.6} metalness={0.1} />
            </mesh>
          </group>
          <group ref={legRRef} position={[0.13, 0.33, 0]}>
            <mesh position={[0, -0.15, 0]}>
              <capsuleGeometry args={[0.09, 0.18, 6, 12]} />
              <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.15} roughness={0.6} metalness={0.1} />
            </mesh>
          </group>

          {/* jumpsuit torso */}
          <mesh position={[0, 0.54, 0]}>
            <capsuleGeometry args={[0.22, 0.24, 6, 12]} />
            <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.2} roughness={0.6} metalness={0.1} />
          </mesh>

          {/* rhinestone medallion */}
          <mesh position={[0, 0.59, 0.2]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={SPARKLE_COLOR} emissive={SPARKLE_COLOR} emissiveIntensity={1} roughness={0.1} metalness={0.8} />
          </mesh>

          {/* arms — pivoted from the shoulder */}
          <group ref={armLRef} position={[-0.3, 0.71, 0]}>
            <mesh position={[0, -0.14, 0]}>
              <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
              <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.18} roughness={0.6} metalness={0.1} />
            </mesh>
          </group>
          <group ref={armRRef} position={[0.3, 0.71, 0]}>
            <mesh position={[0, -0.14, 0]}>
              <capsuleGeometry args={[0.07, 0.2, 6, 12]} />
              <meshStandardMaterial color={SUIT_COLOR} emissive={SUIT_COLOR} emissiveIntensity={0.18} roughness={0.6} metalness={0.1} />
            </mesh>
          </group>

          {/* head (skin) */}
          <mesh position={[0, 0.89, 0]}>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial color={SKIN_COLOR} emissive={SKIN_COLOR} emissiveIntensity={0.1} roughness={0.7} />
          </mesh>

          {/* shades */}
          <mesh position={[0, 0.91, 0.18]}>
            <boxGeometry args={[0.32, 0.06, 0.05]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.6} />
          </mesh>

          {/* big funk afro */}
          <mesh position={[0, 1.15, 0]}>
            <sphereGeometry args={[0.32, 24, 24]} />
            <meshStandardMaterial color={AFRO_COLOR} roughness={1} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
