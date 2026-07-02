import { useFrame, useThree } from "@react-three/fiber";
import { characterVisualX } from "../characterVisualX";
import { cameraOrbit, CAMERA_ORBIT_LIMITS } from "../cameraOrbit";

// Camera orbits the character on a fixed-radius "leash" — like it's tied to
// the character with a cord. yaw/pitch come from cameraOrbit (mutated by the
// on-screen tilt buttons); at yaw=0/pitch=0 this reduces to the original
// pure Mario-style side view.
const RADIUS = 9;
const LOOK_AT_Y = 1.4;

export function FollowCamera() {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const vx = characterVisualX.current;
    const { held } = cameraOrbit;
    const { maxPitch, rotateSpeed } = CAMERA_ORBIT_LIMITS;

    if (held.left) cameraOrbit.yaw -= rotateSpeed * delta;
    if (held.right) cameraOrbit.yaw += rotateSpeed * delta;
    if (held.up) cameraOrbit.pitch = Math.min(maxPitch, cameraOrbit.pitch + rotateSpeed * delta);
    if (held.down) cameraOrbit.pitch = Math.max(-maxPitch, cameraOrbit.pitch - rotateSpeed * delta);

    const { yaw, pitch } = cameraOrbit;

    // Spherical offset around the character — no lerp on any axis: the
    // character moves at constant velocity (nothing to smooth) and the
    // orbit angles only change while a tilt button is held, so a direct
    // 1:1 follow keeps the character dead-center at all times.
    camera.position.set(
      vx + RADIUS * Math.sin(yaw) * Math.cos(pitch),
      LOOK_AT_Y + RADIUS * Math.sin(pitch),
      RADIUS * Math.cos(yaw) * Math.cos(pitch),
    );
    camera.lookAt(vx, LOOK_AT_Y, 0);
  });

  return null;
}
