import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DirectionalLight } from "three";
import { BeatEngine } from "../../engine/BeatEngine";

interface Props {
  engine: BeatEngine;
}

export function BeatPulse({ engine: _engine }: Props) {
  const lightRef = useRef<DirectionalLight>(null);
  const pulseRef = useRef(0);

  useFrame(() => {
    if (!lightRef.current) return;
    pulseRef.current = Math.max(0, pulseRef.current - 0.05);
    lightRef.current.intensity = 1.2 + pulseRef.current * 2;
  });

  return (
    <>
      <ambientLight intensity={0.4} color="#9060c0" />
      <directionalLight
        ref={lightRef}
        position={[5, 10, 5]}
        intensity={1.2}
        color="#ffffff"
      />
      <pointLight position={[0, 4, 2]} intensity={0.8} color="#e040fb" />
    </>
  );
}
