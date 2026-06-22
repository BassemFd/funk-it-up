import { useFrame, useThree } from "@react-three/fiber";
import { useGameStore } from "../../store/useGameStore";

const CAMERA_OFFSET_X = -4;
const CAMERA_Y = 3;
const CAMERA_Z = 12;
const LERP_SPEED = 0.08;

export function FollowCamera() {
  const { camera } = useThree();
  const characterX = useGameStore((s) => s.character.x);

  useFrame(() => {
    const targetX = characterX + CAMERA_OFFSET_X;
    camera.position.x += (targetX - camera.position.x) * LERP_SPEED;
    camera.position.y = CAMERA_Y;
    camera.position.z = CAMERA_Z;
    camera.lookAt(characterX, 1, 0);
  });

  return null;
}
