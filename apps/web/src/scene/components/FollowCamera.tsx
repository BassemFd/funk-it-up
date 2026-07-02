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
const POS_LERP = 0.1;

export function FollowCamera() {
  const { camera } = useThree();
  const prevStatusRef = useRef("IDLE");

  useFrame(() => {
    const vx = characterVisualX.current;
    const status = gameStore.getState().status;

    // Snap camera instantly on game start/restart — no lerp from wrong position
    if (prevStatusRef.current !== "PLAYING" && status === "PLAYING") {
      camera.position.set(vx + CAMERA_OFFSET_X, CAMERA_Y, CAMERA_Z);
    }
    prevStatusRef.current = status;

    // Lerp camera X toward target
    const targetX = vx + CAMERA_OFFSET_X;
    camera.position.x += (targetX - camera.position.x) * POS_LERP;
    camera.position.y = CAMERA_Y;
    camera.position.z = CAMERA_Z;

    // Fixed rotation: always look at the same relative point ahead of the
    // camera — a constant direction vector, pure translation, zero camera
    // rotation drift.
    camera.lookAt(camera.position.x - CAMERA_OFFSET_X, LOOK_AT_Y, 0);
  });

  return null;
}
