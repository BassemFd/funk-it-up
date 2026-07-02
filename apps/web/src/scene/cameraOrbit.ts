// Shared mutable camera-orbit state, read every frame by FollowCamera (inside
// the R3F Canvas) and mutated by CameraTiltControls (plain DOM buttons
// outside the Canvas). Same cross-boundary pattern as characterVisualX —
// avoids routing a per-frame-changing value through React state/props.
export const cameraOrbit = {
  yaw: 0, // radians, 0 = default side view (camera on +Z)
  pitch: 0.033, // radians, 0 = level with the look-at height
  held: {
    up: false,
    down: false,
    left: false,
    right: false,
  },
};

export const CAMERA_ORBIT_LIMITS = {
  maxPitch: 1.3, // ~75°, stops just short of flipping over the top/bottom
  rotateSpeed: 1.4, // radians/sec while a direction is held
};
