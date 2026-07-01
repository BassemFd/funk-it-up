import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { characterVisualX } from "../characterVisualX";
import { gameStore } from "../../store/useGameStore";

const CAMERA_OFFSET_X = -6;
const CAMERA_Y = 4;
const CAMERA_Z = 14;
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

    // Fixed rotation: always look 6 units ahead of camera position.
    // Direction vector (6, -3, -14) is constant — pure translation, zero camera rotation.
    camera.lookAt(camera.position.x - CAMERA_OFFSET_X, 1, 0);
  });

  return null;
}
