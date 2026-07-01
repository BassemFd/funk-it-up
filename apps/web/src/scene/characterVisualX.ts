// Shared mutable position updated in Character.useFrame and read in FollowCamera.useFrame.
// Bypasses Zustand to avoid per-frame re-renders — purely visual, never stored.
export const characterVisualX = { current: 0 };
