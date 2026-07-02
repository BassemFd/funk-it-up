// Shared mutable camera-orbit state, read every frame by FollowCamera (inside
// the R3F Canvas) and mutated by CameraTiltControls (plain DOM buttons +
// keyboard, outside the Canvas). Same cross-boundary mutable-ref pattern as
// characterVisualX — avoids routing a per-frame-changing value through React
// state/props.
const DEFAULT_YAW = 0; // 0 = default side view (camera on +Z)
const DEFAULT_PITCH = 0.033; // 0 = level with the look-at height

export const cameraOrbit = {
  yaw: DEFAULT_YAW,
  pitch: DEFAULT_PITCH,
  held: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
};

export function resetCameraOrbit(): void {
  cameraOrbit.yaw = DEFAULT_YAW;
  cameraOrbit.pitch = DEFAULT_PITCH;
}

export const CAMERA_ORBIT_LIMITS = {
  maxPitch: 1.3, // ~75°, stops just short of flipping over the top/bottom
  rotateSpeed: 1.4, // radians/sec while a direction is held
};
