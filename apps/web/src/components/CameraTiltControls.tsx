import { cameraOrbit } from "../scene/cameraOrbit";

type Direction = keyof typeof cameraOrbit.held;

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
  const handlersUp = usePressHandlers("up");
  const handlersDown = usePressHandlers("down");
  const handlersLeft = usePressHandlers("left");
  const handlersRight = usePressHandlers("right");

  const reset = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    cameraOrbit.yaw = 0;
    cameraOrbit.pitch = 0.033;
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
