import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Mesh } from "three";
import { useGameStore } from "../../store/useGameStore";
import { gameStore } from "../../store/useGameStore";

const JUMP_HEIGHT = 2.5;
const JUMP_DURATION = 0.35; // seconds

export function Character() {
  const meshRef = useRef<Mesh>(null);
  const jumpStartRef = useRef<number | null>(null);
  const characterX = useGameStore((s) => s.character.x);
  const isJumping = useGameStore((s) => s.character.isJumping);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;

    // Follow x
    meshRef.current.position.x = characterX;

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
        // Parabolic arc: sin(π * t) gives smooth up-down
        meshRef.current.position.y = 0.5 + Math.sin(Math.PI * t) * JUMP_HEIGHT;
      }
    } else {
      jumpStartRef.current = null;
      meshRef.current.position.y = 0.5;
    }

    // Squash & stretch for funk feel
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
