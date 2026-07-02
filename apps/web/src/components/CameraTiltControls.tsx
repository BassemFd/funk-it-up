import { useEffect } from "react";
import { cameraOrbit, resetCameraOrbit } from "../scene/cameraOrbit";

type Direction = keyof typeof cameraOrbit.held;

const ARROW_KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
};

// Keyboard control for the camera: arrow keys orbit (held down = keep
// orbiting, same as the D-pad buttons), R snaps back to the default view.
function useCameraKeyboardControls() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const direction = ARROW_KEY_DIRECTIONS[e.code];
      if (direction) {
        e.preventDefault();
        cameraOrbit.held[direction] = true;
        return;
      }
      if (e.code === "KeyR") {
        resetCameraOrbit();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const direction = ARROW_KEY_DIRECTIONS[e.code];
      if (direction) cameraOrbit.held[direction] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);
}

// Held-while-pressed buttons: press and hold to keep orbiting, release to
// stop. Mirrors the pattern of a physical D-pad rather than one-shot clicks.
function usePressHandlers(direction: Direction) {
  const start = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    cameraOrbit.held[direction] = true;
  };
  const stop = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    cameraOrbit.held[direction] = false;
  };
  return {
    onPointerDown: start,
    onPointerUp: stop,
    onPointerLeave: stop,
    onPointerCancel: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
}

export function CameraTiltControls() {
  useCameraKeyboardControls();

  const handlersUp = usePressHandlers("up");
  const handlersDown = usePressHandlers("down");
  const handlersLeft = usePressHandlers("left");
  const handlersRight = usePressHandlers("right");

  const reset = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    resetCameraOrbit();
  };

  return (
    <div style={styles.wrapper}>
      <button style={{ ...styles.btn, gridArea: "up" }} {...handlersUp} aria-label="Tilt camera up">
        ▲
      </button>
      <button style={{ ...styles.btn, gridArea: "left" }} {...handlersLeft} aria-label="Orbit camera left">
        ◀
      </button>
      <button style={{ ...styles.btn, ...styles.resetBtn, gridArea: "mid" }} onClick={reset} aria-label="Reset camera">
        ●
      </button>
      <button style={{ ...styles.btn, gridArea: "right" }} {...handlersRight} aria-label="Orbit camera right">
        ▶
      </button>
      <button style={{ ...styles.btn, gridArea: "down" }} {...handlersDown} aria-label="Tilt camera down">
        ▼
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: "absolute",
    bottom: 16,
    left: 16,
    display: "grid",
    gridTemplateAreas: `". up ." "left mid right" ". down ."`,
    gridTemplateColumns: "36px 36px 36px",
    gridTemplateRows: "36px 36px 36px",
    gap: 4,
    zIndex: 10,
    userSelect: "none",
    touchAction: "none",
  },
  btn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    fontSize: 14,
    fontFamily: "monospace",
    background: "rgba(40, 10, 80, 0.9)",
    color: "#e0c0f0",
    border: "1px solid #6030a0",
    borderRadius: 6,
    cursor: "pointer",
  },
  resetBtn: {
    color: "#9060c0",
    fontSize: 10,
  },
};
