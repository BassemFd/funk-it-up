import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { characterVisualX } from "../characterVisualX";
import { gameStore } from "../../store/useGameStore";

// Pure side view, Mario-style: camera tracks directly beside the character
// (no X lead/lag) and looks straight across the Z axis instead of diagonally
// from behind, with camera/look-at heights close together for a flat,
// horizontal angle instead of looking down.
const CAMERA_OFFSET_X = 0;
const CAMERA_Y = 1.7;
const CAMERA_Z = 9;
const LOOK_AT_Y = 1.4;

export function FollowCamera() {
  const { camera } = useThree();

  useFrame(() => {
    const vx = characterVisualX.current;

    // The character moves at constant velocity along X with no sudden jumps
    // (only Y jumps for the beat hops), so there's nothing to smooth here —
    // lerping toward a continuously-moving target would just leave the
    // camera permanently trailing behind it, off-centering the character.
    // A direct 1:1 follow keeps it dead-center every frame.
    camera.position.set(vx + CAMERA_OFFSET_X, CAMERA_Y, CAMERA_Z);

    // Fixed rotation: always look at the same relative point ahead of the
    // camera — a constant direction vector, pure translation, zero camera
    // rotation drift.
    camera.lookAt(vx, LOOK_AT_Y, 0);
  });

  return null;
}
