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
const LEG_SWING = 0.7; // radians, hip pivot
const KNEE_BEND = 0.9; // radians, knee pivot — only ever bends backward
const ARM_SWING = 0.5; // radians, shoulder pivot
const ELBOW_BEND = 0.4; // radians, fixed relaxed bend while running
const BASE_SCALE = 1.3; // overall character size multiplier

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
const SHOE_COLOR = "#1a1410";
const AFRO_COLOR = "#2a1810";
const SPARKLE_COLOR = "#fff060";

const suitMat = { color: SUIT_COLOR, roughness: 0.6, metalness: 0.1 } as const;

export function Character() {
  const meshRef = useRef<Group>(null);
  const squashRef = useRef<Group>(null);
  const hipLRef = useRef<Group>(null);
  const hipRRef = useRef<Group>(null);
  const kneeLRef = useRef<Group>(null);
  const kneeRRef = useRef<Group>(null);
  const shoulderLRef = useRef<Group>(null);
  const shoulderRRef = useRef<Group>(null);
  const elbowLRef = useRef<Group>(null);
  const elbowRRef = useRef<Group>(null);
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
    // moves to the music. Hips/shoulders swing in counter-phase like a real
    // walk cycle. Because of the 90°-Y-rotated body, a POSITIVE hip
    // rotation.x actually swings the leg toward world -X (backward/stance),
    // and negative swings it toward world +X (forward/recovery) — so the
    // knee must only bend while its own hip angle is negative, i.e. while
    // that leg is swinging forward, never while it's planted behind the body.
    if (status === "PLAYING") {
      const strideHz = bpm / 60;
      const phase = clock.elapsedTime * strideHz * Math.PI * 2;
      const swing = Math.sin(phase);
      const kneeL = Math.max(0, -swing) * KNEE_BEND;
      const kneeR = Math.max(0, swing) * KNEE_BEND;

      if (hipLRef.current) hipLRef.current.rotation.x = swing * LEG_SWING;
      if (hipRRef.current) hipRRef.current.rotation.x = -swing * LEG_SWING;
      if (kneeLRef.current) kneeLRef.current.rotation.x = kneeL;
      if (kneeRRef.current) kneeRRef.current.rotation.x = kneeR;
      if (shoulderLRef.current) shoulderLRef.current.rotation.x = -swing * ARM_SWING;
      if (shoulderRRef.current) shoulderRRef.current.rotation.x = swing * ARM_SWING;
      // Same convention as the knee: positive rotation.x bends a joint
      // backward, negative bends it forward — elbows only ever bend forward.
      if (elbowLRef.current) elbowLRef.current.rotation.x = -ELBOW_BEND;
      if (elbowRRef.current) elbowRRef.current.rotation.x = -ELBOW_BEND;
    } else {
      if (hipLRef.current) hipLRef.current.rotation.x = 0;
      if (hipRRef.current) hipRRef.current.rotation.x = 0;
      if (kneeLRef.current) kneeLRef.current.rotation.x = 0;
      if (kneeRRef.current) kneeRRef.current.rotation.x = 0;
      if (shoulderLRef.current) shoulderLRef.current.rotation.x = 0;
      if (shoulderRRef.current) shoulderRRef.current.rotation.x = 0;
      if (elbowLRef.current) elbowLRef.current.rotation.x = 0;
      if (elbowRRef.current) elbowRRef.current.rotation.x = 0;
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
          {/* ── legs: hip -> thigh -> knee -> shin -> foot ─────────────── */}
          <group ref={hipLRef} position={[-0.13, 0.54, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 10, 10]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <mesh position={[0, -0.13, 0]}>
              <boxGeometry args={[0.14, 0.26, 0.16]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <group ref={kneeLRef} position={[0, -0.26, 0]}>
              <mesh>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.14, 0]}>
                <boxGeometry args={[0.12, 0.28, 0.14]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.29, 0.03]}>
                <boxGeometry args={[0.11, 0.07, 0.19]} />
                <meshStandardMaterial color={SHOE_COLOR} roughness={0.4} />
              </mesh>
            </group>
          </group>

          <group ref={hipRRef} position={[0.13, 0.54, 0]}>
            <mesh>
              <sphereGeometry args={[0.075, 10, 10]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <mesh position={[0, -0.13, 0]}>
              <boxGeometry args={[0.14, 0.26, 0.16]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <group ref={kneeRRef} position={[0, -0.26, 0]}>
              <mesh>
                <sphereGeometry args={[0.06, 10, 10]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.14, 0]}>
                <boxGeometry args={[0.12, 0.28, 0.14]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.29, 0.03]}>
                <boxGeometry args={[0.11, 0.07, 0.19]} />
                <meshStandardMaterial color={SHOE_COLOR} roughness={0.4} />
              </mesh>
            </group>
          </group>

          {/* ── torso: tapered pelvis -> chest ──────────────────────────── */}
          <mesh position={[0, 0.62, 0]}>
            <boxGeometry args={[0.32, 0.16, 0.2]} />
            <meshStandardMaterial {...suitMat} />
          </mesh>
          <mesh position={[0, 0.86, 0]}>
            <boxGeometry args={[0.4, 0.32, 0.22]} />
            <meshStandardMaterial {...suitMat} />
          </mesh>

          {/* rhinestone medallion */}
          <mesh position={[0, 0.9, 0.13]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial color={SPARKLE_COLOR} emissive={SPARKLE_COLOR} emissiveIntensity={1} roughness={0.1} metalness={0.8} />
          </mesh>

          {/* ── arms: shoulder -> upper arm -> elbow -> forearm -> hand ── */}
          <group ref={shoulderLRef} position={[-0.24, 1, 0]}>
            <mesh>
              <sphereGeometry args={[0.085, 10, 10]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <mesh position={[0, -0.11, 0]}>
              <boxGeometry args={[0.09, 0.22, 0.11]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <group ref={elbowLRef} position={[0, -0.22, 0]}>
              <mesh>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[0.075, 0.2, 0.09]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.22, 0]}>
                <sphereGeometry args={[0.055, 10, 10]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
              </mesh>
            </group>
          </group>

          <group ref={shoulderRRef} position={[0.24, 1, 0]}>
            <mesh>
              <sphereGeometry args={[0.085, 10, 10]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <mesh position={[0, -0.11, 0]}>
              <boxGeometry args={[0.09, 0.22, 0.11]} />
              <meshStandardMaterial {...suitMat} />
            </mesh>
            <group ref={elbowRRef} position={[0, -0.22, 0]}>
              <mesh>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.1, 0]}>
                <boxGeometry args={[0.075, 0.2, 0.09]} />
                <meshStandardMaterial {...suitMat} />
              </mesh>
              <mesh position={[0, -0.22, 0]}>
                <sphereGeometry args={[0.055, 10, 10]} />
                <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
              </mesh>
            </group>
          </group>

          {/* ── head: neck -> jaw -> cranium ─────────────────────────────── */}
          <mesh position={[0, 1.06, 0]}>
            <boxGeometry args={[0.12, 0.08, 0.12]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.14, 0]}>
            <boxGeometry args={[0.16, 0.08, 0.17]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.28, 0]}>
            <boxGeometry args={[0.19, 0.2, 0.2]} />
            <meshStandardMaterial color={SKIN_COLOR} roughness={0.7} />
          </mesh>

          {/* shades */}
          <mesh position={[0, 1.25, 0.1]}>
            <boxGeometry args={[0.21, 0.05, 0.04]} />
            <meshStandardMaterial color="#0a0a0a" roughness={0.2} metalness={0.6} />
          </mesh>

          {/* big funk afro */}
          <mesh position={[0, 1.53, 0]}>
            <sphereGeometry args={[0.28, 24, 24]} />
            <meshStandardMaterial color={AFRO_COLOR} roughness={1} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
